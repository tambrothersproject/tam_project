'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Pallet extends Model {
    static associate(models) {
      Pallet.hasMany(models.Mercancia, { foreignKey: 'idPallet', as: 'mercancias' });
      Pallet.hasMany(models.Gasto, { foreignKey: 'idPallet', as: 'gastos' });
    }
  }

  Pallet.init(
    {
      numero: {
        // Número de pallet tal como aparece en tu Excel ("No. Pallet").
        // Es distinto del id autoincremental; se usa para que el import
        // sea idempotente y no cree pallets duplicados en cada corrida.
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: true,
      },
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
