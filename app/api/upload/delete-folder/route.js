// app/api/upload/delete-folder/route.js
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

    const { folderPath, images } = await req.json()

    if (!folderPath) {
      return NextResponse.json({ error: 'Caminho da pasta não fornecido' }, { status: 400 })
    }

    // Verifica se a pasta pertence ao usuário autenticado
    if (!folderPath.includes(`/${uid}/`)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    let deletedCount = 0;

    // Primeiro, exclui imagens específicas se fornecidas
    if (images && images.length > 0) {
      for (const imageUrl of images) {
        try {
          const urlParts = imageUrl.split('/')
          const uploadIndex = urlParts.indexOf('upload') + 2
          const pathParts = urlParts.slice(uploadIndex).join('/').split('.')
          const publicId = pathParts[0]

          if (publicId) {
            await cloudinary.uploader.destroy(publicId)
            deletedCount++
          }
        } catch (error) {
          console.error('Erro ao excluir imagem individual:', error)
        }
      }
    }

    // Depois tenta excluir a pasta inteira (opcional - mais agressivo)
    try {
      const result = await cloudinary.api.delete_folder(folderPath)
      console.log('Pasta excluída:', folderPath)
    } catch (folderError) {
      console.log('Pasta não existe ou já foi excluída:', folderPath)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Excluídas ${deletedCount} imagens e pasta ${folderPath}` 
    })
    
  } catch (err) {
    console.error('Erro ao excluir pasta:', err)
    
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