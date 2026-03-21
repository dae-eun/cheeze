import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import { readMultipartFormData } from 'h3'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const BUCKET_NAME = 'quiz-images'

async function ensureQuizImagesBucket(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (buckets?.some((b) => b.name === BUCKET_NAME)) return

  const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024
  })
  if (error) {
    console.error('Create quiz-images bucket error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '스토리지 버킷 생성에 실패했습니다. Supabase Dashboard에서 quiz-images 버킷을 수동으로 생성해주세요.'
    })
  }
}

export async function uploadQuizImage(
  supabaseAdmin: ReturnType<typeof createClient>,
  organizationId: string,
  roomId: string,
  problemId: string,
  file: { data: Buffer; filename?: string; type?: string }
) {
  const ext = (file.filename?.split('.').pop() || 'png').toLowerCase()
  const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'png'

  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: '허용된 이미지 형식만 업로드 가능합니다. (jpg, png, gif, webp)'
    })
  }

  if (file.data.length > MAX_SIZE_BYTES) {
    throw createError({
      statusCode: 400,
      statusMessage: '파일 크기는 5MB 이하여야 합니다.'
    })
  }

  const path = `${organizationId}/${roomId}/${problemId}.${safeExt}`

  await ensureQuizImagesBucket(supabaseAdmin)

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(path, file.data, {
      contentType: file.type || `image/${safeExt}`,
      upsert: true
    })

  if (error) {
    console.error('Quiz image upload error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '이미지 업로드에 실패했습니다.'
    })
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(data.path)
  return urlData.publicUrl
}

export async function parseMultipartImage(event: H3Event, fieldName = 'image') {
  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    return null
  }

  const filePart = parts.find((p) => p.name === fieldName && p.filename)
  if (!filePart || !filePart.data) {
    return null
  }

  return {
    data: filePart.data,
    filename: filePart.filename,
    type: filePart.type
  }
}
