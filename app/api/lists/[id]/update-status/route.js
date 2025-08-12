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
    const decoded = await getAuth().verifyIdToken(token);
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
      if(correct) userProgress = { userId: uid, status: 1 };
      else userProgress = { userId: uid, status: 0 };
      
      item.progress.push(userProgress);
    }

    if (correct) {
      userProgress.status = Math.min(6, userProgress.status + 1);
    } else {
      userProgress.status = Math.max(0, userProgress.status - 1);
    }

    await list.save();

    return NextResponse.json({ success: true, status: userProgress.status });
  } catch (err) {
    console.error("update-status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
