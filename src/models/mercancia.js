'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Mercancia extends Model {
    static associate(models) {
      Mercancia.belongsTo(models.Pallet, { foreignKey: 'idPallet', as: 'pallet' });
    }
  }

  Mercancia.init(
    {
      producto: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      precioMercado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      precioSugerido: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      precioVenta: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      idPallet: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      estado: {
        type: DataTypes.ENUM('DISPONIBLE', 'VENDIDO'),
        allowNull: false,
        defaultValue: 'DISPONIBLE',
      },
      fechaVenta: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Mercancia',
      tableName: 'Mercancias',
    }
  );

  return Mercancia;
};
