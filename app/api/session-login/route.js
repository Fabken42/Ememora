// app/api/session-login/route.js
import { getAuth } from "firebase-admin/auth"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { idToken } = await req.json()
    if (!idToken) {
      return NextResponse.json({ error: "idToken não fornecido" }, { status: 400 })
    }

    const expiresIn = 14 * 24 * 60 * 60 * 1000 // 14 dias
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn })

    const res = NextResponse.json({ success: true })
    res.cookies.set({
      name: "session",
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })

    return res
  } catch (err) {
    console.error("Erro ao criar sessão:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
