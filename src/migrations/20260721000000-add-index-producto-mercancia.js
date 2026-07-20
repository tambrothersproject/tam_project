'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Habilita búsquedas por substring (no solo por prefijo, ej. "ropa" debe
    // encontrar "ropa de bebé") sin hacer un table scan completo conforme
    // Mercancias crezca. Requiere la extensión pg_trgm de Postgres.
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS mercancias_producto_trgm_idx ON "Mercancias" USING GIN ("producto" gin_trgm_ops);'
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS mercancias_producto_trgm_idx;');
  },
};
