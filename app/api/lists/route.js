// app/api/lists/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import StudyList from '@/models/StudyList'
import UserProfile from '@/models/UserProfile'
import { getAuth } from 'firebase-admin/auth'

export async function GET(req) {
  await dbConnect()

  const { searchParams } = new URL(req.url)
  const ownerUid = searchParams.get('ownerUid')
  const category = searchParams.get('category')
  const sortBy = searchParams.get('sortBy') || 'mostRecent'
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const uidParam = searchParams.get('uid') // usuário logado (para progresso)

  // Verifica autenticação via token para maior segurança
  let authenticatedUid = null
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      const decoded = await getAuth().verifyIdToken(token)
      authenticatedUid = decoded.uid
    } catch (err) {
      console.warn('Token inválido:', err.message)
    }
  }

  // Usa o UID autenticado (mais seguro) ou o UID do parâmetro
  const uid = authenticatedUid || uidParam

  let filter = {}
  
  if (ownerUid) {
    const ownerProfile = await UserProfile.findOne({ uid: ownerUid })
    if (!ownerProfile) {
      return NextResponse.json({ lists: [], totalPages: 0 }, { status: 200 })
    }
    filter.owner = ownerProfile._id
    
    // Verifica se o usuário atual é o dono das listas
    const isOwner = uid === ownerUid
    
    if (!isOwner) {
      // Se não é o dono, mostra apenas listas públicas
      filter.public = true
    }
    // Se é o dono, não filtra por 'public' - mostra todas
  } else {
    // Página inicial - mostra apenas listas públicas
    filter.public = true
  }

  if (category && category !== 'all') {
    filter.category = category
  }

  // Caso seja ordenação por progresso, traz tudo para calcular manualmente
  let lists
  if (sortBy === 'highestProgress' || sortBy === 'lowestProgress') {
    if (!uid) {
      return NextResponse.json({ error: 'Usuário não autenticado para ordenar por progresso' }, { status: 400 })
    }

    lists = await StudyList.find(filter)
      .populate('owner', 'uid name image')
      .lean()

    // formata owner
    lists = lists.map(list => ({
      ...list,
      owner: list.owner
        ? {
            _id: list.owner._id,
            uid: list.owner.uid || null,
            name: list.owner.name || 'Usuário',
            image: list.owner.image || null
          }
        : null
    }))

    // calcula progresso por lista
    lists = lists.map(list => {
      const totalTerms = list.terms?.length || 0
      const max = totalTerms * 6
      const current = list.terms?.reduce((acc, term) => {
        const status = term.myStatus ?? term.progress?.find(p => p.userId === uid)?.status ?? 0
        return acc + (typeof status === 'number' ? status : 0)
      }, 0) || 0
      const progresso = max > 0 ? (current / max) * 100 : 0
      return { ...list, progresso }
    })

    // ordena por progresso
    lists.sort((a, b) => {
      return sortBy === 'highestProgress'
        ? b.progresso - a.progresso
        : a.progresso - b.progresso
    })

    // paginação manual
    const totalDocs = lists.length
    const totalPages = Math.ceil(totalDocs / limit)
    const paginated = lists.slice((page - 1) * limit, page * limit)

    return NextResponse.json({ lists: paginated, totalPages })
  }

  // total para calcular páginas (outros casos)
  const totalDocs = await StudyList.countDocuments(filter)
  const totalPages = Math.ceil(totalDocs / limit)

  // busca base com paginação (quando não for progresso)
  lists = await StudyList.find(filter)
    .populate('owner', 'uid name image')
    .lean()
    .skip((page - 1) * limit)
    .limit(limit)

  // formata owner
  lists = lists.map(list => ({
    ...list,
    owner: list.owner
      ? {
          _id: list.owner._id,
          uid: list.owner.uid || null,
          name: list.owner.name || 'Usuário',
          image: list.owner.image || null
        }
      : null
  }))

  // ordenação normal
  if (sortBy === 'mostLiked') {
    lists.sort((a, b) => (b.likes || 0) - (a.likes || 0))
  } else if (sortBy === 'mostRecent') {
    lists.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else if (sortBy === 'oldest') {
    lists.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  } else if (sortBy === 'bestRating') {
    lists.sort((a, b) => {
      const aTotal = (a.likes || 0) + (a.dislikes || 0)
      const bTotal = (b.likes || 0) + (b.dislikes || 0)
      const aRatio = aTotal > 0 ? a.likes / aTotal : 0
      const bRatio = bTotal > 0 ? b.likes / bTotal : 0
      return bRatio - aRatio
    })
  }

  return NextResponse.json({ lists, totalPages })
}

export async function POST(req) {
  await dbConnect()

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await getAuth().verifyIdToken(token)
    const uid = decoded.uid

    // Buscar usuário pelo uid do Firebase
    const ownerDoc = await UserProfile.findOne({ uid })
    if (!ownerDoc) {
      return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 404 })
    }

    const body = await req.json()
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

    const termsFromBody = Array.isArray(body.terms)
      ? body.terms.map(t => ({
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
      }))
      : []

    const newList = new StudyList({
      category: body.category || 'languages',
      title: body.title,
      description: body.description || '',
      public: !!body.public,
      owner: ownerDoc._id, // referência para UserProfile
      ownerUid: ownerDoc.uid, // UID do Firebase
      terms: termsFromBody,
    })

    const saved = await newList.save()
    return NextResponse.json(saved, { status: 201 })

  } catch (err) {
    console.error('POST /api/lists - error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
