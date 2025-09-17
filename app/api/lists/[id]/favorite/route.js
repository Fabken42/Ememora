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
    const { favorite } = await req.json() // Agora só recebe o favorite

    if (typeof favorite !== 'boolean') {
      return NextResponse.json({ error: 'Parâmetro favorite inválido' }, { status: 400 })
    }

    const list = await StudyList.findById(id)
    if (!list) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
    }

    const alreadyFavorited = list.favoritedBy.includes(uid)

    if (favorite) {
      if (!alreadyFavorited) {
        list.favorites += 1
        list.favoritedBy.push(uid)
      }
    } else {
      if (alreadyFavorited) {
        list.favorites = Math.max(0, list.favorites - 1)
        list.favoritedBy = list.favoritedBy.filter(u => u !== uid)
      }
    }

    await list.save()

    return NextResponse.json({
      favorites: list.favorites,
      favorited: favorite,
      favoritedBy: list.favoritedBy
    })
  } catch (err) {
    console.error('POST /lists/[id]/favorite - erro:', err)
    
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