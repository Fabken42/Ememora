// models/StudyList.js
import mongoose from 'mongoose'
import TermSchema from './Term'

const StudyListSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  public: { type: Boolean, default: false },
  ownerUid: { type: String },
  originalListId: { type: String },
  // Define explicitamente o tipo e default para evitar comportamentos estranhos
  terms: { type: [TermSchema], default: [] },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  category: { type: String, required: true },
}, { timestamps: true })

// Durante desenvolvimento (hot-reload) forçamos redefinição se necessário
if (process.env.NODE_ENV === 'development' && mongoose.models.StudyList) {
  try { delete mongoose.models.StudyList } catch (e) { /* ignore */ }
}

const StudyList = mongoose.models.StudyList || mongoose.model('StudyList', StudyListSchema)
export default StudyList
