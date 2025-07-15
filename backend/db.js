const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to PostgreSQL at:', res.rows[0].now);
  }
});

module.exports = pool;
// This code sets up a connection to a PostgreSQL database using the pg library.
// It reads the connection string from environment variables and logs the current time from the database to confirm the connection.
// If there's an error during the connection, it logs the error message to the console.