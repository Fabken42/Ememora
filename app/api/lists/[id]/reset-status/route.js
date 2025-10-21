// app/api/lists/[id]/reset-status/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import StudyList from '@/models/StudyList'
import { getAuth } from 'firebase-admin/auth'
import { cookies } from "next/headers";

export async function PATCH(req, context) {
  await dbConnect()

  try {
    const { id } = await context.params
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const decoded = await getAuth().verifySessionCookie(sessionCookie, true)
    const uid = decoded.uid


    const list = await StudyList.findById(id)
    if (!list) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
    }

    // --- Resetar status somente do usuário logado ---
    list.terms.forEach(term => {
      const progressEntry = term.progress?.find(p => p.userId.toString() === uid)
      if (progressEntry) {
        progressEntry.status = 2
      }
    })

    const saved = await list.save()
    return NextResponse.json({ success: true, terms: saved.terms })
  } catch (err) {
    console.error('reset-status error:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
