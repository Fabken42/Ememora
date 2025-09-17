// app/api/upload/route.js
import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import { getAuth } from 'firebase-admin/auth'

export async function POST(req) {
  try {
    // Verificação de autenticação
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await getAuth().verifyIdToken(token)
    const uid = decoded.uid

    const formData = await req.formData()
    const file = formData.get('file')
    const folderType = formData.get('folder') || 'others'
    const userId = formData.get('userId')
    const listId = formData.get('listId')
    const previousImageUrl = formData.get('previousImageUrl')

    // Verifica se o usuário autenticado é o mesmo que está tentando fazer upload
    if (userId !== uid) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

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
        return `${folderType}/${userId}/${listId ? `${listId}/` : ''}${filename}`
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

    // Tratamento específico para token expirado
    if (err.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expirado', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      )
    }

    // Tratamento para token inválido
    if (err.code === 'auth/argument-error' || err.code === 'auth/invalid-id-token') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Função auxiliar para extrair public_id
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
    // Verificação de autenticação
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await getAuth().verifyIdToken(token)
    const uid = decoded.uid

    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL da imagem não fornecida' }, { status: 400 })
    }

    // Verifica se a imagem pertence ao usuário autenticado
    // As imagens são armazenadas em pastas com o userId, então podemos verificar isso
    if (!imageUrl.includes(`/${uid}/`)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
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

    // Tratamento específico para token expirado
    if (err.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expirado', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      )
    }

    // Tratamento para token inválido
    if (err.code === 'auth/argument-error' || err.code === 'auth/invalid-id-token') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}