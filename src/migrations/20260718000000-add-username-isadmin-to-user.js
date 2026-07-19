'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'username', {
      // Nullable a nivel de columna para no romper filas existentes al
      // correr la migración; la app exige el valor al crear usuarios
      // (ver validators/admin.validator.js). El índice único evita
      // duplicados entre los usuarios que sí tengan username.
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'isAdmin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addIndex('Users', ['username'], {
      unique: true,
      name: 'users_username_unique',
    });

    // Esta app ya no pide correo para operar (login es por username), así
    // que se relaja la restricción para no bloquear la creación de usuarios
    // internos que no necesitan un email real.
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Users', 'users_username_unique');
    await queryInterface.removeColumn('Users', 'isAdmin');
    await queryInterface.removeColumn('Users', 'username');
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
