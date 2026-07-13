'use strict';

/**
 * Vacía Mercancias y Pallets, y vuelve a crear los Pallets en orden
 * ascendente estricto (0, 1, 2, ... N), forzando que el "id" de cada
 * Pallet sea igual a su "numero". Así Mercancias.idPallet coincide
 * directamente con el "No. Pallet" del CSV (no hay que sumarle 1 ni
 * adivinar el desfase del autoincremental de Postgres).
 *
 * Corre esto ANTES de scripts/import-mercancia.js, siempre que quieras
 * reconstruir la base de datos desde cero.
 *
 * Uso:
 *   node scripts/seed-pallets.js --from=0 --to=10
 *   node scripts/seed-pallets.js --from=0 --to=10 --fecha=2026-01-01
 *
 * --from / --to   Rango de números de pallet a crear (inclusive). Por
 *                  defecto 0 a 10, que es lo que hay hoy en tu CSV.
 * --fecha          Fecha de entrada a usar para todos los pallets nuevos
 *                  (por defecto la fecha de hoy). Puedes editarla pallet
 *                  por pallet después si conoces la fecha real de cada uno.
 */

const db = require('../src/models');

function parseArgs(argv) {
  const args = { from: 0, to: 10, fecha: new Date() };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--from=')) args.from = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--to=')) args.to = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--fecha=')) args.fecha = new Date(arg.split('=')[1]);
  }
  return args;
}

async function run() {
  const { from, to, fecha } = parseArgs(process.argv);

  if (Number.isNaN(from) || Number.isNaN(to) || from > to) {
    console.error('Rango inválido. Ejemplo correcto: --from=0 --to=10');
    process.exit(1);
  }

  const t = await db.sequelize.transaction();

  try {
    console.log('⚠️  Vaciando Mercancias y Pallets (TRUNCATE ... RESTART IDENTITY CASCADE)...');
    await db.sequelize.query('TRUNCATE TABLE "Mercancias", "Pallets" RESTART IDENTITY CASCADE;', { transaction: t });

    console.log(`Creando pallets del ${from} al ${to} en orden ascendente (id = numero)...`);
    const creados = [];
    for (let numero = from; numero <= to; numero++) {
      const pallet = await db.Pallet.create(
        {
          id: numero, // fuerza id = numero para que Mercancias.idPallet coincida visualmente con "No. Pallet"
          numero,
          ubicacion: `Pallet ${numero}`,
          fechaEntrada: fecha,
        },
        { transaction: t }
      );
      creados.push({ numero, id: pallet.id });
    }

    // Como insertamos ids manualmente, la secuencia interna de Postgres para
    // la columna autoincremental se queda desactualizada. La resincronizamos
    // para que el próximo pallet creado (por API o a mano) siga después del
    // último id usado, en vez de chocar con uno existente.
    await db.sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"Pallets"', 'id'), (SELECT MAX(id) FROM "Pallets"));`,
      { transaction: t }
    );

    await t.commit();

    console.log('✅ Pallets creados:');
    console.table(creados);
    console.log('Ahora corre scripts/import-mercancia.js con tu CSV para cargar la mercancía.');
  } catch (error) {
    await t.rollback();
    console.error('❌ Error al crear los pallets:', error);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
}

run();
