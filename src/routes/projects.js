import { Router } from 'express';
import multer from 'multer';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg';
    if (!ok) return cb(new Error('Format non autorisé (jpg uniquement)'));
    cb(null, true);
  },
});

router.get('/', listProjects);
router.get('/:slug', getProject);
router.post('/', requireAuth, upload.single('image'), createProject);
router.put('/:slug', requireAuth, upload.single('image'), updateProject);
router.delete('/:slug', requireAuth, deleteProject);

export default router;
