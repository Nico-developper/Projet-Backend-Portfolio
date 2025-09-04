import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";

import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";

const app = express();

app.set("trust proxy", 1);

// ----- CORS -----
const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, cb) {
            if (!origin) return cb(null, true); // outils locaux, cURL, etc.
            if (allowed.length === 0 || allowed.includes(origin))
                return cb(null, true);
            return cb(new Error("Not allowed by CORS"));
        },
        credentials: false,
    })
);

// ----- Sécurité & perfs -----
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(mongoSanitize());
app.use(xss());

if (process.env.NODE_ENV !== "test") {
    app.use(morgan(process.env.NODE_ENV === "production" ? "tiny" : "dev"));
}

// Limiter les tentatives d'auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/auth", authLimiter, authRoutes);

// ----- API -----
app.use("/api/projects", projectRoutes);

// Healthcheck
app.get("/health", (req, res) => res.json({ status: "ok" }));

// 404
app.use((req, res) => res.status(404).json({ message: "Not found" }));

// Gestion d'erreurs
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(err.status || 500).json({
        message: err.message || "Server error",
    });
});

export default app;
