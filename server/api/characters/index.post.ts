import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { user_id, name, server_id, is_main } = body

    if (!user_id || !name || !server_id) {
      throw createError({
        statusCode: 400,
        statusMessage: '필수 정보를 모두 입력해주세요.'
      })
    }

    // 새 캐릭터를 메인으로 설정하려는 경우, 기존 메인 캐릭터를 서브로 변경
    if (is_main) {
      const { error: updateError } = await supabaseAdmin
        .from('characters')
        .update({ is_main: false })
        .eq('user_id', user_id)
        .eq('is_main', true)

      if (updateError) {
        console.error('Error updating existing main character:', updateError)
        throw createError({
          statusCode: 500,
          statusMessage: '기존 메인 캐릭터 업데이트 중 오류가 발생했습니다.'
        })
      }
    }

    // 새 캐릭터 순서 계산: 해당 사용자 캐릭터의 최대 order + 1
    const { data: maxOrderRow, error: maxOrderError } = await supabaseAdmin
      .from('characters')
      .select('order')
      .eq('user_id', user_id)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (maxOrderError) {
      console.error('Error fetching max order:', maxOrderError)
      throw createError({ statusCode: 500, statusMessage: '캐릭터 순서 계산 중 오류가 발생했습니다.' })
    }

    const nextOrder = (maxOrderRow?.order ?? 0) + 1

    const { data: character, error } = await supabaseAdmin
      .from('characters')
      .insert({
        user_id,
        name,
        server_id,
        is_main: is_main || false,
        order: nextOrder
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('Character creation error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '캐릭터 생성 중 오류가 발생했습니다.'
      })
    }

    return {
      success: true,
      character
    }

  } catch (error) {
    console.error('Character creation error:', error)
    throw error
  }
}) 