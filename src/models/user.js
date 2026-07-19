'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate() {
      // sin asociaciones por ahora
    }

    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        // Usado para iniciar sesión. Único; solo el admin crea usuarios,
        // así que no hay flujo de "username ya tomado" cara al público.
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        // Ya no es obligatorio: esta app no envía correos ni depende de él
        // para nada, se deja opcional por si algún día se usa para avisos.
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: { msg: 'Email inválido' } },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
    }
  );

  return User;
};
