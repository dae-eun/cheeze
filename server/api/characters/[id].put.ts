import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    const characterId = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { name, server_id, is_main } = body

    if (!characterId || !name || !server_id) {
      throw createError({
        statusCode: 400,
        statusMessage: '필수 정보를 모두 입력해주세요.'
      })
    }

    // 메인 캐릭터로 변경하려는 경우, 기존 메인 캐릭터를 서브로 변경
    if (is_main) {
      // 먼저 현재 캐릭터의 사용자 ID를 가져옴
      const { data: currentCharacter, error: fetchError } = await supabaseAdmin
        .from('characters')
        .select('user_id')
        .eq('id', characterId)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching current character:', fetchError)
        throw createError({
          statusCode: 500,
          statusMessage: '캐릭터 정보 조회 중 오류가 발생했습니다.'
        })
      }

      if (currentCharacter) {
        const { error: updateError } = await supabaseAdmin
          .from('characters')
          .update({ is_main: false })
          .eq('user_id', currentCharacter.user_id)
          .eq('is_main', true)
          .neq('id', characterId)

        if (updateError) {
          console.error('Error updating existing main character:', updateError)
          throw createError({
            statusCode: 500,
            statusMessage: '기존 메인 캐릭터 업데이트 중 오류가 발생했습니다.'
          })
        }
      }
    }

    const { data: character, error } = await supabaseAdmin
      .from('characters')
      .update({
        name,
        server_id,
        is_main: is_main || false
      })
      .eq('id', characterId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Character update error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '캐릭터 수정 중 오류가 발생했습니다.'
      })
    }

    return {
      success: true,
      character
    }

  } catch (error) {
    console.error('Character update error:', error)
    throw error
  }
}) 