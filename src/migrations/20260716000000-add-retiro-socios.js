'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // No se puede usar el nuevo valor del enum en la misma transacción en la
    // que se agrega (restricción de Postgres), así que esta migración solo
    // agrega el valor; los datos que lo usen se crean en una corrida aparte.
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Gastos_categoria" ADD VALUE IF NOT EXISTS 'RETIRO_SOCIOS';`
    );

    await queryInterface.addColumn('Gastos', 'socio', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Gastos', 'afectaUtilidad', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addIndex('Gastos', ['afectaUtilidad']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Gastos', ['afectaUtilidad']);
    await queryInterface.removeColumn('Gastos', 'afectaUtilidad');
    await queryInterface.removeColumn('Gastos', 'socio');
    // Postgres no permite quitar un valor de un ENUM fácilmente; si necesitas
    // revertir por completo, habría que recrear el tipo. Se deja así porque
    // dejar el valor "RETIRO_SOCIOS" sin usar no causa ningún problema.
  },
};
