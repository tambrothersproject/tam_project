'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Gasto extends Model {
    static associate(models) {
      Gasto.belongsTo(models.Pallet, { foreignKey: 'idPallet', as: 'pallet' });
    }
  }

  Gasto.init(
    {
      categoria: {
        type: DataTypes.ENUM('ASISTENCIA_MERCADO', 'GASOLINA', 'COMPRA_PALLETS', 'OTRO', 'RETIRO_SOCIOS'),
        allowNull: false,
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
      socio: {
        // A quién de los socios/trabajadores corresponde el reparto.
        // Solo aplica cuando categoria = RETIRO_SOCIOS; queda null en el resto.
        type: DataTypes.STRING,
        allowNull: true,
      },
      afectaUtilidad: {
        // false = se registra pero NO se resta de la utilidad operativa
        // (retiros de socios, préstamos personales, etc.)
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      idPallet: {
        // Opcional: solo se llena cuando el gasto es atribuible a un pallet
        // específico (típicamente su compra). El resto de los gastos
        // (gasolina, asistencia) se queda en null y se prorratea entre los
        // pallets activos al calcular la utilidad por pallet.
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Gasto',
      tableName: 'Gastos',
    }
  );

  return Gasto;
};
