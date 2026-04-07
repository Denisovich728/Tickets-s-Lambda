const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING, // Should be hashed in production
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('admin', 'client', 'staff'),
            defaultValue: 'client'
        }
    });
};
