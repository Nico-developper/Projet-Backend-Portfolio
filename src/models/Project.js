import mongoose from 'mongoose';
import slugify from 'slugify';

const urlRegex = /^(https?:\/\/)[^\s]+$/i;

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true, maxlength: 2000 },
    tech: [{ type: String, trim: true, maxlength: 40 }],
    tags: [{ type: String, trim: true, maxlength: 40 }],
    githubUrl: { type: String, validate: (v) => !v || urlRegex.test(v) },
    demoUrl: { type: String, validate: (v) => !v || urlRegex.test(v) },
    coverImage: { type: String },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ProjectSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

ProjectSchema.pre('insertMany', function (docs, next) {
  for (const d of docs) {
    if (!d.slug && d.title) {
      d.slug = slugify(d.title, { lower: true, strict: true });
    }
  }
  next();
});

export default mongoose.model('Project', ProjectSchema);
