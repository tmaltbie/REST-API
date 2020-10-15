'use strict';

const Sequelize = require('sequelize');

module.exports = sequelize => {
    class Course extends Sequelize.Model {}
    Course.init({
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    args: true,
                    msg: 'Please enter a course title'
                },
            },
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false,
            validate: {
                notNull: {
                    args: true,
                    msg: 'Please add a description for the course'
                },
                notEmpty: {
                    args: true,
                    msg: 'Please add a description for the course'
                }
            }
        },
        estimatedTime: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        materialsNeeded: {
            type: Sequelize.STRING,
            allowNull: true,
        },
    }, { sequelize });
  
    Course.associate = (models) => {
        Course.belongsTo(models.User, { foreignKey: 'userId'});
    };

    return Course;
};