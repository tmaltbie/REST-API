'use strict';

const Sequelize = require('sequelize');

module.exports = sequelize => {
    class User extends Sequelize.Model {};
    User.init({
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        firstName: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Please provide a last name'
                },
                notNull: {
                    msg: 'Please provide a last name'
                },
            },
        },
        lastName: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Please provide a last name'
                },
                notEmpty: {
                    msg: 'Please provide a last name'
                },
            }
        },
        emailAddress: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    args: true,
                    msg: 'Please provide a valid email address'
                },
            },
    
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    // args: true,
                    msg: 'Please create a password'
                },
                len: {
                    args: [[8, 20]],
                    msg: 'Password must be between 8 and 20 characters'
                },
            },
        },
    }, { sequelize });

    User.associate = (models) => {
        User.hasMany(models.Course, { foreignKey: 'userId' })
    }

    return User;
};
