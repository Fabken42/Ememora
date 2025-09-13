// app/api/lists/[id]/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import StudyList from '@/models/StudyList'
import { getAuth } from 'firebase-admin/auth'
import { isOwner } from '@/lib/isOwner'
import { TERM_PAGE_SIZE, LIMITS } from '@/lib/utils'
import UserProfile from '@/models/UserProfile'

export async function GET(req, context) {
  await dbConnect()

  try {
    const { id } = await context.params
    const { searchParams } = new URL(req.url)

    const includePerfect = searchParams.get('includePerfect') !== 'false'
    const sortOption = searchParams.get('sort') || 'normal'
    const limit = parseInt(searchParams.get('limit') || '0', 10)
    const page = parseInt(searchParams.get('page') || '0', 10)

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

    // Calcular progresso total ANTES de filtrar
    let totalCurrent = 0
    let totalMax = 0

    const termsWithStatus = (list.terms || []).map(term => {
      const progressArray = Array.isArray(term.progress) ? term.progress : []
      const progressEntry = uid ? progressArray.find(p => String(p.userId) === String(uid)) : null
      const status = progressEntry ? Number(progressEntry.status || 0) : 0

      // Acumular para cálculo do progresso total
      totalCurrent += status
      totalMax += 6

      return {
        _id: term._id,
        term: term.term,
        definition: term.definition,
        hint: term.hint || '',
        termImage: term.termImage || '',
        definitionImage: term.definitionImage || '',
        status: status,
      }
    })

    // Calcular progresso total
    const totalProgress = totalMax > 0 ? Math.round((totalCurrent / totalMax) * 100) : 0

    let filteredTerms = termsWithStatus
    if (!includePerfect) {
      filteredTerms = filteredTerms.filter(t => t.status !== 6)
    }

    if (limit > 0) {
      if (sortOption === 'random') {
        // Embaralha o array
        filteredTerms = filteredTerms.sort(() => Math.random() - 0.5)
      }

      filteredTerms = filteredTerms.slice(0, limit)
    }

    switch (sortOption) {
      case 'best':
        filteredTerms.sort((a, b) => (b.status || 0) - (a.status || 0))
        break
      case 'worst':
        filteredTerms.sort((a, b) => (a.status || 0) - (b.status || 0))
        break
      default:
        // Mantém ordem original
        break
    }

    let totalTerms = filteredTerms.length
    let totalPages = 1
    let paginatedTerms = filteredTerms

    if (page > 0) {
      totalPages = Math.ceil(totalTerms / TERM_PAGE_SIZE)
      const start = (page - 1) * TERM_PAGE_SIZE
      const end = start + TERM_PAGE_SIZE
      paginatedTerms = filteredTerms.slice(start, end)
    }

    return NextResponse.json({
      _id: list._id,
      title: list.title,
      description: list.description,
      category: list.category,
      public: list.public,
      ownerUid: list.ownerUid,
      terms: paginatedTerms,
      totalTerms,
      totalPerfectTerms: termsWithStatus.filter(t => t.status === 6).length,
      totalProgress,
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

  // Busca a lista atual primeiro
  const currentList = await StudyList.findById(id);
  if (!currentList) {
    return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
  }

  // Validações de limite no backend
  if (body.title && body.title.length > LIMITS.TITLE) {
    return NextResponse.json({ error: `Título deve ter no máximo ${LIMITS.TITLE} caracteres` }, { status: 400 });
  }

  if (body.description && body.description.length > LIMITS.DESCRIPTION) {
    return NextResponse.json({ error: `Descrição deve ter no máximo ${LIMITS.DESCRIPTION} caracteres` }, { status: 400 });
  }

  try {
    let updatedTerms;
    if (Array.isArray(body.terms)) {
      if (body.terms.length > LIMITS.TOTAL_TERMS) {
        return NextResponse.json({ error: `Limite máximo de ${LIMITS.TOTAL_TERMS} termos` }, { status: 400 });
      }

      // ⚠️ CORREÇÃO: Preserva o progresso dos termos existentes
      updatedTerms = await Promise.all(body.terms.map(async (newTerm) => {
        // Validação individual de cada termo
        if (newTerm.term && newTerm.term.length > LIMITS.TERM) {
          throw new Error(`Termo deve ter no máximo ${LIMITS.TERM} caracteres`);
        }
        if (newTerm.definition && newTerm.definition.length > LIMITS.DEFINITION) {
          throw new Error(`Definição deve ter no máximo ${LIMITS.DEFINITION} caracteres`);
        }
        if (newTerm.hint && newTerm.hint.length > LIMITS.TIP) {
          throw new Error(`Dica deve ter no máximo ${LIMITS.TIP} caracteres`);
        }

        // Busca o termo correspondente na lista atual para preservar o progresso
        const existingTerm = currentList.terms.find(t =>
          t.term === newTerm.term && t.definition === newTerm.definition
        );

        return {
          term: newTerm.term || '',
          definition: newTerm.definition || '',
          hint: newTerm.hint || '',
          termImage: newTerm.termImage || '',
          definitionImage: newTerm.definitionImage || '',
          progress: existingTerm?.progress || newTerm.progress || [] // ← PRESERVA PROGRESSO
        };
      }));
    }

    const updateData = {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.public !== undefined && { public: body.public }),
      ...(body.category !== undefined && { category: body.category }),
      ...(updatedTerms !== undefined && { terms: updatedTerms }),
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
  if (!authorized) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    await StudyList.findByIdAndDelete(id)

    // Decrementar o contador de listas do usuário
    const ownerDoc = await UserProfile.findOne({ uid: list.ownerUid })
    if (ownerDoc) {
      await UserProfile.findByIdAndUpdate(
        ownerDoc._id,
        { $inc: { totalLists: -1 } }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}