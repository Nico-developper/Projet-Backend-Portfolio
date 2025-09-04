// server.js
import "dotenv/config";
import http from "http";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

try {
    // ✅ On attend la connexion Mongo avant de démarrer l'API
    await connectDB();

    http.createServer(app).listen(PORT, HOST, () => {
        console.log(`API portfolio en écoute sur http://${HOST}:${PORT}`);
    });
} catch (err) {
    console.error(
        "❌ Démarrage annulé : connexion MongoDB impossible :",
        err.message
    );
    process.exit(1);
}
