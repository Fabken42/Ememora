// models/UserProfile.js
import { LIMITS } from '@/lib/utils';
import mongoose from 'mongoose'

const UserProfileSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: [LIMITS.USER_NAME_MIN, `O nome de usuário deve ter pelo menos ${LIMITS.USER_NAME_MIN} caracteres`],
    maxlength: [LIMITS.USER_NAME_MAX, `O nome de usuário deve ter no máximo ${LIMITS.USER_NAME_MAX} caracteres`],
    validate: {
      validator: function (v) {
        return v.length >= LIMITS.USER_NAME_MIN && v.length <= LIMITS.USER_NAME_MAX;
      },
      message: `O nome de usuário deve ter entre ${LIMITS.USER_NAME_MIN} e ${LIMITS.USER_NAME_MAX} caracteres`
    }
  },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  bio: { type: String, default: '' },
  totalLists: { type: Number, default: 0, min: 0, max: LIMITS.TOTAL_LISTS }
}, { timestamps: true })

export default mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema)
