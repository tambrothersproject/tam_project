'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Ventas por día/semana/mes, tendencia mensual y utilidad por pallet
    // filtran y agrupan constantemente por fechaVenta. Sin este índice,
    // esas consultas hacen un table scan completo que se vuelve más lento
    // conforme crece Mercancias.
    await queryInterface.addIndex('Mercancias', ['fechaVenta']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Mercancias', ['fechaVenta']);
  },
};
