import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Token manquant" });

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "dev_secret"
        );
        req.user = { id: decoded.id || decoded._id || decoded.sub || null };
        return next();
    } catch {
        return res.status(401).json({ message: "Token invalide" });
    }
}
