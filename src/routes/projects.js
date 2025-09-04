import express from "express";
import multer from "multer";
import { body, param, validationResult } from "express-validator";
import Project from "../models/Project.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// ----- Multer (mémoire) -----
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4 Mo
    fileFilter: (req, file, cb) => {
        if (!file) return cb(null, true);
        const ok = /^image\/(jpe?g|png|webp)$/i.test(file.mimetype);
        if (!ok) return cb(new Error("Format image invalide (JPEG/PNG/WebP)"));
        cb(null, true);
    },
});

// ----- Helpers -----
function handleValidation(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(400)
            .json({ message: "Validation error", errors: errors.array() });
    }
}

// Normalise tech : string "A, B" → ["A","B"]
function normalizeTech(value) {
    if (Array.isArray(value))
        return value.map((t) => String(t).trim()).filter(Boolean);
    if (typeof value === "string")
        return value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
    return [];
}

// Convertit un Buffer image → dataURL base64 (sans EXIF)
function bufferToDataUrl(file) {
    if (!file?.buffer) return null;
    // Conserve le mimetype déclaré par multer
    const mime = file.mimetype || "image/jpeg";
    const b64 = file.buffer.toString("base64");
    return `data:${mime};base64,${b64}`;
}

// ----- Schemas de validation -----
const createRules = [
    body("title").isString().trim().isLength({ min: 2, max: 120 }),
    body("description").isString().trim().isLength({ min: 10, max: 3000 }),
    body("tech").optional({ checkFalsy: true }).customSanitizer(normalizeTech),
    body("githubUrl").optional({ checkFalsy: true }).isURL(),
    body("demoUrl").optional({ checkFalsy: true }).isURL(),
    body("featured").optional().toBoolean(),
    body("order").optional().toInt(),
];

const updateRules = [
    param("id").isMongoId(),
    body("title").optional().isString().trim().isLength({ min: 2, max: 120 }),
    body("description")
        .optional()
        .isString()
        .trim()
        .isLength({ min: 10, max: 3000 }),
    body("tech").optional({ checkFalsy: true }).customSanitizer(normalizeTech),
    body("githubUrl").optional({ checkFalsy: true }).isURL(),
    body("demoUrl").optional({ checkFalsy: true }).isURL(),
    body("featured").optional().toBoolean(),
    body("order").optional().toInt(),
];

// ----- GET /api/projects -----
router.get("/", async (req, res, next) => {
    try {
        const q = (req.query.q || "").trim();
        const find = q
            ? {
                  $or: [
                      { title: { $regex: q, $options: "i" } },
                      { description: { $regex: q, $options: "i" } },
                      { tech: { $elemMatch: { $regex: q, $options: "i" } } },
                  ],
              }
            : {};
        const projects = await Project.find(find).sort({
            featured: -1,
            order: 1,
            createdAt: -1,
        });
        res.json(projects);
    } catch (err) {
        next(err);
    }
});

// ----- GET /api/projects/:id -----
router.get("/:id", [param("id").isMongoId()], async (req, res, next) => {
    const valErr = handleValidation(req, res);
    if (valErr) return valErr;

    try {
        const proj = await Project.findById(req.params.id);
        if (!proj)
            return res.status(404).json({ message: "Projet introuvable" });
        res.json(proj);
    } catch (err) {
        next(err);
    }
});

// ----- POST /api/projects (protégé) -----
router.post(
    "/",
    verifyToken,
    upload.single("image"),
    createRules,
    async (req, res, next) => {
        const valErr = handleValidation(req, res);
        if (valErr) return valErr;

        try {
            const {
                title,
                description,
                tech = [],
                githubUrl = "",
                demoUrl = "",
                featured = false,
                order = 0,
            } = req.body;

            const coverImage = req.file ? bufferToDataUrl(req.file) : null;

            const project = await Project.create({
                title,
                description,
                tech,
                githubUrl,
                demoUrl,
                featured,
                order,
                coverImage,
            });

            res.status(201).json(project);
        } catch (err) {
            next(err);
        }
    }
);

// ----- PUT /api/projects/:id (protégé) -----
router.put(
    "/:id",
    verifyToken,
    upload.single("image"),
    updateRules,
    async (req, res, next) => {
        const valErr = handleValidation(req, res);
        if (valErr) return valErr;

        try {
            const id = req.params.id;
            const proj = await Project.findById(id);
            if (!proj)
                return res.status(404).json({ message: "Projet introuvable" });

            const body = req.body || {};

            if (typeof body.title === "string") proj.title = body.title.trim();
            if (typeof body.description === "string")
                proj.description = body.description.trim();
            if (Array.isArray(body.tech)) proj.tech = body.tech;
            if (typeof body.githubUrl === "string")
                proj.githubUrl = body.githubUrl.trim();
            if (typeof body.demoUrl === "string")
                proj.demoUrl = body.demoUrl.trim();
            if (typeof body.featured === "boolean")
                proj.featured = body.featured;
            if (Number.isFinite(body.order)) proj.order = body.order;

            if (req.file) {
                proj.coverImage = bufferToDataUrl(req.file);
            }

            const saved = await proj.save();
            res.json(saved);
        } catch (err) {
            // Erreurs Multer (taille, mimetype) → 400
            if (
                err instanceof multer.MulterError ||
                /Format image invalide/i.test(err.message)
            ) {
                return res.status(400).json({ message: err.message });
            }
            next(err);
        }
    }
);

// ----- DELETE /api/projects/:id (protégé) -----
router.delete(
    "/:id",
    [verifyToken, param("id").isMongoId()],
    async (req, res, next) => {
        const valErr = handleValidation(req, res);
        if (valErr) return valErr;

        try {
            const id = req.params.id;
            const proj = await Project.findByIdAndDelete(id);
            if (!proj)
                return res.status(404).json({ message: "Projet introuvable" });
            res.json({ ok: true, id });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
