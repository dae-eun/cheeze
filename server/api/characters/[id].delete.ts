import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    const characterId = getRouterParam(event, 'id')

    if (!characterId) {
      throw createError({
        statusCode: 400,
        statusMessage: '캐릭터 ID가 필요합니다.'
      })
    }

    const { error } = await supabaseAdmin
      .from('characters')
      .delete()
      .eq('id', characterId)

    if (error) {
      console.error('Character deletion error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '캐릭터 삭제 중 오류가 발생했습니다.'
      })
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Character deletion error:', error)
    throw error
  }
}) 