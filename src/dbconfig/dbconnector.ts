import { Pool } from "pg";

const pool: Pool = new Pool({
    max: 20,
    connectionString: process.env.CONNECTIONSTRING,
    idleTimeoutMillis: 30000,
});

export default pool;
