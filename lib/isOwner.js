// lib/isOwner.js
import { adminAuth } from './firebaseAdmin'

export async function isOwner(req, targetUid) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return false

    const decoded = await adminAuth.verifyIdToken(token)
    return decoded.uid === targetUid
  } catch (err) {
    console.error('isOwner error:', err)
    return false
  }
}

