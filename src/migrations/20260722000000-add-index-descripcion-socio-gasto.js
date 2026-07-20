'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Mismo patrón que el índice de búsqueda de Mercancias: permite que
    // "q" busque por substring en descripcion/socio sin table scan
    // conforme el historial de Gastos crezca mes a mes.
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS gastos_descripcion_trgm_idx ON "Gastos" USING GIN ("descripcion" gin_trgm_ops);'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS gastos_socio_trgm_idx ON "Gastos" USING GIN ("socio" gin_trgm_ops);'
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS gastos_descripcion_trgm_idx;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS gastos_socio_trgm_idx;');
  },
};
