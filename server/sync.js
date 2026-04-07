const { sequelize, User } = require('./models');

const syncDatabase = async () => {
    try {
        await sequelize.sync({ force: true }); // Use { force: true } only for development to reset DB
        console.log('Database synced successfully.');

        // Create default Admin
        // Create Super Admin
        await User.create({
            username: 'Denisovich728',
            password: 'Lambda728',
            role: 'admin'
        });
        console.log('Super admin Denisovich728 created.');

    } catch (error) {
        console.error('Unable to sync database:', error);
    }
};

syncDatabase();
