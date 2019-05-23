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
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          default: ''
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          validate: {
            isEmail: true
          }
        },
        initial: {
          type: Sequelize.VIRTUAL,
          get () {
            return this.name[0]
          },
          set (value) {
            this.name = value + this.name.substring(1)
          }
        }
      }, { sequelize, timestamps: false })
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
