
// app/api/lists/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import StudyList from '@/models/StudyList'
import { getAuth } from 'firebase-admin/auth'
import { isOwner } from '@/lib/isOwner'

export async function POST(req) {
  await dbConnect();

  try {
    // --- Autenticação Firebase ---
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = await getAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();

    console.log('POST /api/lists - body.terms:', JSON.stringify(body.terms || [], null, 2));

    if (!body.title || !body.terms?.length) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Sanitiza termos para garantir campos corretos
    const termsFromBody = (body.terms || []).map(t => ({
      term: t.term,
      definition: t.definition,
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

    console.log('POST /api/lists - sanitized terms:', JSON.stringify(termsFromBody, null, 2));

    const newList = new StudyList({
      category: body.category || 'idiomas',
      title: body.title,
      description: body.description || '',
      public: body.public || false,
      ownerUid: uid,
      terms: termsFromBody,
    });

    console.log('POST /api/lists - newList (toObject):', JSON.stringify(newList.toObject(), null, 2));

    const saved = await newList.save();

    console.log('POST /api/lists - saved:', JSON.stringify(saved, null, 2));

    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    console.error('POST /api/lists - error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function GET(req) {
  await dbConnect()
  const { searchParams } = new URL(req.url)
  const ownerUid = searchParams.get('ownerUid')
  const category = searchParams.get('category')

  const filter = {}
  if (category && category !== 'all') filter.category = category

  if (ownerUid) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const isOwn = token && await isOwner(req, ownerUid)

    filter.ownerUid = ownerUid
    if (!isOwn) filter.public = true
  } else {
    filter.public = true
  }

  try {
    const lists = await StudyList.find(filter).sort({ updatedAt: -1 })
    return NextResponse.json(lists)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
