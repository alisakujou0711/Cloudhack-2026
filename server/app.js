require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const apiRouter = require('./routes/api');

const app = express();

// Session cookies need an explicit origin — the default permissive CORS config cannot carry
// credentials. Through the Vite proxy requests are same-origin; this covers direct API access.
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use('/api', apiRouter);

module.exports = app;
