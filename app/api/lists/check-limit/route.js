import { NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import dbConnect from '@/lib/db'
import UserProfile from '@/models/UserProfile'
import { LIMITS } from '@/lib/utils'
import { cookies } from 'next/headers'

export async function GET(req) {
    await dbConnect()
    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('session')?.value
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        const decoded = await getAuth().verifySessionCookie(sessionCookie, true)
        const uid = decoded.uid


        // Buscar usuário pelo uid do Firebase
        const user = await UserProfile.findOne({ uid })
        if (!user) {
            return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 404 })
        }

        const canCreate = user.totalLists < LIMITS.TOTAL_LISTS

        return NextResponse.json({
            canCreate,
            currentCount: user.totalLists,
            maxLimit: LIMITS.TOTAL_LISTS,
            remaining: LIMITS.TOTAL_LISTS - user.totalLists
        })

    } catch (err) {
        console.error('GET /api/lists/check-limit - error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}