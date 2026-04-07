const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('EventStaff', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        role: {
            type: DataTypes.STRING, // e.g. "Mesero Principal", "DJ Invitado"
            defaultValue: 'Staff'
        }
    });
};
