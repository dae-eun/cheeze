// 타입 경고 제거를 위해 any 선언. Nuxt 런타임에서 전역 제공됨
const defineNuxtPlugin: any = (fn: any) => fn
export default defineNuxtPlugin(() => {
  try {
    const saved = localStorage.getItem('darkMode')
    // 저장값이 없으면 기본값은 다크모드로 적용
    const shouldDark = saved === 'true' || (saved === null && true)
    const el = document.documentElement
    if (shouldDark) el.classList.add('dark')
    else el.classList.remove('dark')
  } catch {
    /* noop */
  }
})


