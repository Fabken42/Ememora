// lib/db.js
import mongoose from 'mongoose'
import { ensureIndexes } from '@/models/StudyList'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) throw new Error('MONGODB_URI não definida no .env.local')

let cached = global.mongoose || { 
  conn: null, 
  promise: null, 
  indexesCreated: false 
}

// Função para criar índices de forma segura
async function createIndexesSafely() {
  try {
    if (mongoose.connection.readyState === 1) { // 1 = connected
      await ensureIndexes();
      cached.indexesCreated = true;
      console.log('Índices do MongoDB criados/verificados');
    }
  } catch (error) {
    console.error('Erro ao criar índices MongoDB:', error);
  }
}

export default async function dbConnect() {
  if (cached.conn) {
    // Se já conectado mas índices não criados, tentar criar
    if (!cached.indexesCreated) {
      await createIndexesSafely();
    }
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).then(async (mongoose) => {
      // Event listeners para gerenciar índices
      mongoose.connection.on('connected', async () => {
        console.log('Conectado ao MongoDB');
        await createIndexesSafely();
      });

      mongoose.connection.on('reconnected', async () => {
        console.log('Reconectado ao MongoDB');
        await createIndexesSafely();
      });

      // Criar índices imediatamente após conexão
      await createIndexesSafely();
      
      return mongoose;
    }).catch((error) => {
      console.error('Erro na conexão MongoDB:', error);
      cached.promise = null;
      throw error;
    });
  }

  cached.conn = await cached.promise;
  global.mongoose = cached;
  return cached.conn;
}

// Exportar função para verificar/criar índices manualmente
export const ensureDatabaseIndexes = createIndexesSafely;