// app/api/users/[uid]/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { isOwner } from '@/lib/isOwner'
import UserProfile from '@/models/UserProfile'

export async function GET(_, context) {
  await dbConnect()
  const { uid } = await context.params
  const profile = await UserProfile.findOne({ uid })
  return NextResponse.json(profile)
}

export async function POST(req, context) {
  const { uid } = await context.params
  const authorized = await isOwner(req, uid)
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbConnect()
  const body = await req.json()

  const updated = await UserProfile.findOneAndUpdate(
    { uid },
    {
      $set: {
        name: body.name,
        bio: body.bio,
        image: body.image,
      },
    },
    { new: true, upsert: true }
  )

  return NextResponse.json(updated)
}
