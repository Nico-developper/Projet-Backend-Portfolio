// src/config/db.js
import mongoose from "mongoose";

export async function connectDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI manquant dans .env");
    }

    // Options robustes + logs
    mongoose.set("strictQuery", true);

    // Conseillé derrière certaines box/Windows pour éviter soucis IPv6 DNS
    const opts = {
        serverSelectionTimeoutMS: 10000, // 10s pour choisir un noeud
        socketTimeoutMS: 45000,
        family: 4, // force IPv4 (utile si IPv6 cause des soucis)
    };

    try {
        await mongoose.connect(uri, opts);
        const { host, port, name } = mongoose.connection;
        console.log(`✅ Connecté à MongoDB (${host}:${port}/${name})`);
    } catch (err) {
        console.error("❌ Connexion à MongoDB échouée :", err.message);
        throw err;
    }

    mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB error :", err.message);
    });
    mongoose.connection.on("disconnected", () => {
        console.warn("⚠️  MongoDB déconnecté");
    });
}
