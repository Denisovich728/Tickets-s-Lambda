const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('TimeLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.STRING, // e.g. "Mesero", "DJ"
            allowNull: false
        },
        checkInTime: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        checkOutTime: {
            type: DataTypes.DATE,
            allowNull: true
        }
    });
};
