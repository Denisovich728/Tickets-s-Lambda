const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Ticket', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        folio: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        qrCodeData: {
            type: DataTypes.TEXT, // The data encoded in the QR
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('generated', 'sent', 'used', 'revoked'),
            defaultValue: 'generated'
        },
        holderName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isMultiUse: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        seatId: {
            type: DataTypes.STRING, // e.g. "Table 1-Chair 3" or "A1"
            allowNull: true
        },
        pax: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    });
};
