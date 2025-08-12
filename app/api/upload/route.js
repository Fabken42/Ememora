// app/api/upload/route.js
import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const folderType = formData.get('folder') || 'terms' // default "terms"

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Função auxiliar para usar upload_stream com async/await
    const uploadPromise = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: folderType },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        stream.end(buffer)
      })
    }

    const uploaded = await uploadPromise()

    return NextResponse.json({ url: uploaded.secure_url })
  } catch (err) {
    console.error('Erro no upload:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
