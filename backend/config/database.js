'use strict';

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Lokasi berkas database SQLite (off-chain storage untuk data detail).
const storage = process.env.DB_STORAGE || path.join(__dirname, '..', 'data', 'plasma_nutfah.sqlite');

// Pastikan direktori data ada.
const dir = path.dirname(storage);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
});

module.exports = sequelize;
