'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Gastos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      categoria: {
        type: Sequelize.ENUM('ASISTENCIA_MERCADO', 'GASOLINA', 'COMPRA_PALLETS', 'OTRO'),
        allowNull: false,
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

    await queryInterface.addIndex('Gastos', ['fecha']);
    await queryInterface.addIndex('Gastos', ['categoria']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Gastos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Gastos_categoria";');
  },
};
