import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { 
  Package, Plus, Search, Edit3, Trash2, X, ShieldAlert, 
  CheckCircle2, Loader2, Cpu, Wrench, Home, ToggleLeft, 
  ToggleRight, Filter, AlertTriangle, Save, RefreshCw 
} from 'lucide-react'

export default function AdminProductPIM() {
  const { isAdmin, loading: authLoading } = useAuth()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })

  const initialFormState = {
    id: null,
    name: '',
    sku: '',
    category: 'IT',
    price: '',
    sale_price: '',
    stock_quantity: 10,
    image_url: '',
    description: '',
    is_active: true,
    socket: '',
    tdp: '',
    chuan_ren: '',
    luc_siet: '',
    dai_cm: '',
    rong_cm: '',
    cao_cm: '',
    is_dangerous: false
  }

  const [formData, setFormData] = useState(initialFormState)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false })

      if (filterCategory !== 'ALL') {
        query = query.eq('category', filterCategory)
      }

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery.trim()}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Lỗi nạp dữ liệu sản phẩm:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchProducts()
    }
  }, [isAdmin, filterCategory, searchQuery])

  const handleOpenForm = (product = null) => {
    setStatusMsg({ type: '', text: '' })
    if (product) {
      const attrs = product.dynamic_attributes || {}
      setFormData({
        id: product.id,
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || 'IT',
        price: product.price || '',
        sale_price: product.sale_price || '',
        stock_quantity: product.stock_quantity ?? 0,
        image_url: product.images?.[0] || '',
        description: product.description || '',
        is_active: product.is_active ?? true,
        socket: attrs.socket || '',
        tdp: attrs.tdp || '',
        chuan_ren: attrs.chuan_ren || '',
        luc_siet: attrs.luc_siet || '',
        dai_cm: attrs.dai_cm || '',
        rong_cm: attrs.rong_cm || '',
        cao_cm: attrs.cao_cm || '',
        is_dangerous: attrs.is_dangerous || attrs.dangerous_goods || false
      })
    } else {
      setFormData(initialFormState)
    }
    setIsSlideOverOpen(true)
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatusMsg({ type: '', text: '' })

    try {
      const dynamicAttributes = {
        is_dangerous: formData.is_dangerous,
        ...(formData.category === 'IT' && {
          socket: formData.socket,
          tdp: formData.tdp
        }),
        ...(formData.category === 'CO_KHI' && {
          chuan_ren: formData.chuan_ren,
          luc_siet: formData.luc_siet
        }),
        ...(formData.category === 'GIA_DUNG_NOI_THAT' && {
          dai_cm: Number(formData.dai_cm) || null,
          rong_cm: Number(formData.rong_cm) || null,
          cao_cm: Number(formData.cao_cm) || null
        })
      }

      const payload = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        price: Number(formData.price) || 0,
        sale_price: formData.sale_price ? Number(formData.sale_price) : null,
        stock_quantity: Number(formData.stock_quantity) || 0,
        images: formData.image_url ? [formData.image_url] : [],
        description: formData.description,
        is_active: formData.is_active,
        dynamic_attributes: dynamicAttributes,
        updated_at: new Date().toISOString()
      }

      if (formData.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', formData.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert([payload])
        if (error) throw error
      }

      setStatusMsg({ type: 'success', text: 'Lưu sản phẩm thành công!' })
      setIsSlideOverOpen(false)
      fetchProducts()
    } catch (err) {
      console.error('Lỗi lưu sản phẩm:', err)
      setStatusMsg({ type: 'error', text: err.message || 'Không thể lưu sản phẩm!' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      await supabase.from('products').delete().eq('id', id)
      fetchProducts()
    }
  }

  const handleToggleActive = async (id, currentStatus) => {
    await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id)
    fetchProducts()
  }

  const formatVND = (amt) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl shadow-2xl text-center space-y-4 border border-rose-100">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Truy cập bị từ chối</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Chỉ tài khoản Quản trị viên (role === 'admin') mới được quyền truy cập trang PIM này.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* HEADER TOP BAR */}
      <div className="bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Quản Lý Sản Phẩm Smart PIM</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Cấu hình thông số kỹ thuật động JSONB & Phân loại vận chuyển Logistics</p>
            </div>
          </div>

          <button
            onClick={() => handleOpenForm()}
            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Sản Phẩm Mới</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* LỌC & TÌM KIẾM */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-500" /> Ngành hàng:
            </span>
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 ${
                filterCategory === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterCategory('IT')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 flex items-center gap-1.5 ${
                filterCategory === 'IT' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> IT
            </button>
            <button
              onClick={() => setFilterCategory('CO_KHI')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 flex items-center gap-1.5 ${
                filterCategory === 'CO_KHI' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" /> Cơ khí
            </button>
            <button
              onClick={() => setFilterCategory('GIA_DUNG_NOI_THAT')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 flex items-center gap-1.5 ${
                filterCategory === 'GIA_DUNG_NOI_THAT' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Home className="w-3.5 h-3.5" /> Gia dụng
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* BẢNG SẢN PHẨM */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/70 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-14 text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-bold">Đang tải bảng dữ liệu PIM...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-5">Sản phẩm / SKU</th>
                    <th className="py-4 px-5">Ngành hàng</th>
                    <th className="py-4 px-5">Thuộc tính kỹ thuật PIM</th>
                    <th className="py-4 px-5">Giá bán & Kho</th>
                    <th className="py-4 px-5">Phân loại hàng</th>
                    <th className="py-4 px-5">Trạng thái</th>
                    <th className="py-4 px-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {products.map((prod) => {
                    const attrs = prod.dynamic_attributes || {}
                    const isDangerous = attrs.is_dangerous || attrs.dangerous_goods
                    return (
                      <tr key={prod.id} className="hover:bg-indigo-50/30 transition-colors duration-150">
                        <td className="py-4 px-5 flex items-center gap-3">
                          <img
                            src={prod.images?.[0] || 'https://via.placeholder.com/60'}
                            alt=""
                            className="w-12 h-12 rounded-2xl object-contain border border-slate-200/60 bg-slate-50 p-1 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-800 line-clamp-1 text-xs">{prod.name}</p>
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                              SKU: {prod.sku}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-1 rounded-full text-[10px] ${
                            prod.category === 'IT' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60' :
                            prod.category === 'CO_KHI' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          }`}>
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-[11px] text-slate-600 space-y-0.5">
                            {prod.category === 'IT' && (
                              <>
                                <p>Socket: <strong className="text-indigo-600 font-bold">{attrs.socket || 'N/A'}</strong></p>
                                <p>TDP: <strong>{attrs.tdp || 'N/A'}</strong></p>
                              </>
                            )}
                            {prod.category === 'CO_KHI' && (
                              <>
                                <p>Ren: <strong className="text-amber-600 font-bold">{attrs.chuan_ren || 'N/A'}</strong></p>
                                <p>Lực siết: <strong>{attrs.luc_siet || 'N/A'}</strong></p>
                              </>
                            )}
                            {prod.category === 'GIA_DUNG_NOI_THAT' && (
                              <p>Kích thước: <strong>{attrs.dai_cm && attrs.rong_cm && attrs.cao_cm ? `${attrs.dai_cm}x${attrs.rong_cm}x${attrs.cao_cm} cm` : 'N/A'}</strong></p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <p className="font-black text-indigo-600 text-xs">{formatVND(prod.sale_price || prod.price)}</p>
                          <p className="text-[10px] text-slate-400">Tồn: <strong className="text-slate-700">{prod.stock_quantity}</strong></p>
                        </td>
                        <td className="py-4 px-5">
                          {isDangerous ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 font-bold rounded-lg text-[10px] animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-500" /> Pin / Hóa chất (DG)
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Thường</span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <button
                            onClick={() => handleToggleActive(prod.id, prod.is_active)}
                            className={`flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-[10px] border transition-all ${
                              prod.is_active ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {prod.is_active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                            {prod.is_active ? 'Bật' : 'Tắt'}
                          </button>
                        </td>
                        <td className="py-4 px-5 text-right space-x-1">
                          <button
                            onClick={() => handleOpenForm(prod)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">Không tìm thấy dữ liệu sản phẩm.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SLIDE-OVER DRAWER THÊM/SỬA SẢN PHẨM */}
      {isSlideOverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <h2 className="text-base font-black text-slate-800">
                  {formData.id ? 'Chỉnh Sửa Sản Phẩm PIM' : 'Thêm Sản Phẩm Smart PIM Mới'}
                </h2>
              </div>
              <button
                onClick={() => setIsSlideOverOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="pim-form" onSubmit={handleSaveProduct} className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
              
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">1. Thông tin sản phẩm chung</h3>
                
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bộ vi xử lý Intel Core i7-14700K..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mã SKU *</label>
                    <input
                      type="text"
                      required
                      placeholder="IT-CPU-14700K"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none font-mono font-bold text-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ngành hàng *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none bg-white font-bold text-indigo-600"
                    >
                      <option value="IT">Công nghệ IT</option>
                      <option value="CO_KHI">Dụng cụ Cơ khí</option>
                      <option value="GIA_DUNG_NOI_THAT">Gia dụng & Nội thất</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Giá gốc (VND) *</label>
                    <input
                      type="number"
                      required
                      placeholder="10500000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Giá khuyến mãi</label>
                    <input
                      type="number"
                      placeholder="9990000"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tồn kho</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đường dẫn Hình ảnh (URL)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px] flex items-center justify-between">
                  <span>2. Thuộc tính động PIM ({formData.category})</span>
                  <span className="text-indigo-600 font-bold">Tự động điều chỉnh theo Ngành</span>
                </h3>

                {formData.category === 'IT' && (
                  <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-indigo-900 mb-1">Socket CPU</label>
                        <input
                          type="text"
                          placeholder="LGA1700 / AM5"
                          value={formData.socket}
                          onChange={(e) => setFormData({ ...formData, socket: e.target.value })}
                          className="w-full px-3 py-2 border border-indigo-200/80 rounded-xl outline-none bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-indigo-900 mb-1">Công suất TDP</label>
                        <input
                          type="text"
                          placeholder="125W / 65W"
                          value={formData.tdp}
                          onChange={(e) => setFormData({ ...formData, tdp: e.target.value })}
                          className="w-full px-3 py-2 border border-indigo-200/80 rounded-xl outline-none bg-white font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.category === 'CO_KHI' && (
                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-amber-900 mb-1">Chuẩn ren</label>
                        <input
                          type="text"
                          placeholder="M8 / M10 / Tiêu chuẩn"
                          value={formData.chuan_ren}
                          onChange={(e) => setFormData({ ...formData, chuan_ren: e.target.value })}
                          className="w-full px-3 py-2 border border-amber-200/80 rounded-xl outline-none bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-amber-900 mb-1">Lực siết đề xuất (Nm)</label>
                        <input
                          type="text"
                          placeholder="24-27 Nm"
                          value={formData.luc_siet}
                          onChange={(e) => setFormData({ ...formData, luc_siet: e.target.value })}
                          className="w-full px-3 py-2 border border-amber-200/80 rounded-xl outline-none bg-white font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.category === 'GIA_DUNG_NOI_THAT' && (
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                    <label className="block font-bold text-emerald-900 mb-1">Kích thước 3 chiều (Dài x Rộng x Cao cm)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Dài (cm)"
                        value={formData.dai_cm}
                        onChange={(e) => setFormData({ ...formData, dai_cm: e.target.value })}
                        className="px-3 py-2 border border-emerald-200/80 rounded-xl outline-none bg-white font-medium"
                      />
                      <input
                        type="number"
                        placeholder="Rộng (cm)"
                        value={formData.rong_cm}
                        onChange={(e) => setFormData({ ...formData, rong_cm: e.target.value })}
                        className="px-3 py-2 border border-emerald-200/80 rounded-xl outline-none bg-white font-medium"
                      />
                      <input
                        type="number"
                        placeholder="Cao (cm)"
                        value={formData.cao_cm}
                        onChange={(e) => setFormData({ ...formData, cao_cm: e.target.value })}
                        className="px-3 py-2 border border-emerald-200/80 rounded-xl outline-none bg-white font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h3 className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">3. Phân loại Logistics Hàng hóa</h3>
                <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" /> Đánh dấu Hàng nguy hiểm (Dangerous Goods)
                    </span>
                    <p className="text-[11px] text-rose-700">Chứa Pin Lithium, Hóa chất dễ cháy nổ (Yêu cầu tuyến giao nhận riêng)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_dangerous: !formData.is_dangerous })}
                    className="text-rose-600 focus:outline-none"
                  >
                    {formData.is_dangerous ? <ToggleRight className="w-8 h-8 text-rose-600" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="block font-bold text-slate-700 mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={3}
                  placeholder="Nhập mô tả chi tiết sản phẩm..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </form>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSlideOverOpen(false)}
                className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Hủy
              </button>
              <button
                form="pim-form"
                type="submit"
                disabled={saving}
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{formData.id ? 'Cập Nhật Sản Phẩm' : 'Lưu Sản Phẩm Mới'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}