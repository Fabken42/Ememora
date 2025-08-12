// app/api/lists/[id]/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import StudyList from '@/models/StudyList'
import { getAuth } from 'firebase-admin/auth'
import { isOwner } from '@/lib/isOwner'

export async function GET(req, context) {
  await dbConnect()

  try {
    const { id } = await context.params

    // tenta extrair uid do header Authorization (opcional)
    let uid = null
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const decoded = await getAuth().verifyIdToken(token)
        uid = decoded?.uid || null
      } catch (err) {
        // token inválido — apenas loga e segue como anônimo
        console.warn('Token inválido em GET /api/lists/[id]:', err.message)
        uid = null
      }
    }

    const list = await StudyList.findById(id).lean()
    if (!list) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
    }

    // monta termos adicionando `status` específico do uid (ou 0)
    const termsWithStatus = (list.terms || []).map(term => {
      const progressArray = Array.isArray(term.progress) ? term.progress : []
      const progressEntry = uid ? progressArray.find(p => String(p.userId) === String(uid)) : null
      return {
        _id: term._id,
        term: term.term,
        definition: term.definition,
        hint: term.hint || '',
        termImage: term.termImage || '',
        definitionImage: term.definitionImage || '',
        status: progressEntry ? Number(progressEntry.status || 0) : 0
      }
    })

    // retorna a lista com os termos 'sanitizados' (sem progress para não vazar dados)
    const response = {
      _id: list._id,
      title: list.title,
      description: list.description,
      category: list.category,
      public: list.public,
      ownerUid: list.ownerUid,
      terms: termsWithStatus,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('GET /api/lists/[id] - error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req, context) {
  await dbConnect();
  const body = await req.json();

  const { id } = await context.params;

  // Valida permissão pelo dono
  const authorized = await isOwner(req, body.ownerUid);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Só sanitiza termos se foram enviados
    let sanitizedTerms;
    if (Array.isArray(body.terms)) {
      sanitizedTerms = body.terms.map(t => ({
        term: t.term || '',
        definition: t.definition || '',
        hint: t.hint || '',
        termImage: t.termImage || '',
        definitionImage: t.definitionImage || '',
        progress: Array.isArray(t.progress)
          ? t.progress.map(p => ({
              userId: String(p.userId),
              status: typeof p.status === 'number' ? p.status : Number(p.status || 0)
            }))
          : []
      }));
    }

    const updateData = {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.public !== undefined && { public: body.public }),
      ...(body.category !== undefined && { category: body.category }),
      ...(sanitizedTerms !== undefined && { terms: sanitizedTerms }),
    };

    const updated = await StudyList.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/lists - error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



export async function DELETE(req, context) {
  await dbConnect()
  const { id } = await context.params
  const list = await StudyList.findById(id)
  if (!list) return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })

  const authorized = await isOwner(req, list.ownerUid)
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await StudyList.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
