// app/api/lists/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import StudyList from '@/models/StudyList'
import UserProfile from '@/models/UserProfile'
import { getAuth } from 'firebase-admin/auth'
import { LIMITS } from '@/lib/utils'
import { cookies } from 'next/headers'

export async function GET(req) {
  await dbConnect()

  const { searchParams } = new URL(req.url)

  const search = searchParams.get('search') || '';
  const minProgress = parseFloat(searchParams.get('minProgress')) || 0;
  const maxProgress = parseFloat(searchParams.get('maxProgress')) || 100;
  const minTerms = parseInt(searchParams.get('minTerms')) || 0;
  const maxTerms = parseInt(searchParams.get('maxTerms')) || LIMITS.TOTAL_TERMS;
  const minLikes = parseInt(searchParams.get('minLikes')) || 0;
  const minApprovalRate = parseFloat(searchParams.get('minApprovalRate')) || 0;
  const ownerUid = searchParams.get('ownerUid')
  const category = searchParams.get('category')
  const sortBy = searchParams.get('sortBy') || 'mostRecent'
  const filter = searchParams.get('filter')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const uidParam = searchParams.get('uid')

  let authenticatedUid = null
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")?.value
  if (sessionCookie) {
    try {
      const decoded = await getAuth().verifySessionCookie(sessionCookie, true)
      authenticatedUid = decoded.uid
    } catch (err) {
      console.warn('Token inválido:', err.message)
    }
  }

  const uid = authenticatedUid || uidParam

  let baseQuery = {}

  // CONSTRUIR A QUERY BASE PRIMEIRO (SEM $text)
  if (ownerUid) {
    const ownerProfile = await UserProfile.findOne({ uid: ownerUid })
    if (!ownerProfile) {
      return NextResponse.json({ lists: [], totalPages: 0, totalCount: 0 }, { status: 200 })
    }

    if (filter === 'liked' && uid) {
      baseQuery = { likedBy: uid }
    } else if (filter === 'favorited' && uid) {
      baseQuery = { favoritedBy: uid }
    } else {
      baseQuery.owner = ownerProfile._id
      const isOwner = uid === ownerUid
      if (!isOwner) {
        baseQuery.public = true
      }
    }
  } else {
    baseQuery.public = true
  }

  if (category && category !== 'all') {
    baseQuery.category = category
  }

  if (minLikes > 0) {
    baseQuery.likes = { $gte: minLikes };
  }

  // PREPARAR A QUERY DE TEXTO SEPARADAMENTE
  let textQuery = {};
  if (search) {
    const cleanedSearch = search.trim();

    // Estratégia em camadas:
    const searchStrategies = [];

    // Camada 1: Busca exata da frase
    searchStrategies.push(`"${cleanedSearch}"`);

    // Camada 2: Termos individuais com fuzzy matching
    const terms = cleanedSearch.split(/\s+/).filter(term => term.length > 1);
    terms.forEach(term => {
      if (term.length <= 3) {
        searchStrategies.push(`"${term}"`); // Exato para termos curtos
      } else {
        // Fuzzy matching: primeiras letras + wildcard
        const prefix = term.slice(0, Math.min(4, term.length));
        searchStrategies.push(`${prefix}*`);
      }
    });

    const finalSearchQuery = searchStrategies.join(' ');

    textQuery = {
      $text: {
        $search: finalSearchQuery,
        $caseSensitive: false,
        $diacriticSensitive: false
      }
    };
  }

  // CONSTRUIR A PIPELINE CORRETAMENTE
  const aggregationPipeline = [];

  // 1. PRIMEIRO ESTÁGIO: COMBINAR QUERY DE TEXTO COM FILTROS BASE
  if (search && Object.keys(baseQuery).length > 0) {
    // Se há busca E outros filtros, usar $and
    aggregationPipeline.push({
      $match: {
        $and: [
          textQuery,
          baseQuery
        ]
      }
    });
  } else if (search) {
    // Apenas busca por texto
    aggregationPipeline.push({ $match: textQuery });
  } else if (Object.keys(baseQuery).length > 0) {
    // Apenas filtros normais
    aggregationPipeline.push({ $match: baseQuery });
  } else {
    // Sem filtros - buscar tudo
    aggregationPipeline.push({ $match: {} });
  }

  // 2. Adicionar campos calculados
  aggregationPipeline.push({
    $addFields: {
      termsCount: { $size: { $ifNull: ["$terms", []] } },
      approvalRate: {
        $cond: {
          if: { $gt: [{ $add: ["$likes", "$dislikes"] }, 0] },
          then: { $multiply: [{ $divide: ["$likes", { $add: ["$likes", "$dislikes"] }] }, 100] },
          else: 0
        }
      }
    }
  });

  // 3. Filtros baseados em campos calculados
  const additionalFilters = {};

  if (minTerms > 0 || maxTerms < 300) {
    additionalFilters.termsCount = {};
    if (minTerms > 0) {
      additionalFilters.termsCount.$gte = minTerms;
    }
    if (maxTerms < 300) {
      additionalFilters.termsCount.$lte = maxTerms;
    }
  }

  if (minApprovalRate > 0) {
    additionalFilters.approvalRate = { $gte: minApprovalRate };
  }

  if (Object.keys(additionalFilters).length > 0) {
    aggregationPipeline.push({ $match: additionalFilters });
  }

  // 4. ADICIONAR SCORING DE BUSCA SE HOUVER PESQUISA
  if (search) {
    aggregationPipeline.push({
      $addFields: {
        searchScore: { $meta: 'textScore' }
      }
    });
  }

  // 5. Contagem total para paginação
  const countPipeline = [...aggregationPipeline, { $count: "totalCount" }];
  const countResult = await StudyList.aggregate(countPipeline);
  const totalCountFromAggregation = countResult[0]?.totalCount || 0;

  // 6. Ordenação - LÓGICA CORRIGIDA
  if (search) {
    // Se há busca, ordenar por relevância primeiro
    if (sortBy === 'mostRecent') {
      aggregationPipeline.push({
        $sort: {
          searchScore: -1,
          createdAt: -1
        }
      });
    } else if (sortBy === 'mostLiked') {
      aggregationPipeline.push({
        $sort: {
          searchScore: -1,
          likes: -1
        }
      });
    } else if (sortBy === 'bestRating') {
      aggregationPipeline.push({
        $sort: {
          searchScore: -1,
          approvalRate: -1
        }
      });
    } else {
      aggregationPipeline.push({ $sort: { searchScore: -1 } });
    }
  } else {
    // Ordenação normal sem busca
    let sortStage = {};
    switch (sortBy) {
      case 'mostLiked':
        sortStage = { likes: -1 };
        break;
      case 'mostRecent':
        sortStage = { createdAt: -1 };
        break;
      case 'oldest':
        sortStage = { createdAt: 1 };
        break;
      case 'bestRating':
        sortStage = { approvalRate: -1 };
        break;
      case 'highestProgress':
      case 'lowestProgress':
        // Ordenação por progresso será tratada separadamente
        break;
      default:
        sortStage = { createdAt: -1 };
    }

    if (sortBy !== 'highestProgress' && sortBy !== 'lowestProgress') {
      aggregationPipeline.push({ $sort: sortStage });
    }
  }

  // 7. Paginação
  aggregationPipeline.push(
    { $skip: (page - 1) * limit },
    { $limit: limit }
  );

  // 8. Populate do owner
  aggregationPipeline.push({
    $lookup: {
      from: 'userprofiles',
      localField: 'owner',
      foreignField: '_id',
      as: 'owner'
    }
  });

  aggregationPipeline.push({
    $unwind: {
      path: '$owner',
      preserveNullAndEmptyArrays: true
    }
  });

  aggregationPipeline.push({
    $project: {
      title: 1,
      description: 1,
      public: 1,
      owner: {
        _id: 1,
        uid: 1,
        name: 1,
        image: 1
      },
      ownerUid: 1,
      originalListId: 1,
      terms: 1,
      likes: 1,
      likedBy: 1,
      dislikes: 1,
      dislikedBy: 1,
      favorites: 1,
      favoritedBy: 1,
      category: 1,
      createdAt: 1,
      updatedAt: 1,
      termsCount: 1,
      approvalRate: 1,
      ...(search && { searchScore: 1 }) // Incluir score apenas se houver busca
    }
  });


  let lists = [];
  let finalTotalCount = totalCountFromAggregation;
  let finalTotalPages = Math.ceil(finalTotalCount / limit);

  if (sortBy === 'highestProgress' || sortBy === 'lowestProgress') {
    if (!uid) {
      return NextResponse.json({ error: 'Usuário não autenticado para ordenar por progresso' }, { status: 400 })
    }

    // Buscar listas com aggregation básica (sem ordenação por progresso ainda)
    const baseLists = await StudyList.aggregate(aggregationPipeline);

    // Calcular progresso para cada lista (client-side)
    lists = baseLists.map(list => {
      const totalTerms = list.terms?.length || 0;
      const max = totalTerms * 6;
      const current = list.terms?.reduce((acc, term) => {
        const status = term.myStatus ?? term.progress?.find(p => p.userId === uid)?.status ?? 0;
        return acc + (typeof status === 'number' ? status : 0);
      }, 0) || 0;
      const progresso = max > 0 ? (current / max) * 100 : 0;

      return {
        ...list,
        progresso
      };
    });

    // Aplicar filtro de progresso
    if (minProgress > 0 || maxProgress < 100) {
      lists = lists.filter(list =>
        list.progresso >= minProgress && list.progresso <= maxProgress
      );
      // Atualizar contagem após filtro de progresso
      finalTotalCount = lists.length;
      finalTotalPages = Math.ceil(finalTotalCount / limit);
    }

    // Ordenar por progresso
    lists.sort((a, b) => {
      return sortBy === 'highestProgress'
        ? b.progresso - a.progresso
        : a.progresso - b.progresso;
    });

    // Paginar novamente
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = lists.slice(startIndex, endIndex);

    return NextResponse.json({
      lists: paginated,
      totalPages: finalTotalPages,
      totalCount: finalTotalCount
    });

  } else {
    // Para outras ordenações, usar aggregation normal
    lists = await StudyList.aggregate(aggregationPipeline);

    // Aplicar filtro de progresso (se necessário) - client-side
    if ((minProgress > 0 || maxProgress < 100) && uid) {
      const filteredLists = lists.filter(list => {
        const totalTerms = list.terms?.length || 0;
        const max = totalTerms * 6;
        const current = list.terms?.reduce((acc, term) => {
          const status = term.myStatus ?? term.progress?.find(p => p.userId === uid)?.status ?? 0;
          return acc + (typeof status === 'number' ? status : 0);
        }, 0) || 0;
        const progresso = max > 0 ? (current / max) * 100 : 0;

        return progresso >= minProgress && progresso <= maxProgress;
      });

      // Se aplicamos filtro de progresso, precisamos recalcular tudo
      if (filteredLists.length !== lists.length) {
        finalTotalCount = filteredLists.length;
        finalTotalPages = Math.ceil(finalTotalCount / limit);

        // Paginar os resultados filtrados
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        lists = filteredLists.slice(startIndex, endIndex);
      }
    }

    return NextResponse.json({
      lists,
      totalPages: finalTotalPages,
      totalCount: finalTotalCount
    });
  }
}

export async function POST(req) {
  await dbConnect()

  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }
    const decoded = await getAuth().verifySessionCookie(sessionCookie, true)
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
    await UserProfile.findByIdAndUpdate(
      ownerDoc._id,
      { $inc: { totalLists: 1 } }
    )
    return NextResponse.json(saved, { status: 201 })

  } catch (err) {
    console.error('POST /api/lists - error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
