// app/api/lists/[id]/update-status/route.js
import dbConnect from "@/lib/db";
import StudyList from "@/models/StudyList";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

export async function POST(req, context) {
  try {
    // --- 1. Autenticação Firebase ---
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(token);
    } catch (error) {
      if (error.code === 'auth/id-token-expired') {
        // Token expirado - retorna erro específico para o cliente renovar
        return NextResponse.json(
          { error: "Token expirado", code: "TOKEN_EXPIRED" },
          { status: 401 }
        );
      }
      throw error;
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