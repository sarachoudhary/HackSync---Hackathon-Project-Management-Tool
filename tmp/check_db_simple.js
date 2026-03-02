import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:240305@localhost:5432/hacksync'
});

async function run() {
  console.log("Connecting...");
  try {
    const res = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log("Tables:", res.rows.map(r => r.table_name));
    
    for (const table of res.rows.map(r => r.table_name)) {
      const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
      console.log(`Columns in ${table}:`, cols.rows.map(r => r.column_name));
      const count = await pool.query(`SELECT count(*) FROM ${table}`);
      console.log(`Count in ${table}:`, count.rows[0].count);
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
