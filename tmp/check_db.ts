import { db } from "./server/db";
import { projects, users, tasks, teamMembers } from "./shared/schema";
import { sql } from "drizzle-orm";

async function check() {
  console.log("Checking DB status...");
  try {
    const res = await db.execute(sql`SELECT current_database(), current_user`);
    console.log("Connection OK:", res.rows);
    
    console.log("Checking tables...");
    const tables = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log("Tables found:", tables.rows.map(r => r.table_name));
    
    try {
      const projectsCount = await db.execute(sql`SELECT count(*) FROM projects`);
      console.log("Projects count:", projectsCount.rows[0]);
    } catch (e: any) {
      console.error("Error querying projects:", e.message);
    }
    
    try {
      const projectsColumns = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects'`);
      console.log("Projects columns:", projectsColumns.rows);
    } catch (e: any) {
      console.error("Error checking columns:", e.message);
    }
  } catch (err: any) {
    console.error("Critical DB error:", err.message);
  } finally {
    process.exit(0);
  }
}

check();
