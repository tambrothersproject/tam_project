'use strict';

/**
 * Importa Mercancia.csv (la fuente de datos maestra) a PostgreSQL,
 * creando los registros de Mercancias y asociándolos al Pallet que
 * corresponda según su "numero".
 *
 * IMPORTANTE: este script YA NO crea pallets sobre la marcha. Antes de
 * correrlo, corre scripts/seed-pallets.js para vaciar la base y crear los
 * pallets en orden estricto (0, 1, 2...). Así los ids en Postgres quedan
 * en el mismo orden que el número real del pallet, sin duplicados y sin
 * depender del orden en que aparecen las filas en el CSV.
 *
 * Uso:
 *   node scripts/seed-pallets.js --from=0 --to=10
 *   node scripts/import-mercancia.js /ruta/a/Mercancia.csv [--year=2026] [--dry-run]
 *
 * Notas:
 * - Si una fila del CSV trae un número de pallet que no fue creado por
 *   seed-pallets.js, el script se detiene con un error explicando cuál
 *   número falta, en vez de crearlo silenciosamente fuera de orden.
 * - Los precios vacíos en el CSV (aún no capturados) se guardan como NULL,
 *   no como 0 — no se inventan valores.
 * - Filas totalmente vacías (renglones sobrantes del Excel) se omiten
 *   automáticamente porque no tienen nombre de producto.
 * - "Fecha de Venta" viene sin año (ej. "15 marzo"). Como no hay año en el
 *   CSV, se asume el año indicado con --year (por defecto el año actual).
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

function parseArgs(argv) {
  const args = { file: null, year: new Date().getFullYear(), dryRun: false };
  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg.startsWith('--year=')) args.year = parseInt(arg.split('=')[1], 10);
    else args.file = arg;
  }
  return args;
}

// Parser de CSV simple que respeta comillas dobles y comas dentro de comillas.
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
  // Formato latinoamericano: punto como separador de miles, coma como decimal.
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  const value = parseFloat(normalized);
  return Number.isNaN(value) ? null : value;
}

function parseFechaVenta(raw, year) {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === '') return null;
  const [diaStr, mesStr] = trimmed.split(/\s+/);
  const dia = parseInt(diaStr, 10);
  const mes = MESES[mesStr];
  if (!dia || !mes) {
    console.warn(`  ⚠️  No se pudo interpretar la fecha "${raw}", se deja nula.`);
    return null;
  }
  const mm = String(mes).padStart(2, '0');
  const dd = String(dia).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

async function run() {
  const { file, year, dryRun } = parseArgs(process.argv);
  if (!file) {
    console.error('Uso: node scripts/import-mercancia.js /ruta/a/Mercancia.csv [--year=2026] [--dry-run]');
    process.exit(1);
  }

  const filePath = path.resolve(file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCsv(content).filter((r) => r.length > 1 && r.some((c) => c.trim() !== ''));
  const [header, ...data] = rows;
  console.log(`Encabezado detectado: ${header.join(' | ')}`);
  console.log(`Filas a procesar: ${data.length}${dryRun ? ' (dry-run, no se escribirá en la base de datos)' : ''}`);

  // Carga los pallets ya sembrados por scripts/seed-pallets.js. No se crean
  // pallets aquí: si falta alguno, es mejor detenerse y avisar que crear
  // uno fuera de orden.
  const palletsExistentes = await db.Pallet.findAll({ attributes: ['id', 'numero'] });
  const palletCache = new Map(palletsExistentes.map((p) => [p.numero, p.id]));

  if (palletCache.size === 0) {
    console.error('❌ No hay pallets en la base de datos. Corre primero: node scripts/seed-pallets.js --from=0 --to=10');
    process.exit(1);
  }

  const t = dryRun ? null : await db.sequelize.transaction();

  try {
    let creadas = 0;
    let omitidas = 0;
    let sinPallet = 0;
    const palletsFaltantes = new Set();

    for (const cols of data) {
      const [, producto, precioMercadoRaw, precioSugeridoRaw, precioVentaRaw, noPalletRaw, estadoRaw, fechaVentaRaw] = cols;

      const nombre = (producto || '').trim();
      if (!nombre) {
        omitidas++;
        continue;
      }

      const numeroPalletRaw = (noPalletRaw || '').trim();
      if (numeroPalletRaw === '') {
        console.warn(`  ⚠️  "${nombre}" no tiene número de pallet, se omite. Complétalo en el CSV y vuelve a correr el script.`);
        sinPallet++;
        continue;
      }
      const numeroPallet = parseInt(numeroPalletRaw, 10);

      const idPallet = palletCache.get(numeroPallet);
      if (idPallet === undefined) {
        palletsFaltantes.add(numeroPallet);
        continue;
      }

      const estado = (estadoRaw || '').trim().toUpperCase() === 'VENDIDO' ? 'VENDIDO' : 'DISPONIBLE';

      const record = {
        producto: nombre,
        precioMercado: parsePrecio(precioMercadoRaw),
        precioSugerido: parsePrecio(precioSugeridoRaw),
        precioVenta: estado === 'VENDIDO' ? parsePrecio(precioVentaRaw) : null,
        idPallet,
        estado,
        fechaVenta: estado === 'VENDIDO' ? parseFechaVenta(fechaVentaRaw, year) : null,
      };

      if (!dryRun) {
        await db.Mercancia.create(record, { transaction: t });
      }
      creadas++;
    }

    if (palletsFaltantes.size > 0) {
      throw new Error(
        `El CSV usa los números de pallet [${[...palletsFaltantes].sort((a, b) => a - b).join(', ')}] que no existen en la base de datos. ` +
          `Vuelve a correr scripts/seed-pallets.js con un rango --from/--to que los incluya, y corre este script de nuevo.`
      );
    }

    if (!dryRun) {
      await t.commit();
    }

    console.log(`✅ Listo. ${creadas} artículos ${dryRun ? 'validados' : 'importados'}, ${omitidas} filas vacías omitidas, ${sinPallet} omitidas por no tener número de pallet.`);
  } catch (error) {
    if (t) await t.rollback();
    console.error('❌ Error durante la importación:', error.message || error);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
}

run();

