'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Producto extends Model {
    static associate(models) {
      Producto.hasMany(models.Venta, { foreignKey: 'idProducto', as: 'ventas' });
      Producto.hasMany(models.Inventario, { foreignKey: 'idProducto', as: 'inventarios' });
    }
  }

  Producto.init(
    {
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      precioMercado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      precioSugerido: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'activo',
      },
    },
    {
      sequelize,
      modelName: 'Producto',
      tableName: 'Productos',
    }
  );

  return Producto;
};