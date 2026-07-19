'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Aportacion extends Model {
    static associate() {
      // sin asociaciones por ahora
    }
  }

  Aportacion.init(
    {
      categoria: {
        type: DataTypes.ENUM('INVERSION_INICIAL', 'ESTIMULO', 'OTRO'),
        allowNull: false,
      },
      aportante: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      descripcion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Aportacion',
      tableName: 'Aportaciones',
    }
  );

  return Aportacion;
};
