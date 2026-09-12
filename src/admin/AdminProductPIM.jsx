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
          Chỉ tài khoản Quản trị viên (role === 'admin') mới được quyền truy cập trang PIM này.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">Quản Lý Sản Phẩm Smart PIM</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">Cấu hình thông số kỹ thuật động JSONB & Phân loại vận chuyển Logistics</p>
          </div>

          <button
            onClick={() => handleOpenForm()}
            className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Sản Phẩm Mới</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Lọc theo:
            </span>
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                filterCategory === 'ALL' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả ngành
            </button>
            <button
              onClick={() => setFilterCategory('IT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
                filterCategory === 'IT' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-500" /> IT
            </button>
            <button
              onClick={() => setFilterCategory('CO_KHI')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
                filterCategory === 'CO_KHI' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-500" /> Cơ khí
            </button>
            <button
              onClick={() => setFilterCategory('GIA_DUNG_NOI_THAT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
                filterCategory === 'GIA_DUNG_NOI_THAT' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-emerald-500" /> Gia dụng
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-12 text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-semibold">Đang tải bảng dữ liệu PIM...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                    <th className="p-4">Sản phẩm / SKU</th>
                    <th className="p-4">Ngành hàng</th>
                    <th className="p-4">Thuộc tính kỹ thuật PIM</th>
                    <th className="p-4">Giá bán & Kho</th>
                    <th className="p-4">Loại hàng</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((prod) => {
                    const attrs = prod.dynamic_attributes || {}
                    const isDangerous = attrs.is_dangerous || attrs.dangerous_goods
                    return (
                      <tr key={prod.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={prod.images?.[0] || 'https://via.placeholder.com/60'}
                            alt=""
                            className="w-12 h-12 rounded-xl object-contain border border-gray-100 bg-gray-50"
                          />
                          <div>
                            <p className="font-bold text-gray-800 line-clamp-1">{prod.name}</p>
                            <span className="text-[10px] font-mono font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              SKU: {prod.sku}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-[10px] ${
                            prod.category === 'IT' ? 'bg-blue-50 text-blue-700' :
                            prod.category === 'CO_KHI' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {prod.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-[11px] text-gray-600 space-y-0.5">
                            {prod.category === 'IT' && (
                              <>
                                <p>Socket: <strong className="text-blue-600">{attrs.socket || 'N/A'}</strong></p>
                                <p>TDP: <strong>{attrs.tdp || 'N/A'}</strong></p>
                              </>
                            )}
                            {prod.category === 'CO_KHI' && (
                              <>
                                <p>Ren: <strong className="text-amber-600">{attrs.chuan_ren || 'N/A'}</strong></p>
                                <p>Lực siết: <strong>{attrs.luc_siet || 'N/A'}</strong></p>
                              </>
                            )}
                            {prod.category === 'GIA_DUNG_NOI_THAT' && (
                              <p>Kích thước: <strong>{attrs.dai_cm && attrs.rong_cm && attrs.cao_cm ? `${attrs.dai_cm}x${attrs.rong_cm}x${attrs.cao_cm} cm` : 'N/A'}</strong></p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-blue-600">{formatVND(prod.sale_price || prod.price)}</p>
                          <p className="text-[10px] text-gray-400">Tồn: <strong className="text-gray-700">{prod.stock_quantity}</strong></p>
                        </td>
                        <td className="p-4">
                          {isDangerous ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-md text-[10px] animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Pin / Hóa chất (DG)
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px]">Thường</span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleActive(prod.id, prod.is_active)}
                            className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                              prod.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {prod.is_active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                            {prod.is_active ? 'Bật' : 'Tắt'}
                          </button>
                        </td>
                        <td className="p-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenForm(prod)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">Không tìm thấy dữ liệu sản phẩm.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isSlideOverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-gray-800">
                  {formData.id ? 'Chỉnh Sửa Sản Phẩm PIM' : 'Thêm Sản Phẩm Smart PIM Mới'}
                </h2>
              </div>
              <button
                onClick={() => setIsSlideOverOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="pim-form" onSubmit={handleSaveProduct} className="flex-1 p-6 overflow-y-auto space-y-5 text-xs">
              
              <div className="space-y-4">
                <h3 className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">1. Thông tin sản phẩm chung</h3>
                
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bộ vi xử lý Intel Core i7-14700K..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Mã SKU *</label>
                    <input
                      type="text"
                      required
                      placeholder="IT-CPU-14700K"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Ngành hàng *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none bg-white font-bold text-blue-600"
                    >
                      <option value="IT">Công nghệ IT</option>
                      <option value="CO_KHI">Dụng cụ Cơ khí</option>
                      <option value="GIA_DUNG_NOI_THAT">Gia dụng & Nội thất</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Giá gốc (VND) *</label>
                    <input
                      type="number"
                      required
                      placeholder="10500000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Giá khuyến mãi</label>
                    <input
                      type="number"
                      placeholder="9990000"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Số lượng tồn kho</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Đường dẫn Hình ảnh (URL)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <h3 className="font-bold text-gray-400 uppercase tracking-wider text-[10px] flex items-center justify-between">
                  <span>2. Thuộc tính động PIM ({formData.category})</span>
                  <span className="text-blue-600 font-normal">Tự động điều chỉnh theo Ngành</span>
                </h3>

                {formData.category === 'IT' && (
                  <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-blue-900 mb-1">Socket CPU</label>
                        <input
                          type="text"
                          placeholder="LGA1700 / AM5"
                          value={formData.socket}
                          onChange={(e) => setFormData({ ...formData, socket: e.target.value })}
                          className="w-full px-3 py-2 border border-blue-200 rounded-xl outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-blue-900 mb-1">Công suất TDP</label>
                        <input
                          type="text"
                          placeholder="125W / 65W"
                          value={formData.tdp}
                          onChange={(e) => setFormData({ ...formData, tdp: e.target.value })}
                          className="w-full px-3 py-2 border border-blue-200 rounded-xl outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.category === 'CO_KHI' && (
                  <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-100 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-amber-900 mb-1">Chuẩn ren</label>
                        <input
                          type="text"
                          placeholder="M8 / M10 / Tiêu chuẩn"
                          value={formData.chuan_ren}
                          onChange={(e) => setFormData({ ...formData, chuan_ren: e.target.value })}
                          className="w-full px-3 py-2 border border-amber-200 rounded-xl outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-amber-900 mb-1">Lực siết đề xuất (Nm)</label>
                        <input
                          type="text"
                          placeholder="24-27 Nm"
                          value={formData.luc_siet}
                          onChange={(e) => setFormData({ ...formData, luc_siet: e.target.value })}
                          className="w-full px-3 py-2 border border-amber-200 rounded-xl outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.category === 'GIA_DUNG_NOI_THAT' && (
                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-3">
                    <label className="block font-bold text-emerald-900 mb-1">Kích thước 3 chiều (Dài x Rộng x Cao cm)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Dài (cm)"
                        value={formData.dai_cm}
                        onChange={(e) => setFormData({ ...formData, dai_cm: e.target.value })}
                        className="px-3 py-2 border border-emerald-200 rounded-xl outline-none bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Rộng (cm)"
                        value={formData.rong_cm}
                        onChange={(e) => setFormData({ ...formData, rong_cm: e.target.value })}
                        className="px-3 py-2 border border-emerald-200 rounded-xl outline-none bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Cao (cm)"
                        value={formData.cao_cm}
                        onChange={(e) => setFormData({ ...formData, cao_cm: e.target.value })}
                        className="px-3 py-2 border border-emerald-200 rounded-xl outline-none bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                <h3 className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">3. Phân loại Logistics Hàng hóa</h3>
                <div className="p-4 bg-red-50/70 rounded-2xl border border-red-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-red-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" /> Đánh dấu Hàng nguy hiểm (Dangerous Goods)
                    </span>
                    <p className="text-[11px] text-red-700">Chứa Pin Lithium, Hóa chất dễ cháy nổ (Yêu cầu tuyến giao nhận riêng)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_dangerous: !formData.is_dangerous })}
                    className="text-red-600 focus:outline-none"
                  >
                    {formData.is_dangerous ? <ToggleRight className="w-8 h-8 text-red-600" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="block font-bold text-gray-700 mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={3}
                  placeholder="Nhập mô tả chi tiết sản phẩm..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>
            </form>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSlideOverOpen(false)}
                className="py-2.5 px-4 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                form="pim-form"
                type="submit"
                disabled={saving}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
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