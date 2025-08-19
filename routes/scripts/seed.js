import dotenv from "dotenv";
dotenv.config();
import "./../src/config/db.js";
import Project from "./../src/models/Project.js";
import fs from "fs";

const file = new URL("../seeds/projects.json", import.meta.url);
const raw = fs.readFileSync(file, "utf-8");
const data = JSON.parse(raw);

(async () => {
  try {
    await Project.deleteMany({});
    await Project.insertMany(data);
    console.log(`✅ ${data.length} projets importés`);
    process.exit(0);
  } catch (e) {
    console.error("❌ Seed échoué:", e.message);
    process.exit(1);
  }
})();