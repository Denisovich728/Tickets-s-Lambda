const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Event', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING, // Boda, Concierto, etc.
            defaultValue: 'General'
        },
        capacity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        accessRules: {
            type: DataTypes.JSON, // Flexible storage for specific rules
            allowNull: true
        },
        layout: {
            type: DataTypes.JSON, // Fabric.js JSON data
            allowNull: true
        }
    });
};
