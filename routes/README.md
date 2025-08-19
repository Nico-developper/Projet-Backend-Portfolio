# API Portfolio (Option 3 — Node/Express/MongoDB)

## Démarrage
```
npm i
cp .env.example .env  # éditez les variables
npm run dev           # http://localhost:4000
npm run seed          # (optionnel) injecte des projets de démo
```

### Endpoints
- POST /api/auth/login  → { token }
- GET  /api/projects
- GET  /api/projects/:slug
- POST /api/projects       (Bearer token)
- PUT  /api/projects/:slug (Bearer token)
- DELETE /api/projects/:slug (Bearer token)
