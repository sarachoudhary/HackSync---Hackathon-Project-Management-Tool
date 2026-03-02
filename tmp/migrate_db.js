import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:240305@localhost:5432/hacksync'
});

async function run() {
  console.log("Applying manual migrations...");
  try {
    console.log("Adding column to projects...");
    await pool.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS allow_member_task_creation integer NOT NULL DEFAULT 0');
    
    console.log("Creating notifications table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id serial PRIMARY KEY,
        user_id integer NOT NULL,
        project_id integer NOT NULL,
        content text NOT NULL,
        type text NOT NULL,
        read integer NOT NULL DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    
    console.log("Migrations applied successfully.");
  } catch (err) {
    console.error("Migration error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
