// app/api/lists/[id]/update-status/route.js
import dbConnect from "@/lib/db";
import StudyList from "@/models/StudyList";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";

export async function POST(req, context) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await getAuth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
      return NextResponse.json({ error: "Sessão inválida ou expirada" }, { status: 401 });
    }

    const uid = decoded.uid;

    // --- 2. Pega dados do body ---
    const { id } = await context.params;
    const { term, correct } = await req.json();

    if (!term || typeof correct !== "boolean") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    await dbConnect();

    // --- 3. Busca lista e termo ---
    const list = await StudyList.findById(id);
    if (!list) {
      return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 });
    }

    const item = list.terms.find(t => t.term === term);
    if (!item) {
      return NextResponse.json({ error: "Termo não encontrado" }, { status: 404 });
    }

    // Garante que exista um array progress
    if (!Array.isArray(item.progress)) {
      item.progress = [];
    }

    // --- 4. Atualiza ou cria progresso do usuário ---
    let userProgress = item.progress.find(p => p.userId.toString() === uid);
    if (!userProgress) {
      userProgress = {
        userId: uid,
        status: correct ? 1 : 0
      };
      item.progress.push(userProgress);
    } else {
      if (correct) {
        userProgress.status = Math.min(6, userProgress.status + 1);
      } else {
        userProgress.status = Math.max(0, userProgress.status - 1);
      }
    }

    await list.save();

    return NextResponse.json({ success: true, status: userProgress.status });
  } catch (err) {
    console.error("update-status error:", err);

    // Tratamento específico para token expirado
    if (err.code === 'auth/id-token-expired' || err.message?.includes('Token expirado')) {
      return NextResponse.json(
        { error: "Token expirado", code: "TOKEN_EXPIRED" },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}