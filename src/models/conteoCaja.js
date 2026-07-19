'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ConteoCaja extends Model {
    static associate() {
      // sin asociaciones por ahora
    }
  }

  ConteoCaja.init(
    {
      montoContado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      comentario: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ConteoCaja',
      tableName: 'ConteosCaja',
    }
  );

  return ConteoCaja;
};
