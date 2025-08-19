import dotenv from "dotenv";
dotenv.config();
import http from "http";
import app from "./src/app.js";

const PORT = process.env.PORT || 4000;
http.createServer(app).listen(PORT, () => {
    console.log(`API portfolio en écoute sur http://localhost:${PORT}`);
});
