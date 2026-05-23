import app from "./app.js"; // <-- .js extension
import { pool } from "./config/db.js"; // <-- .js extension

const PORT = process.env.PORT || 3000;

pool
	.connect()
	.then(() => {
		console.log("✅ Connected to PostgreSQL");
		app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
	})
	.catch((err: Error) =>
		console.error("❌ Database connection error", err.stack),
	);
