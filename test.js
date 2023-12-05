import {Pool, Client} from "pg";
import 'dotenv/config'

console.log(process.env) // remove this after you've confirmed it is working

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT,
});

(async () => {
    const client = await pool.connect();
    try { 
        const {rows} = await client.query("SELECT current_user")
        const currentUser = rows[0]["current_user"]
        console.log(currentUser)
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
});