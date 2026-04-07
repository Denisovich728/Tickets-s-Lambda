const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false
});

const User = require('./User')(sequelize);
const Event = require('./Event')(sequelize);
const Ticket = require('./Ticket')(sequelize);
const TimeLog = require('./TimeLog')(sequelize);
const Staff = require('./Staff')(sequelize);

const EventStaff = require('./EventStaff')(sequelize);

// Associations

// User (Organizer) -> Events
User.hasMany(Event, { foreignKey: 'organizerId' });
Event.belongsTo(User, { foreignKey: 'organizerId' });

// Event -> Tickets
Event.hasMany(Ticket, { foreignKey: 'eventId', onDelete: 'CASCADE', hooks: true });
Ticket.belongsTo(Event, { foreignKey: 'eventId' });

// Staff (Profile) -> TimeLogs
Staff.hasMany(TimeLog, { foreignKey: 'staffId' });
TimeLog.belongsTo(Staff, { foreignKey: 'staffId' });

// Event -> TimeLogs (Staff working at an event)
Event.hasMany(TimeLog, { foreignKey: 'eventId', onDelete: 'CASCADE', hooks: true });
TimeLog.belongsTo(Event, { foreignKey: 'eventId' });

// Event <-> Staff (Many-to-Many Assignment) - Using Employee Profiles
Event.belongsToMany(Staff, { through: EventStaff, as: 'StaffMembers', foreignKey: 'eventId', onDelete: 'CASCADE', hooks: true });
Staff.belongsToMany(Event, { through: EventStaff, as: 'AssignedEvents', foreignKey: 'staffId' });

module.exports = {
    sequelize,
    User,
    Event,
    Ticket,
    TimeLog,
    EventStaff,
    Staff
};
