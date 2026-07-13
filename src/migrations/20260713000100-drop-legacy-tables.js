'use strict';

// Ejecuta esta migración SOLO cuando ya hayas migrado los datos a "Mercancias"
// y hayas actualizado tus controladores/rutas para dejar de usar estos modelos.
// Se deja como migración separada para que puedas revisar y aplicar
// cuando estés listo, en vez de borrar tablas automáticamente.

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.dropTable('Ventas');
    await queryInterface.dropTable('Inventarios');
    await queryInterface.dropTable('Productos');
  },

  down: async () => {
    throw new Error(
      'Esta migración no es reversible automáticamente. Restaura desde un backup si es necesario.'
    );
  },
};
