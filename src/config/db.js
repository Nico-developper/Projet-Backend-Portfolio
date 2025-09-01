import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI manquant dans .env');
  process.exit(1);
}

mongoose.set('strictQuery', true);
mongoose
  .connect(uri)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch((err) => {
    console.error('❌ Connexion à MongoDB échouée :', err.message);
    process.exit(1);
  });
