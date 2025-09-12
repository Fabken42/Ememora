// models/StudyList.js
import mongoose from 'mongoose'
import TermSchema from './Term'

const StudyListSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  public: { type: Boolean, default: false },

  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  ownerUid: { type: String, required: true }, // UID do Firebase

  originalListId: { type: String },
  terms: { type: [TermSchema], default: [] },

  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  dislikes: { type: Number, default: 0 },
  dislikedBy: { type: [String], default: [] },
  favorites: { type: Number, default: 0 },
  favoritedBy: { type: [String], default: [] },

  category: { type: String, required: true },
}, { timestamps: true })

// Criar índice de texto para busca avançada
StudyListSchema.index({
  title: 'text',
  description: 'text',
  category: 'text'
}, {
  weights: {
    title: 10,       // Título tem o maior peso
    description: 5,  // Descrição peso médio
    category: 3      // Categoria peso menor
  },
  name: 'TextSearchIndex',
  default_language: 'none' // Idioma para stemming e stop words
});

// Índices adicionais para performance
StudyListSchema.index({ owner: 1 });
StudyListSchema.index({ public: 1 });
StudyListSchema.index({ createdAt: -1 });
StudyListSchema.index({ likes: -1 });

// Durante desenvolvimento (hot-reload) forçamos redefinição se necessário
if (process.env.NODE_ENV === 'development' && mongoose.models.StudyList) {
  try {
    delete mongoose.models.StudyList;
    // Também remover o índice se necessário
    mongoose.connection.db.collection('studylists').dropIndex('TextSearchIndex')
      .catch(() => { }); // Ignora erro se o índice não existir
  } catch (e) { /* ignore */ }
}

const StudyList = mongoose.models.StudyList || mongoose.model('StudyList', StudyListSchema)

export const ensureIndexes = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB não conectado, pulando criação de índices');
      return;
    }

    await StudyList.createIndexes();
    console.log('Índices do StudyList criados/verificados');
  } catch (error) {
    // Ignora erro se os índices já existirem
    if (error.code === 85) { // IndexOptionsConflict
      console.log('Índices já existem, atualizando...');
      // Tenta recriar os índices
      try {
        await StudyList.collection.dropIndexes();
        await StudyList.createIndexes();
        console.log('Índices recriados com sucesso');
      } catch (dropError) {
        console.error('Erro ao recriar índices:', dropError);
      }
    } else {
      console.error('Erro ao criar índices do StudyList:', error);
    }
  }
};

export default StudyList