import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { signIn, signUp } = useAuth()

  if (!isOpen) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setErrorMsg('')
    setSuccessMsg('')
  }

  const switchMode = (mode) => {
    setIsLogin(mode)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) throw error
        onClose()
      } else {
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
        setSuccessMsg('Đăng ký thành công! Đang chuyển sang màn hình đăng nhập...')
        setTimeout(() => {
          setIsLogin(true)
          setSuccessMsg('')
        }, 1800)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Có lỗi xảy ra, vui lòng thử lại!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Nút Đóng Modal */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Chuyển Tab Đăng nhập / Đăng ký */}
        <div className="flex border-b border-gray-100 bg-gray-50/70">
          <button
            type="button"
            onClick={() => switchMode(true)}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => switchMode(false)}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              !isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {/* Nội dung Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold text-gray-800">
              {isLogin ? 'Chào mừng bạn trở lại' : 'Tạo tài khoản mới'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {isLogin ? 'Nhập thông tin để truy cập cửa hàng' : 'Trải nghiệm mua sắm tuyệt vời cùng chúng tôi'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs text-green-600 bg-green-50 rounded-lg border border-green-200">
              {successMsg}
            </div>
          )}

          {/* Ô Họ tên (Chỉ hiện khi Đăng ký) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Họ và tên</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Ô Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Ô Mật khẩu */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nút bấm Đăng nhập / Đăng ký */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
    </div>
  )
}