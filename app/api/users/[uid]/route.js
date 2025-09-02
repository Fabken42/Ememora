// app/api/users/[uid]/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { isOwner } from '@/lib/isOwner'
import UserProfile from '@/models/UserProfile'

export async function GET(req, { params }) {
  await dbConnect()
  const { uid } = params

  if (!uid) {
    return NextResponse.json({ error: 'UID não fornecido' }, { status: 400 })
  }

  const profile = await UserProfile.findOne({ uid }).lean()

  if (!profile) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  return NextResponse.json(profile)
}



export async function POST(req, context) {
  const { uid } = await context.params

  const authorized = await isOwner(req, uid)
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbConnect()

  let body
  try {
    body = await req.json()
  } catch (jsonErr) {
    console.error('[POST /api/users/[uid]] Erro ao ler body JSON:', jsonErr)
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  try {
    const updated = await UserProfile.findOneAndUpdate(
      { uid },
      {
        $set: {
          name: body.name,
          bio: body.bio,
          image: body.image,
          email: body.email,
        },
      },
      { new: true, upsert: true }
    )
    return NextResponse.json(updated)
  } catch (dbErr) {
    console.error('[POST /api/users/[uid]] Erro no Mongo:', dbErr)
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }
}