import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router = Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
        return res.status(400).json({ error: "Email et mot de passe requis" });
    try {
        const user = await User.findOne({ email });
        if (!user)
            return res.status(401).json({ error: "Utilisateur non trouvé" });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ error: "Mot de passe invalide" });
        const token = jwt.sign(
            { sub: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route utilitaire pour créer un utilisateur (à n'utiliser qu'en local / formation)
router.post("/register", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
        return res.status(400).json({ error: "Email et mot de passe requis" });
    try {
        const existing = await User.findOne({ email });
        if (existing)
            return res.status(400).json({ error: "Utilisateur déjà existant" });
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashed });
        await user.save();
        res.status(201).json({ message: "Utilisateur créé" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default router;
