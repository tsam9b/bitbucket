const express = require('express');
const path = require('path');
const morgan = require('morgan');
const itemsRouter = require('./routes/items');
const statsRouter = require('./routes/stats');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorHandler');

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
// Basic middleware
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/items', itemsRouter);
app.use('/api/stats', statsRouter);

// Error handling middleware
app.use('*', notFound);
app.use(errorHandler);

app.listen(port, () => console.log('Backend running on http://localhost:' + port));