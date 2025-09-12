import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import StudyList from '@/models/StudyList'

export async function POST(req, context) {
  await dbConnect()

  try {
    const { id } = await context.params
    const { uid, favorite } = await req.json()

    if (!uid || typeof favorite !== 'boolean') {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
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
      favoritedBy: list.favoritedBy
    })
  } catch (err) {
    console.error('POST /lists/[id]/favorite - erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}