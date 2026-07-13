'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Mercancias', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      producto: {
        // Nombre/descripción del artículo. No se normaliza en una tabla
        // "Productos" aparte porque, en la práctica, casi todos los artículos
        // son únicos (mercancía de segunda mano) y no se repiten como un SKU.
        type: Sequelize.STRING,
        allowNull: false,
      },
      precioMercado: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      precioSugerido: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      precioVenta: {
        // Nulo mientras el artículo esté disponible; se llena al venderse.
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      idPallet: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Pallets',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      estado: {
        type: Sequelize.ENUM('DISPONIBLE', 'VENDIDO'),
        allowNull: false,
        defaultValue: 'DISPONIBLE',
      },
      fechaVenta: {
        type: Sequelize.DATEONLY,
        allowNull: true,
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

    await queryInterface.addIndex('Mercancias', ['estado']);
    await queryInterface.addIndex('Mercancias', ['idPallet']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Mercancias');
    // Elimina el tipo ENUM en Postgres (Sequelize no lo hace automáticamente).
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Mercancias_estado";');
  },
};
