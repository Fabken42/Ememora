import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export async function POST(req) {
  try {
    const { folderPath, images } = await req.json()

    if (!folderPath) {
      return NextResponse.json({ error: 'Caminho da pasta não fornecido' }, { status: 400 })
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}