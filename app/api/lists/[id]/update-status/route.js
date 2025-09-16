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
    // const token = "e123yJhbGciOiJSUzI1NiIsImtpZCI6IjUwMDZlMjc5MTVhMTcwYWIyNmIxZWUzYjgxZDExNjU0MmYxMjRmMjAiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRmFia2VuNDIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSmFBYm8yeUdJZnNOQ2M4a0pzMWpwRExSZmJhbUJ4a0gxTmZpVkttVkxjcFJxSFJUY1M9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZW1lbW9yYS0zYThjNiIsImF1ZCI6ImVtZW1vcmEtM2E4YzYiLCJhdXRoX3RpbWUiOjE3NTc4NTQ1MDAsInVzZXJfaWQiOiJUV24ySXk1UDRIV1k3NkN6bWdYM0pqaXZLNEYyIiwic3ViIjoiVFduMkl5NVA0SFdZNzZDem1nWDNKaml2SzRGMiIsImlhdCI6MTc1ODA1MTY5MywiZXhwIjoxNzU4MDU1MjkzLCJlbWFpbCI6ImZhYmtlbjQyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTAzODQ1OTg2NzE4NDczMjU5NjIyIl0sImVtYWlsIjpbImZhYmtlbjQyQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.IMyAZzsDYf7TDEu0Lmu4TDDEkX1FpAzHj_XAPfnTV0OI_0UxV2TUyntad2TUuG1FTIQfxk73cKemK-JFDJxDvczuztLpHkeicI1ecKb9muvvnxQ9OicnT8v7GwsgzwpWPlOuh-g_cxsuIWGuQmgAbo8MKRsHtCxo8LfuQnfVvsWbeUZlfEMImacJrROy4Hg7OB2Lki-sPb16hKu1x34pLKhlxt7Z15WgeYS-_zg5DI30V_LTg95k3kfpspnm10bzAy0dNfPAr6xK9r9yF-e5jsENoIVDAUR_PBgkcO1qZPMeiYKzQrhB9DxF6RphSqVqU-pCZqEfTssxJM_jG9ERsw"


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