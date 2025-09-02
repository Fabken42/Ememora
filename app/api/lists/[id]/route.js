// app/api/lists/[id]/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import StudyList from '@/models/StudyList'
import { getAuth } from 'firebase-admin/auth'
import { isOwner } from '@/lib/isOwner'

// /app/api/lists/[id]/route.js 
export async function GET(req, context) {
  await dbConnect()

  try {
    const { id } = context.params
    const { searchParams } = new URL(req.url)

    const includePerfect = searchParams.get('includePerfect') !== 'false'
    const limit = parseInt(searchParams.get('limit') || '0', 10)
    const page = parseInt(searchParams.get('page') || '0', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const isRandomOrder = searchParams.get('isRandomOrder') === 'true'

    const list = await StudyList.findById(id).lean()
    if (!list) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
    }

    if (!list.public) {
      const allowed = await isOwner(req, list.ownerUid)
      if (!allowed) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
    }

    let uid = null
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const decoded = await getAuth().verifyIdToken(token)
        uid = decoded?.uid || null
      } catch (err) {
        console.warn('Token inválido em GET /api/lists/[id]:', err.message)
      }
    }

    let termsWithStatus = (list.terms || []).map(term => {
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

    if (!includePerfect) {
      termsWithStatus = termsWithStatus.filter(t => t.status !== 6)
    }

    if (isRandomOrder) {
      termsWithStatus = termsWithStatus.sort(() => Math.random() - 0.5)
    }

    if (limit > 0) {
      termsWithStatus = termsWithStatus.slice(0, limit)
    }

    let totalTerms = termsWithStatus.length
    let totalPages = 1
    if (page > 0) {
      totalPages = Math.ceil(totalTerms / pageSize)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      termsWithStatus = termsWithStatus.slice(start, end)
    }

    return NextResponse.json({
      _id: list._id,
      title: list.title,
      description: list.description,
      category: list.category,
      public: list.public,
      ownerUid: list.ownerUid,
      terms: termsWithStatus,
      totalTerms,
      totalPerfectTerms: (list.terms || []).filter(term => {
        const progressArray = Array.isArray(term.progress) ? term.progress : []
        const progressEntry = uid ? progressArray.find(p => String(p.userId) === String(uid)) : null
        return progressEntry ? Number(progressEntry.status || 0) === 6 : false
      }).length,
      totalPages,
      currentPage: page > 0 ? page : null,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt
    })
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
