import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function DynamicTheme() {
  const [theme, setTheme] = useState({
    primary_color: '#1E40AF',
    secondary_color: '#F59E0B',
    font_family: 'Inter, sans-serif',
    active_effect: 'none',
    custom_css: ''
  })

  useEffect(() => {
    // 1. Lấy cấu hình theme đang kích hoạt từ Supabase
    const fetchActiveTheme = async () => {
      const { data, error } = await supabase
        .from('site_themes')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (!error && data) {
        setTheme(data)
      }
    }

    fetchActiveTheme()

    // 2. Lắng nghe thay đổi Realtime khi Admin sửa Giao diện
    const channel = supabase
      .channel('site_themes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_themes' }, () => {
        fetchActiveTheme()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Áp dụng CSS Variables và Font chữ vào hệ thống document root
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary-color', theme.primary_color || '#1E40AF')
    root.style.setProperty('--secondary-color', theme.secondary_color || '#F59E0B')
    if (theme.font_family) {
      document.body.style.fontFamily = theme.font_family
    }
  }, [theme])

  return (
    <>
      {/* Inject Custom CSS do Admin viết nếu có */}
      {theme.custom_css && <style>{theme.custom_css}</style>}

      {/* Hiệu ứng Tuyết rơi (Snow) */}
      {theme.active_effect === 'snow' && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-80 animate-bounce"
              style={{
                top: `${Math.random() * -10}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 6 + 4}px`,
                height: `${Math.random() * 6 + 4}px`,
                animationDuration: `${Math.random() * 5 + 3}s`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Hiệu ứng Hạt sáng (Stars) */}
      {theme.active_effect === 'stars' && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-amber-300 rounded-full blur-[1px] animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                animationDuration: `${Math.random() * 3 + 1.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Hiệu ứng Pháo hoa (Fireworks) */}
      {theme.active_effect === 'fireworks' && (
        <div className="fixed top-5 left-0 right-0 pointer-events-none z-50 flex justify-around">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" />
          <div className="w-4 h-4 rounded-full bg-yellow-400 animate-ping opacity-75 duration-700" />
          <div className="w-3 h-3 rounded-full bg-blue-400 animate-ping opacity-75 duration-500" />
        </div>
      )}
    </>
  )
}