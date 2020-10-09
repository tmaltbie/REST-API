'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // define BelongsTo association between Course & User (Course belongs to a single User)
        Course.belongsTo(models.User); // This creates `userId` foreignKey to Course
    }
  };
  Course.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    estimatedTime: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    materialsNeeded: {
        type: DataTypes.STRING,
        allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Course',
  });
  return Course;
};