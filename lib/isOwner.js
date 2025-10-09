import { cookies } from 'next/headers'
import { adminAuth } from './firebaseAdmin'

export async function isOwner(req, targetFirebaseUid) {
  try {
    // 🔹 Lê cookie de sessão do Firebase
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value

    if (!sessionCookie) {
      console.warn('[isOwner] Nenhum cookie de sessão encontrado')
      return false
    }

    // 🔹 Verifica cookie com Firebase Admin
    let decoded
    try {
      decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    } catch (verifyError) {
      console.error('[isOwner] Erro ao verificar cookie de sessão:', verifyError)
      return false
    }

    // 🔹 Compara UID autenticado com UID alvo
    const isSame = decoded.uid === targetFirebaseUid
    if (!isSame) {
      console.warn(`[isOwner] UID não corresponde: ${decoded.uid} !== ${targetFirebaseUid}`)
    }

    return isSame
  } catch (err) {
    console.error('[isOwner] erro inesperado:', err)
    return false
  }
}
