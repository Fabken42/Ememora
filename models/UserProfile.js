// models/UserProfile.js
import mongoose from 'mongoose'

const UserProfileSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: {type: String, required: true, unique: true},
  email: {type: String, required: true, unique: true},
  image: {type: String},
  bio: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema)
