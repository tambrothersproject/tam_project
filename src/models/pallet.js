'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Pallet extends Model {
    static associate(models) {
      Pallet.hasMany(models.Inventario, { foreignKey: 'idPallet', as: 'inventarios' });
    }
  }

  Pallet.init(
    {
      ubicacion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fechaEntrada: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Pallet',
      tableName: 'Pallets',
    }
  );

  return Pallet;
};