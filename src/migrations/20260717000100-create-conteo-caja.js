'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ConteosCaja', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      montoContado: {
        // El "Actual Real" de tu hoja: lo que se contó físicamente.
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      comentario: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex('ConteosCaja', ['fecha']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('ConteosCaja');
  },
};
