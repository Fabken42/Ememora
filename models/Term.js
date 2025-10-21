// models/Term.js
import mongoose from 'mongoose'

// Subschema explícito para progress (sem _id em cada subdoc)
const ProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  status: { type: Number, default: 2, min: 0, max: 6 }
}, { _id: false })

const TermSchema = new mongoose.Schema({
  term: { type: String, required: true },
  definition: { type: String, required: true },
  hint: { type: String, default: '' },
  termImage: { type: String, default: '' },       // URL da imagem do termo
  definitionImage: { type: String, default: '' }, // URL da imagem da definição
  progress: { type: [ProgressSchema], default: [] }
})

export default TermSchema
