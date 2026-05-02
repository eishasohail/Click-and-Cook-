require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const runMigration = async () => {
  try {
    // Add image_url column to saved_recipes
    await pool.query(`
      ALTER TABLE saved_recipes ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
    `);
    console.log('Migration completed successfully: image_url column added.');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
};

runMigration();
