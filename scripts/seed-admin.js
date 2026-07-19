'use strict';

/**
 * Crea el usuario administrador por defecto (username: admin, password: admin)
 * si todavía no existe ningún usuario con ese username. Es idempotente:
 * correrlo varias veces no duplica ni resetea la cuenta.
 *
 * Uso:
 *   node scripts/seed-admin.js
 *   node scripts/seed-admin.js --reset   (fuerza la contraseña de vuelta a "admin")
 *
 * IMPORTANTE: cambia la contraseña por defecto ("admin") en cuanto inicies
 * sesión por primera vez — desde la app, en Usuarios → Cambiar mi contraseña.
 */

const bcrypt = require('bcrypt');
const db = require('../src/models');

async function run() {
  const reset = process.argv.includes('--reset');

  try {
    let admin = await db.User.findOne({ where: { username: 'admin' } });

    if (admin && !reset) {
      console.log('ℹ️  El usuario "admin" ya existe. No se hizo ningún cambio.');
      console.log('   Usa --reset si quieres forzar su contraseña de vuelta a "admin".');
      return;
    }

    const hashed = await bcrypt.hash('admin', 10);

    if (admin && reset) {
      await admin.update({ password: hashed, isAdmin: true });
      console.log('✅ Contraseña del usuario "admin" restablecida a "admin".');
    } else {
      admin = await db.User.create({
        name: 'Administrador',
        username: 'admin',
        password: hashed,
        isAdmin: true,
      });
      console.log('✅ Usuario admin creado: username="admin", password="admin".');
    }

    console.log('⚠️  Cambia esta contraseña por defecto en cuanto inicies sesión.');
  } catch (error) {
    console.error('❌ Error al crear/actualizar el usuario admin:', error.message || error);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
}

run();
