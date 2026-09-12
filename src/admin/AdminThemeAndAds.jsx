import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { 
  Palette, Megaphone, Calendar, ShieldAlert, Save, Plus, 
  Trash2, Edit3, Eye, Sparkles, CheckCircle2, Loader2, 
  ToggleLeft, ToggleRight, ExternalLink, RefreshCw 
} from 'lucide-react'

export default function AdminThemeAndAds() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('THEME') // 'THEME' | 'ADS' | 'EVENTS'
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })

  // ==============================================================================
  // 1. STATE & XỬ LÝ TAB 1: THIẾT KẾ GIAO DIỆN (THEME STUDIO)
  // ==============================================================================
  const [themeId, setThemeId] = useState(null)
  const [primaryColor, setPrimaryColor] = useState('#1E40AF')
  const [secondaryColor, setSecondaryColor] = useState('#F59E0B')
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif')
  const [activeEffect, setActiveEffect] = useState('none')
  const [customCss, setCustomCss] = useState('')
  const [themeLoading, setThemeLoading] = useState(false)

  const fetchThemeData = async () => {
    const { data, error } = await supabase
      .from('site_themes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      setThemeId(data.id)
      setPrimaryColor(data.primary_color || '#1E40AF')
      setSecondaryColor(data.secondary_color || '#F59E0B')
      setFontFamily(data.font_family || 'Inter, sans-serif')
      setActiveEffect(data.active_effect || 'none')
      setCustomCss(data.custom_css || '')
    }
  }

  const handleSaveTheme = async (e) => {
    e.preventDefault()
    setThemeLoading(true)
    setStatusMsg({ type: '', text: '' })

    try {
      const payload = {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        font_family: fontFamily,
        active_effect: activeEffect,
        custom_css: customCss,
        is_active: true,
        updated_at: new Date().toISOString()
      }

      let res
      if (themeId) {
        res = await supabase.from('site_themes').update(payload).eq('id', themeId)
      } else {
        res = await supabase.from('site_themes').insert([payload])
      }

      if (res.error) throw res.error
      setStatusMsg({ type: 'success', text: 'Cập nhật giao diện thành công! Hệ thống sẽ tự động áp dụng.' })
      fetchThemeData()
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Lỗi khi lưu giao diện' })
    } finally {
      setThemeLoading(false)
    }
  }

  // ==============================================================================
  // 2. STATE & XỬ LÝ TAB 2: QUẢN LÝ QUẢNG CÁO (AD MANAGER)
  // ==============================================================================
  const [adsList, setAdsList] = useState([])
  const [adForm, setAdForm] = useState({ id: null, title: '', image_url: '', link_url: '', position: 'top_banner', sort_order: 0, is_active: true })
  const [isEditingAd, setIsEditingAd] = useState(false)
  const [adLoading, setAdLoading] = useState(false)

  const fetchAds = async () => {
    const { data, error } = await supabase.from('advertisements').select('*').order('created_at', { ascending: false })
    if (!error && data) setAdsList(data)
  }

  const handleSaveAd = async (e) => {
    e.preventDefault()
    setAdLoading(true)
    try {
      if (adForm.id) {
        await supabase.from('advertisements').update(adForm).eq('id', adForm.id)
      } else {
        const { id, ...newAd } = adForm
        await supabase.from('advertisements').insert([newAd])
      }
      setAdForm({ id: null, title: '', image_url: '', link_url: '', position: 'top_banner', sort_order: 0, is_active: true })
      setIsEditingAd(false)
      fetchAds()
    } catch (err) {
      alert(err.message)
    } finally {
      setAdLoading(false)
    }
  }

  const handleToggleAdStatus = async (id, currentStatus) => {
    await supabase.from('advertisements').update({ is_active: !currentStatus }).eq('id', id)
    fetchAds()
  }

  const handleDeleteAd = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa quảng cáo này?')) {
      await supabase.from('advertisements').delete().eq('id', id)
      fetchAds()
    }
  }

  // ==============================================================================
  // 3. STATE & XỬ LÝ TAB 3: QUẢN LÝ SỰ KIỆN & KHUYẾN MÃI (EVENT MANAGER)
  // ==============================================================================
  const [eventsList, setEventsList] = useState([])
  const [eventForm, setEventForm] = useState({ id: null, event_name: '', banner_url: '', start_date: '', end_date: '', discount_percent: 10, is_active: true })
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [eventLoading, setEventLoading] = useState(false)

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('promotions_events').select('*').order('created_at', { ascending: false })
    if (!error && data) setEventsList(data)
  }

  const handleSaveEvent = async (e) => {
    e.preventDefault()
    setEventLoading(true)
    try {
      if (eventForm.id) {
        await supabase.from('promotions_events').update(eventForm).eq('id', eventForm.id)
      } else {
        const { id, ...newEvent } = eventForm
        await supabase.from('promotions_events').insert([newEvent])
      }
      setEventForm({ id: null, event_name: '', banner_url: '', start_date: '', end_date: '', discount_percent: 10, is_active: true })
      setIsEditingEvent(false)
      fetchEvents()
    } catch (err) {
      alert(err.message)
    } finally {
      setEventLoading(false)
    }
  }

  const handleToggleEventStatus = async (id, currentStatus) => {
    await supabase.from('promotions_events').update({ is_active: !currentStatus }).eq('id', id)
    fetchEvents()
  }

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
      await supabase.from('promotions_events').delete().eq('id', id)
      fetchEvents()
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchThemeData()
      fetchAds()
      fetchEvents()
    }
  }, [isAdmin])

  // KIỂM TRA BẢO MẬT PHÂN QUYỀN ROLE === 'ADMIN'
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl shadow-xl text-center space-y-4 border border-red-100">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Truy cập bị từ chối</h2>
        <p className="text-xs text-gray-500">
          Tài khoản của bạn không có quyền Admin (role !== 'admin'). Vui lòng đăng nhập tài khoản Quản trị viên để tiếp tục.
        </p>
        <a href="/" className="inline-block py-2.5 px-5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition">
          Trở về Trang chủ
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* BAR TIÊU ĐỀ ADMIN PANEL */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full uppercase border border-blue-400/30">
              Admin System Panel
            </span>
            <h1 className="text-2xl font-black mt-1">Quản Lý Giao Diện & Quảng Cáo</h1>
          </div>

          {/* MENUTAB NÚT BẤM DẠNG CANVAS/SHOPIFY */}
          <div className="flex bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveTab('THEME')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'THEME' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" /> Studio Giao Diện
            </button>
            <button
              onClick={() => setActiveTab('ADS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'ADS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Megaphone className="w-4 h-4" /> Banner Quảng Cáo
            </button>
            <button
              onClick={() => setActiveTab('EVENTS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'EVENTS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" /> Sự Kiện & Flash Sale
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* THÔNG BÁO TRẠNG THÁI (SUCCESS/ERROR) */}
        {statusMsg.text && (
          <div className={`mb-6 p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <CheckCircle2 className="w-4 h-4" /> {statusMsg.text}
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 1: THIẾT KẾ GIAO DIỆN (THEME STUDIO) */}
        {/* ============================================================================== */}
        {activeTab === 'THEME' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* CẤU HÌNH BÊN TRÁI (7 COLUMNS) */}
            <form onSubmit={handleSaveTheme} className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-base font-bold text-gray-800 border-b pb-3 flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" /> Tùy chỉnh Màu sắc & Phong cách
              </h2>

              {/* BỘ CHỌN MÀU (COLOR PICKERS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                  <label className="block text-xs font-bold text-gray-700">Màu chủ đạo (Primary Color)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs font-mono font-bold border rounded-lg uppercase"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                  <label className="block text-xs font-bold text-gray-700">Màu phụ nhấn (Secondary Color)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs font-mono font-bold border rounded-lg uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* CHỌN FONT CHỮ & HIỆU ỨNG MÀN HÌNH */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Font chữ hệ thống</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-xl outline-none bg-white font-medium"
                  >
                    <option value="Inter, sans-serif">Inter (Hiện đại & Tinh gọn)</option>
                    <option value="Roboto, sans-serif">Roboto (Chuẩn chuẩn hóa)</option>
                    <option value="Montserrat, sans-serif">Montserrat (Thương mại nổi bật)</option>
                    <option value="Merriweather, serif">Merriweather (Cổ điển & Sang trọng)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hiệu ứng màn hình động</label>
                  <select
                    value={activeEffect}
                    onChange={(e) => setActiveEffect(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-xl outline-none bg-white font-medium"
                  >
                    <option value="none">Tắt hiệu ứng (None)</option>
                    <option value="snow">❄️ Tuyết rơi (Snow Fall)</option>
                    <option value="stars">✨ Hạt sáng lung linh (Magic Stars)</option>
                    <option value="fireworks">🎆 Pháo hoa sự kiện (Fireworks)</option>
                  </select>
                </div>
              </div>

              {/* Ô NHẬP CUSTOM CSS */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Custom CSS Tùy biến</label>
                <textarea
                  rows={4}
                  placeholder=".header { background: gold; }"
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  className="w-full p-3 text-xs font-mono bg-slate-900 text-emerald-400 rounded-2xl outline-none border border-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={themeLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-lg flex items-center justify-center gap-2 transition"
              >
                {themeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Lưu & Áp Dụng Giao Diện Ngay</span>
              </button>
            </form>

            {/* XEM TRƯỚC (PREVIEW) BÊN PHẢI (5 COLUMNS) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 sticky top-24">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-600" /> Xem trước giao diện thực tế (Live Preview)
                </h3>

                {/* KHUNG XEM TRƯỚC DEMO CARD */}
                <div 
                  className="p-6 rounded-2xl shadow-inner border transition-all duration-300 space-y-4"
                  style={{ fontFamily: fontFamily, backgroundColor: '#F9FAFB' }}
                >
                  <div 
                    className="p-3 rounded-xl text-white text-xs font-bold flex items-center justify-between"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>KinB Store Header</span>
                    <span 
                      className="px-2 py-0.5 rounded text-[10px]"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      BUTTON DEMO
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border space-y-2">
                    <h4 className="text-sm font-bold text-gray-800">Bộ vi xử lý Intel Core i7</h4>
                    <p className="text-xs text-gray-500">Mẫu thuộc tính kỹ thuật Smart PIM</p>
                    <button 
                      className="w-full py-2 rounded-lg text-white font-bold text-xs shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Thêm vào giỏ hàng
                    </button>
                  </div>

                  <div className="text-[11px] text-gray-500 text-center">
                    Hiệu ứng màn hình chọn: <strong className="text-blue-600 uppercase">{activeEffect}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 2: QUẢN LÝ QUẢNG CÁO (AD MANAGER) */}
        {/* ============================================================================== */}
        {activeTab === 'ADS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-600" /> Danh sách Quảng cáo & Banner ({adsList.length})
              </h2>
              <button
                onClick={() => {
                  setAdForm({ id: null, title: '', image_url: '', link_url: '', position: 'top_banner', sort_order: 0, is_active: true })
                  setIsEditingAd(true)
                }}
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> Thêm Banner Mới
              </button>
            </div>

            {/* FORM TẠO/SỬA QUẢNG CÁO */}
            {isEditingAd && (
              <form onSubmit={handleSaveAd} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2">
                  {adForm.id ? 'Chỉnh sửa Banner' : 'Tạo Banner Quảng cáo mới'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tiêu đề Banner</label>
                    <input
                      type="text"
                      required
                      placeholder="KM Giảm 20% Đồ Cơ khí..."
                      value={adForm.title}
                      onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Vị trí hiển thị</label>
                    <select
                      value={adForm.position}
                      onChange={(e) => setAdForm({ ...adForm, position: e.target.value })}
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none bg-white"
                    >
                      <option value="top_banner">Top Banner (Chạy chữ TopBar)</option>
                      <option value="popup">Pop-up Giữa màn hình</option>
                      <option value="sidebar">Banner Hông (Sidebar)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hình ảnh URL</label>
                    <input
                      type="text"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={adForm.image_url}
                      onChange={(e) => setAdForm({ ...adForm, image_url: e.target.value })}
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Đường dẫn khi bấm (Link URL)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={adForm.link_url}
                      onChange={(e) => setAdForm({ ...adForm, link_url: e.target.value })}
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingAd(false)}
                    className="py-2 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={adLoading}
                    className="py-2 px-5 bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    {adLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Lưu Quảng Cáo</span>
                  </button>
                </div>
              </form>
            )}

            {/* BẢNG DỮ LIỆU BANNER */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                      <th className="p-4">Hình ảnh / Tiêu đề</th>
                      <th className="p-4">Vị trí</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {adsList.map((ad) => (
                      <tr key={ad.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 flex items-center gap-3">
                          <img src={ad.image_url || 'https://via.placeholder.com/60'} alt="" className="w-12 h-12 rounded-xl object-cover border" />
                          <div>
                            <p className="font-bold text-gray-800">{ad.title}</p>
                            <a href={ad.link_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline flex items-center gap-1">
                              {ad.link_url || 'Không có link'} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-semibold text-gray-600 uppercase">{ad.position}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleAdStatus(ad.id, ad.is_active)}
                            className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full text-[11px] ${
                              ad.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {ad.is_active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                            {ad.is_active ? 'Đang bật' : 'Đang tắt'}
                          </button>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setAdForm(ad)
                              setIsEditingAd(true)
                            }}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad.id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {adsList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400">Chưa có dữ liệu quảng cáo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 3: QUẢN LÝ SỰ KIỆN & KHUYẾN MÃI (EVENT MANAGER) */}
        {/* ============================================================================== */}
        {activeTab === 'EVENTS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Các Chương Trình Khuyến Mãi & Flash Sale ({eventsList.length})
              </h2>
              <button
                onClick={() => {
                  setEventForm({ id: null, event_name: '', banner_url: '', start_date: '', end_date: '', discount_percent: 10, is_active: true })
                  setIsEditingEvent(true)
                }}
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> Tạo Sự Kiện Mới
              </button>
            </div>

            {/* FORM TẠO/SỬA SỰ KIỆN */}
            {isEditingEvent && (
              <form onSubmit={handleSaveEvent} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2">
                  {eventForm.id ? 'Chỉnh sửa Sự kiện' : 'Tạo Sự kiện Flash Sale Mới'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tên Sự kiện</label>
                    <input
                      type="text"
                      required
                      placeholder="Siêu Đại Nhạc Hội Flash Sale 9/9..."
                      value={eventForm.event_name}
                      onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">% Giảm giá toàn sàn</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={eventForm.discount_percent}
                      onChange={(e) => setEventForm({ ...eventForm, discount_percent: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none font-bold text-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Thời gian Bắt đầu</label>
                    <input
                      type="datetime-local"
                      required
                      value={eventForm.start_date ? new Date(eventForm.start_date).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Thời gian Kết thúc</label>
                    <input
                      type="datetime-local"
                      required
                      value={eventForm.end_date ? new Date(eventForm.end_date).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingEvent(false)}
                    className="py-2 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={eventLoading}
                    className="py-2 px-5 bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    {eventLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Lưu Sự Kiện</span>
                  </button>
                </div>
              </form>
            )}

            {/* BẢNG DỮ LIỆU SỰ KIỆN */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                      <th className="p-4">Tên sự kiện</th>
                      <th className="p-4">% Giảm giá</th>
                      <th className="p-4">Thời gian áp dụng</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {eventsList.map((ev) => (
                      <tr key={ev.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 font-bold text-gray-800">{ev.event_name}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-black rounded-lg">
                            -{ev.discount_percent}%
                          </span>
                        </td>
                        <td className="p-4 text-gray-600">
                          {new Date(ev.start_date).toLocaleDateString('vi-VN')} ➔ {new Date(ev.end_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleEventStatus(ev.id, ev.is_active)}
                            className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full text-[11px] ${
                              ev.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {ev.is_active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                            {ev.is_active ? 'Kích hoạt' : 'Tạm dừng'}
                          </button>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEventForm(ev)
                              setIsEditingEvent(true)
                            }}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {eventsList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400">Chưa có chương trình khuyến mãi nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}