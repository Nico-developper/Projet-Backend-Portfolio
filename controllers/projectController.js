import Project from "../models/Project.js";
import slugify from "slugify";

function toSlug(title) {
    return slugify(title, { lower: true, strict: true });
}

export async function listProjects(req, res) {
    try {
        const { featured } = req.query;
        const filter = {};
        if (featured === "1" || featured === "true") filter.featured = true;
        const projects = await Project.find(filter).sort({
            order: 1,
            createdAt: -1,
        });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function getProject(req, res) {
    try {
        const { slug } = req.params;
        const project = await Project.findOne({ slug });
        if (!project)
            return res.status(404).json({ error: "Projet introuvable" });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function createProject(req, res) {
    try {
        const { title, description, tech, githubUrl, demoUrl, featured } =
            req.body;
        if (!title || !description) {
            return res
                .status(400)
                .json({ error: "Titre et description requis" });
        }
        const slug = toSlug(title);
        const payload = {
            title,
            slug,
            description,
            tech: Array.isArray(tech)
                ? tech
                : tech
                ? String(tech)
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                : [],
            githubUrl,
            demoUrl,
            featured: featured === "true" || featured === true,
        };
        if (req.file) {
            payload.coverImage = `data:${
                req.file.mimetype
            };base64,${req.file.buffer.toString("base64")}`;
        }
        const created = await Project.create(payload);
        res.status(201).json(created);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export async function updateProject(req, res) {
    try {
        const { slug } = req.params;
        const updates = { ...req.body };
        if (updates.title) updates.slug = toSlug(updates.title);
        if (updates.tech) {
            updates.tech = Array.isArray(updates.tech)
                ? updates.tech
                : String(updates.tech)
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean);
        }
        if (typeof updates.featured !== "undefined") {
            updates.featured =
                updates.featured === "true" || updates.featured === true;
        }
        if (req.file) {
            updates.coverImage = `data:${
                req.file.mimetype
            };base64,${req.file.buffer.toString("base64")}`;
        }
        const updated = await Project.findOneAndUpdate({ slug }, updates, {
            new: true,
        });
        if (!updated)
            return res.status(404).json({ error: "Projet introuvable" });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export async function deleteProject(req, res) {
    try {
        const { slug } = req.params;
        const deleted = await Project.findOneAndDelete({ slug });
        if (!deleted)
            return res.status(404).json({ error: "Projet introuvable" });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
