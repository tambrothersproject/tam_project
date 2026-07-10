'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Venta extends Model {
    static associate(models) {
      Venta.belongsTo(models.Producto, { foreignKey: 'idProducto', as: 'producto' });
    }
  }

  Venta.init(
    {
      idProducto: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      precioVenta: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      fechaVenta: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Venta',
      tableName: 'Ventas',
    }
  );

  return Venta;
};