/**
  Post.js
  Class model for Post
  https://github.com/sequelize/sequelize/issues/6524#issuecomment-329664805
*/

'use strict'

const Sequelize = require('sequelize')

module.exports =
  class Post extends Sequelize.Model {
    static init (sequelize) {
      return super.init({
        title: {
          type: Sequelize.STRING,
          allowNull: false
        },
        body: {
          type: Sequelize.TEXT,
          allowNull: false
        }
      }, { sequelize, timestamps: false })
    };

    static associate (models) {
      // Using additional options like CASCADE etc for demonstration
      // Can also simply do Task.belongsTo(models.Post);
      this.hasMany(models.Comment, {
        onDelete: 'CASCADE',
        foreignKey: {
          allowNull: false
        }
      })

      // Using additional options like CASCADE etc for demonstration
      // Can also simply do Task.belongsTo(models.Post);
      this.belongsTo(models.User, {
        onDelete: 'CASCADE',
        foreignKey: {
          allowNull: true
        }
      })
    }
  }
