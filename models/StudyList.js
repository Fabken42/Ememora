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

  category: { type: String, required: true },
}, { timestamps: true })

// Durante desenvolvimento (hot-reload) forçamos redefinição se necessário
if (process.env.NODE_ENV === 'development' && mongoose.models.StudyList) {
  try { delete mongoose.models.StudyList } catch (e) { /* ignore */ }
}

const StudyList = mongoose.models.StudyList || mongoose.model('StudyList', StudyListSchema)
export default StudyList
