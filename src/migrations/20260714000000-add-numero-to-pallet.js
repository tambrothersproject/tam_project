'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Pallets', 'numero', {
      type: Sequelize.INTEGER,
      allowNull: true, // se llena en el próximo re-import; permite múltiples NULL sin violar el índice único
    });

    await queryInterface.addIndex('Pallets', ['numero'], {
      unique: true,
      name: 'pallets_numero_unique',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Pallets', 'pallets_numero_unique');
    await queryInterface.removeColumn('Pallets', 'numero');
  },
};
