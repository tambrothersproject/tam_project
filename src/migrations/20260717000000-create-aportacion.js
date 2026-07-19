'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Aportaciones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      categoria: {
        // INVERSION_INICIAL: lo usado para arrancar (ej. el primer pallet)
        // ESTIMULO: apoyos familiares durante el arranque
        // OTRO: cualquier otra aportación de capital que no sea venta
        type: Sequelize.ENUM('INVERSION_INICIAL', 'ESTIMULO', 'OTRO'),
        allowNull: false,
      },
      aportante: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      descripcion: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('Aportaciones', ['categoria']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Aportaciones');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Aportaciones_categoria";');
  },
};
