const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

const { sequelize } = require('./models');
const { router: authRouter } = require('./routes/auth');
const eventRouter = require('./routes/events');
const ticketRouter = require('./routes/tickets');
const staffRouter = require('./routes/staff');

// Sync DB and start server
// Use force:false to only create tables that don't exist yet (safe for production)
const { Staff, EventStaff } = require('./models');

sequelize.authenticate()
  .then(async () => {
    console.log('Database connected...');
    // Only sync new models - avoids conflicts with existing tables
    await Staff.sync({ force: false });
    await EventStaff.sync({ force: false });
    console.log('Staff models synchronized.');
  })
  .then(() => {
    app.use('/auth', authRouter);
    app.use('/events', eventRouter);
    app.use('/tickets', ticketRouter);
    app.use('/staff', staffRouter);

    app.get('/', (req, res) => res.send('API Running'));

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch(err => console.error('Startup Error:', err));
