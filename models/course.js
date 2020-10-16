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
                customTitle: function(value) {
                    if (value == null || value.length <= 0) {
                        throw new Error('Please enter a course title')
                    }
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
                customDesc: function(value) {
                    if (value == null || value.length <= 0) 
                        throw new Error('Please enter a course description')
                    
                },
                // notEmpty: {
                //     args: true,
                //     msg: 'Please add a description for the course'
                // }
            },
        },
        estimatedTime: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        materialsNeeded: {
            type: Sequelize.STRING,
            allowNull: true,
        },
    }, { sequelize,
        validate: {
            titleAndDesc() {
                if ((this.title === null) || (this.description === null)) {
                    throw new Error('The course must have both a title and a description')
                }
            }
        }
    });
  
    Course.associate = (models) => {
        Course.belongsTo(models.User, { foreignKey: 'userId'});
    };

    return Course;
};