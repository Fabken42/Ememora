// app/api/users/[uid]/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { isOwner } from '@/lib/isOwner'
import UserProfile from '@/models/UserProfile'
import { LIMITS } from '@/lib/utils'
import { cookies } from "next/headers";

export async function GET(req, context) {
  await dbConnect()
  const { uid } = await context.params

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
  try {
    const { uid } = await context.params;

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })
    }

    const authorized = await isOwner(req, uid);
    if (!authorized) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    await dbConnect();

    let body;
    try {
      body = await req.json();
    } catch (jsonErr) {
      console.error('[POST /api/users/[uid]] Erro ao ler body JSON:', jsonErr);
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }

    // Validação do nome
    if (body.name !== undefined && body.name !== null) {
      const trimmedName = body.name.trim().slice(0, LIMITS.USER_NAME_MAX);
      if (trimmedName.length === 0) {
        return NextResponse.json(
          { error: 'O nome não pode ficar vazio' },
          { status: 400 }
        );
      }
      if (trimmedName.length < LIMITS.USER_NAME_MIN || trimmedName.length > LIMITS.USER_NAME_MAX) {
        return NextResponse.json(
          { error: `O nome deve ter entre ${LIMITS.USER_NAME_MIN} e ${LIMITS.USER_NAME_MAX} caracteres` },
          { status: 400 }
        );
      }
      // Atualiza o nome com a versão trimada
      body.name = trimmedName;
    }

    // Validação da bio (opcional, mas com limite máximo)
    if (body.bio !== undefined && body.bio !== null) {
      if (body.bio.length > LIMITS.USER_BIO_MAX) {
        return NextResponse.json(
          { error: `A biografia deve ter no máximo ${LIMITS.USER_BIO_MAX} caracteres` },
          { status: 400 }
        );
      }
      // Remove espaços em branco extras se a bio não estiver vazia
      if (body.bio.trim().length === 0) {
        body.bio = ''; // Permite bio vazia
      } else {
        body.bio = body.bio.trim(); // Remove espaços extras mas mantém o conteúdo
      }
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
          $setOnInsert: {
            totalLists: 0 // Só define na criação
          }
        },
        { new: true, upsert: true }
      );

      return NextResponse.json(updated);
    } catch (dbErr) {
      console.error('[POST /api/users/[uid]] Erro no Mongo:', dbErr);

      // Tratamento específico para erro de duplicate key
      if (dbErr.code === 11000 || dbErr.code === 11001) {
        const field = Object.keys(dbErr.keyPattern)[0];
        let errorMessage = 'Erro de duplicação';

        if (field === 'name') {
          errorMessage = 'Nome de usuário já está em uso';
        } else if (field === 'email') {
          errorMessage = 'Este email já está em uso.';
        }

        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

  } catch (err) {
    console.error('[POST /api/users/[uid]] Erro geral:', err);

    // Tratamento específico para token expirado
    if (err.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expirado', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    // Tratamento para token inválido
    if (err.code === 'auth/argument-error' || err.code === 'auth/invalid-id-token') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}