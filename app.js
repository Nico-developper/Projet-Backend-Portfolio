import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "./config/db.js";
import projectsRoutes from "./routes/projects.js";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const allowed = process.env.ALLOWED_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) || ["http://localhost:5173"];
app.use(cors({ origin: allowed }));
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectsRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));
export default app;
