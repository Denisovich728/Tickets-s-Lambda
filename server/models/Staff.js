const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Staff', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false
        },
        qrCodeData: {
            type: DataTypes.TEXT,
            allowNull: true // Generated after creation
        },
        photo: {
            type: DataTypes.TEXT, // Base64 or URL
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    });
};
