import { SQL } from "bun";

export const db = new SQL({
  adapter: "mysql",
  hostname: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  onconnect: () => {
    console.log("Connected to the database");
  },
  onclose: (err: Error | null) => {
    if (err) {
      console.error("Database connection closed with error:", err);
    } else {
      console.log("Database connection closed gracefully.");
    }
  },
});
