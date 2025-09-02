// lib/isOwner.js
import { adminAuth } from './firebaseAdmin'

export async function isOwner(req, targetFirebaseUid) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      console.warn('[isOwner] Nenhum token encontrado')
      return false
    }

    let decoded
    try {
      decoded = await adminAuth.verifyIdToken(token)
    } catch (verifyError) {
      console.error('[isOwner] Erro ao verificar token:', verifyError)
      return false
    }
    const isSame = decoded.uid === targetFirebaseUid
    return isSame
  } catch (err) {
    console.error('[isOwner] error:', err)
    return false
  }
}
