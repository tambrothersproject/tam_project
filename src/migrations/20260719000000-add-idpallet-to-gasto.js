'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Gastos', 'idPallet', {
      // Opcional: la mayoría de los gastos (gasolina, asistencia) no
      // pertenecen a un pallet específico. Solo se llena cuando el gasto
      // SÍ es atribuible a uno en particular — típicamente la compra del
      // pallet mismo, pero también sirve para cualquier otro gasto que
      // quieras asociar a un pallet concreto.
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Pallets',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('Gastos', ['idPallet']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Gastos', ['idPallet']);
    await queryInterface.removeColumn('Gastos', 'idPallet');
  },
};
