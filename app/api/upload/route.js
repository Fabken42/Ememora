// app/api/upload/route.js
import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const folderType = formData.get('folder') || 'others'
    const userId = formData.get('userId')
    const listId = formData.get('listId')
    const previousImageUrl = formData.get('previousImageUrl')

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Define a pasta baseada no tipo e se tem listId
    let folder = `${folderType}/${userId}`
    if (listId && folderType === 'terms') {
      folder = `${folderType}/${userId}/${listId}`
    }

    // Função para extrair public_id da URL do Cloudinary
    const extractPublicId = (url) => {
      if (!url) return null
      try {
        const urlParts = url.split('/')
        const filenameWithExtension = urlParts[urlParts.length - 1] // pega "1234567890.jpg"
        const filename = filenameWithExtension.split('.')[0] // pega "1234567890"
        return `profile_pics/${userId}/${filename}`
      } catch (error) {
        console.error('Erro ao extrair public_id:', error)
        return null
      }
    }

    // Excluir imagem anterior se existir
    if (previousImageUrl && previousImageUrl !== 'null' && previousImageUrl !== 'undefined') {
      try {
        const previousPublicId = extractPublicId(previousImageUrl)
        if (previousPublicId) {
          await cloudinary.uploader.destroy(previousPublicId)
          console.log('Imagem anterior excluída:', previousPublicId)
        }
      } catch (deleteError) {
        console.error('Erro ao excluir imagem anterior:', deleteError)
        // Não interrompe o processo se a exclusão falhar
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const timestamp = Date.now()

    const uploadPromise = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            public_id: timestamp.toString(),
            transformation: [
              { width: 500, height: 500, crop: 'fill' },
              { quality: 'auto' }
            ]
          },
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

const extractPublicId = (url) => {
  if (!url) return null
  try {
    const urlParts = url.split('/')
    const uploadIndex = urlParts.indexOf('upload') + 2
    const pathParts = urlParts.slice(uploadIndex).join('/').split('.')
    return pathParts[0] // Remove a extensão do arquivo
  } catch (error) {
    console.error('Erro ao extrair public_id:', error)
    return null
  }
}

export async function DELETE(req) {
  try {
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL da imagem não fornecida' }, { status: 400 })
    }

    const publicId = extractPublicId(imageUrl)
    if (!publicId) {
      return NextResponse.json({ error: 'URL da imagem inválida' }, { status: 400 })
    }

    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      return NextResponse.json({ success: true, message: 'Imagem excluída com sucesso' })
    } else {
      return NextResponse.json({ error: 'Falha ao excluir imagem' }, { status: 500 })
    }
  } catch (err) {
    console.error('Erro ao excluir imagem:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}