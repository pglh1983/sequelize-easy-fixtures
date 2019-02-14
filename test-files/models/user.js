/**
  User.js
  Class model for User
  https://github.com/sequelize/sequelize/issues/6524#issuecomment-329664805
*/

'use strict'

const Sequelize = require('sequelize')

module.exports =
  class User extends Sequelize.Model {
    static init (sequelize) {
      return super.init({
        firstName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        lastName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        username: {
          type: Sequelize.STRING,
          allowNull: false
        },
        password_hash: {
          type: Sequelize.STRING,
          allowNull: false
        },
        salt: {
          type: Sequelize.STRING,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          validate: {
            isEmail: true
          }
        },
        isActive: {
          type: Sequelize.BOOLEAN
        }
      }, { sequelize })
    };

    static associate (models) {
      // Using additional options like CASCADE etc for demonstration
      // Can also simply do Task.belongsTo(models.User);
      this.hasMany(models.Post, {
        as: 'Articles',
        onDelete: 'CASCADE',
        foreignKey: {
          allowNull: false
        }
      })

      // Using additional options like CASCADE etc for demonstration
      // Can also simply do Task.belongsTo(models.User);
      this.hasMany(models.Comment, {
        onDelete: 'CASCADE',
        foreignKey: {
          allowNull: false
        }
      })
    }
  }
