// app/api/lists/[id]/feedback/route.js
import dbConnect from '@/lib/db'
import StudyList from '@/models/StudyList'
import { NextResponse } from 'next/server'

export async function POST(req, context) {
  await dbConnect()

  try {
    const { id } = await context.params
    const { uid, vote } = await req.json()

    if (!uid || !['like', 'dislike'].includes(vote)) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
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
      dislikedBy: list.dislikedBy
    })
  } catch (err) {
    console.error('POST /lists/[id]/feedback - erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
