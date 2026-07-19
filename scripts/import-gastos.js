'use strict';

/**
 * Importa Gastos.csv (histórico de gastos del negocio) a la tabla Gastos.
 *
 * Uso:
 *   node scripts/import-gastos.js /ruta/a/Gastos.csv [--year=2026] [--dry-run]
 *
 * El CSV trae columnas FECHA, LUGAR, CONCEPTO, PRECIO (y columnas vacías +
 * un total al final de la primera fila, que se ignoran). Como "CONCEPTO" no
 * coincide 1 a 1 con las categorías de tu enum, este script los mapea así:
 *
 *   Pallet, Pallet pequeño          -> COMPRA_PALLETS
 *   Piso, Permiso                   -> ASISTENCIA_MERCADO
 *   Gasolina                        -> GASOLINA
 *   Utilidades                      -> RETIRO_SOCIOS (afectaUtilidad = false)
 *   Prestamos, Madre                -> OTRO (afectaUtilidad = false)
 *   cualquier otro concepto         -> OTRO (afectaUtilidad = true)
 *
 * "RETIRO_SOCIOS" y "Prestamos"/"Madre" quedan marcados con
 * afectaUtilidad=false: se guardan para tu historial, pero NO se restan de
 * la utilidad operativa en /api/metrics/resumen (son repartos o movimientos
 * personales, no costos del negocio).
 *
 * El concepto y el lugar originales SIEMPRE se guardan en "descripcion"
 * (ej. "Piso (OTAY)"), así que aunque la categoría sea aproximada, no
 * pierdes el detalle original.
 *
 * El renglón con CONCEPTO "Luis" se importa como OTRO/operativo pero se
 * imprime al final como "a revisar" — no hay suficiente contexto en el CSV
 * para saber si es un gasto real del negocio o un pago personal. Revísalo
 * y edítalo con PUT /api/gastos/:id si hace falta.
 *
 * Valida el total contra el que tenías en el CSV: los renglones de tu
 * archivo original suman $162,507.00 — el script imprime el total
 * importado al final para que compares.
 */

const fs = require('fs');
const path = require('path');
const db = require('../src/models');

const MESES = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

const CONCEPTO_A_CATEGORIA = {
  pallet: 'COMPRA_PALLETS',
  'pallet pequeño': 'COMPRA_PALLETS',
  piso: 'ASISTENCIA_MERCADO',
  permiso: 'ASISTENCIA_MERCADO',
  gasolina: 'GASOLINA',
  utilidades: 'RETIRO_SOCIOS',
};

// Conceptos que no son gastos del negocio (préstamos/movimientos personales
// detectados en el histórico). Se importan igual, marcados como no
// operativos, para que no se resten de la utilidad — pero revísalos: quizás
// prefieras eliminarlos por completo si no tienen nada que ver con el
// negocio.
const CONCEPTOS_NO_OPERATIVOS = new Set(['utilidades', 'prestamos', 'madre']);

function categoriaDe(concepto) {
  return CONCEPTO_A_CATEGORIA[concepto.trim().toLowerCase()] || 'OTRO';
}

function afectaUtilidadDe(concepto) {
  return !CONCEPTOS_NO_OPERATIVOS.has(concepto.trim().toLowerCase());
}

function parseArgs(argv) {
  const args = { file: null, year: new Date().getFullYear(), dryRun: false };
  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg.startsWith('--year=')) args.year = parseInt(arg.split('=')[1], 10);
    else args.file = arg;
  }
  return args;
}

// Mismo parser simple usado en import-mercancia.js.
function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\r') {
      // ignorar, se maneja el \n
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parsePrecio(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/\$/g, '').trim();
  if (cleaned === '') return null;
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  const value = parseFloat(normalized);
  return Number.isNaN(value) ? null : value;
}

function parseFecha(raw, year) {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === '') return null;
  const [diaStr, mesStr] = trimmed.split(/\s+/);
  const dia = parseInt(diaStr, 10);
  const mes = MESES[mesStr];
  if (!dia || !mes) return null;
  return `${year}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

async function run() {
  const { file, year, dryRun } = parseArgs(process.argv);
  if (!file) {
    console.error('Uso: node scripts/import-gastos.js /ruta/a/Gastos.csv [--year=2026] [--dry-run]');
    process.exit(1);
  }

  const filePath = path.resolve(file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCsv(content).filter((r) => r.length > 1 && r.some((c) => c.trim() !== ''));
  const [header, ...data] = rows;
  console.log(`Encabezado detectado: ${header.slice(0, 4).join(' | ')}`);
  console.log(`Filas a procesar: ${data.length}${dryRun ? ' (dry-run, no se escribirá en la base de datos)' : ''}`);

  const t = dryRun ? null : await db.sequelize.transaction();

  try {
    let creados = 0;
    let omitidos = 0;
    let totalImportado = 0;
    const sinFechaValida = [];
    const resumenPorCategoria = {};
    const aRevisar = [];

    for (const cols of data) {
      const [fechaRaw, lugarRaw, conceptoRaw, precioRaw] = cols;

      const concepto = (conceptoRaw || '').trim();
      const lugar = (lugarRaw || '').trim();
      const monto = parsePrecio(precioRaw);

      if (!concepto || monto === null) {
        omitidos++;
        continue;
      }

      const fecha = parseFecha(fechaRaw, year);
      if (!fecha) {
        sinFechaValida.push(`${fechaRaw} (${concepto})`);
        omitidos++;
        continue;
      }

      const categoria = categoriaDe(concepto);
      const afectaUtilidad = afectaUtilidadDe(concepto);
      const descripcion = lugar ? `${concepto} (${lugar})` : concepto;

      if (concepto.trim().toLowerCase() === 'luis') {
        aRevisar.push(`${fecha}: "${descripcion}" por $${monto} (importado como OTRO/operativo)`);
      }

      if (!dryRun) {
        await db.Gasto.create({ categoria, descripcion, monto, fecha, afectaUtilidad, socio: null }, { transaction: t });
      }

      totalImportado += monto;
      resumenPorCategoria[categoria] = (resumenPorCategoria[categoria] || 0) + monto;
      creados++;
    }

    if (!dryRun) {
      await t.commit();
    }

    console.log(`✅ Listo. ${creados} gastos ${dryRun ? 'validados' : 'importados'}, ${omitidos} filas omitidas.`);
    if (sinFechaValida.length > 0) {
      console.log(`⚠️  Filas con fecha no interpretable (omitidas): ${sinFechaValida.join(', ')}`);
    }
    if (aRevisar.length > 0) {
      console.log(`⚠️  Conceptos ambiguos que vale la pena revisar manualmente:\n   ${aRevisar.join('\n   ')}`);
    }
    console.log('Resumen por categoría:');
    console.table(
      Object.entries(resumenPorCategoria).map(([categoria, monto]) => ({ categoria, monto: monto.toFixed(2) }))
    );
    console.log(`Total importado: $${totalImportado.toFixed(2)}`);
  } catch (error) {
    if (t) await t.rollback();
    console.error('❌ Error durante la importación:', error.message || error);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
}

run();
