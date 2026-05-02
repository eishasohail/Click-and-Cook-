require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const runMigration = async () => {
  try {
    console.log('Running migration...');
    // Drop default for rating column
    await pool.query(`
      ALTER TABLE reviews ALTER COLUMN rating DROP DEFAULT;
    `);
    console.log('Migration completed successfully: rating column default dropped.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
};

runMigration();
