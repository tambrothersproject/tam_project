'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Inventario extends Model {
    static associate(models) {
      Inventario.belongsTo(models.Producto, { foreignKey: 'idProducto', as: 'producto' });
      Inventario.belongsTo(models.Pallet, { foreignKey: 'idPallet', as: 'pallet' });
    }
  }

  Inventario.init(
    {
      idProducto: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      idPallet: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'Inventario',
      tableName: 'Inventarios',
    }
  );

  return Inventario;
};