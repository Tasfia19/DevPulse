import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js"; 
import issueRoutes from "./routes/issueRoutes.js"; 

const app = express();
app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Welcome to the DevPulse API! Access /api/issues to see data.",
	});
});
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);

export default app;
