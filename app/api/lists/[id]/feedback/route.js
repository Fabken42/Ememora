import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import StudyList from '@/models/StudyList'
import { getAuth } from 'firebase-admin/auth'

export async function POST(req, context) {
  await dbConnect()

  try {
    // Verificação de autenticação
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await getAuth().verifyIdToken(token)
    const uid = decoded.uid // Obtém o UID do token autenticado

    const { id } = await context.params
    const { vote } = await req.json() // Agora só recebe o vote

    if (!['like', 'dislike'].includes(vote)) {
      return NextResponse.json({ error: 'Parâmetro vote inválido' }, { status: 400 })
    }

    const list = await StudyList.findById(id)
    if (!list) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
    }

    const alreadyLiked = list.likedBy.includes(uid)
    const alreadyDisliked = list.dislikedBy.includes(uid)

    if (vote === 'like') {
      if (alreadyLiked) {
        // Remove like
        list.likes -= 1
        list.likedBy = list.likedBy.filter(u => u !== uid)
      } else {
        // Se já tinha dado dislike → remove
        if (alreadyDisliked) {
          list.dislikes -= 1
          list.dislikedBy = list.dislikedBy.filter(u => u !== uid)
        }
        // Adiciona like
        list.likes += 1
        list.likedBy.push(uid)
      }
    } else if (vote === 'dislike') {
      if (alreadyDisliked) {
        // Remove dislike
        list.dislikes -= 1
        list.dislikedBy = list.dislikedBy.filter(u => u !== uid)
      } else {
        // Se já tinha dado like → remove
        if (alreadyLiked) {
          list.likes -= 1
          list.likedBy = list.likedBy.filter(u => u !== uid)
        }
        // Adiciona dislike
        list.dislikes += 1
        list.dislikedBy.push(uid)
      }
    }

    await list.save()

    return NextResponse.json({
      likes: list.likes,
      dislikes: list.dislikes,
      likedBy: list.likedBy,
      dislikedBy: list.dislikedBy,
      userVote: vote === 'like' ? 'like' : vote === 'dislike' ? 'dislike' : null
    })
  } catch (err) {
    console.error('POST /lists/[id]/feedback - erro:', err)
    
    // Tratamento específico para token expirado
    if (err.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expirado', code: 'TOKEN_EXPIRED' }, 
        { status: 401 }
      )
    }
    
    // Tratamento para token inválido
    if (err.code === 'auth/argument-error' || err.code === 'auth/invalid-id-token') {
      return NextResponse.json(
        { error: 'Token inválido' }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}