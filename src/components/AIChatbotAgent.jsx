import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Sparkles, Cpu, Wrench, Home, User, Loader2 } from 'lucide-react'

export default function AIChatbotAgent() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputMsg, setInputMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Xin chào! Tôi là Trợ lý AI KinB PIM. Bạn cần hỗ trợ tư vấn thông số kỹ thuật IT, tra cứu lực siết Cơ khí hay kích thước Gia dụng?'
    }
  ])

  const chatEndRef = useRef(null)

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // DANH SÁCH GỢI Ý CÂU HỎI MẪU NĂNG ĐỘNG
  const samplePrompts = [
    { label: 'Tư vấn CPU & Socket', icon: Cpu, query: 'Tư vấn CPU LGA1700 có tương thích tản nhiệt TDP 125W không?' },
    { label: 'Tra cứu Lực siết Cơ khí', icon: Wrench, query: 'Bu-lông M8 cấp bền 8.8 yêu cầu lực siết bao nhiêu Nm?' },
    { label: 'Kích thước Bàn Ergonomic', icon: Home, query: 'Bàn làm việc Ergonomic kích thước Dài x Rộng x Cao chuẩn là bao nhiêu?' }
  ]

  // Giả lập xử lý trả lời RAG AI dựa trên từ khóa
  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputMsg
    if (!query.trim()) return

    const userMsgObj = { id: Date.now(), sender: 'user', text: query }
    setMessages((prev) => [...prev, userMsgObj])
    if (!textToSend) setInputMsg('')
    setLoading(true)

    // Giả lập AI suy nghĩ và tra cứu Knowledge Base
    setTimeout(() => {
      let responseText = 'Rất tiếc, tôi chưa tìm thấy thông số chính xác cho yêu cầu này. Bạn có thể để lại thông tin để kỹ thuật viên KinB liên hệ trực tiếp!'
      const lowerQ = query.toLowerCase()

      if (lowerQ.includes('lga1700') || lowerQ.includes('cpu') || lowerQ.includes('tdp')) {
        responseText = '👉 **Tư vấn IT:** CPU Socket LGA1700 (như i7-14700K) có mức TDP cơ bản 125W (Peak 253W). Đề xuất sử dụng Tản nhiệt nước AIO 240mm hoặc 360mm và nguồn tối thiểu 750W để đảm bảo hiệu năng ổn định.'
      } else if (lowerQ.includes('bu-lông') || lowerQ.includes('lực siết') || lowerQ.includes('m8') || lowerQ.includes('cơ khí')) {
        responseText = '🔧 **Tra cứu Cơ khí:** Đối với bu-lông M8 chuẩn cấp bền 8.8, lực siết tiêu chuẩn khuyên dùng là **24 - 27 Nm**. Nếu cấp bền 10.9, lực siết khuyến nghị là **35 - 38 Nm**.'
      } else if (lowerQ.includes('bàn') || lowerQ.includes('ergonomic') || lowerQ.includes('gia dụng') || lowerQ.includes('kích thước')) {
        responseText = '🏠 **Thông số Gia dụng:** Bàn Ergonomic chuẩn công sở có kích thước thông dụng: Dài 120 - 140 cm, Rộng 60 - 70 cm, và Chiều cao nâng hạ linh hoạt từ 72 đến 120 cm.'
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: responseText }])
      setLoading(false)
    }, 800)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* 1. NÚT NỔI BẤM MỞ CHATBOT */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 group transition duration-300 animate-bounce"
        >
          <Bot className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold">
            Trợ lý AI KinB PIM
          </span>
        </button>
      )}

      {/* 2. CỬA SỔ CHATBOT */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* HEADER CHATBOT */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-500/30 flex items-center justify-center border border-blue-400">
                <Bot className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-xs font-bold flex items-center gap-1">
                  KinB AI Assistant <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                </h3>
                <p className="text-[10px] text-blue-200">Trợ lý RAG Tra cứu Kỹ thuật Đa ngành</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* KHU VỰC NỘI DUNG NHÁNH TIN NHẮN */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start items-center text-gray-400 text-xs italic">
                <Bot className="w-4 h-4 animate-spin" />
                <span>AI đang tra cứu thông số kỹ thuật...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* CHIP GỢI Ý CÂU HỎI MẪU */}
          <div className="p-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto">
            {samplePrompts.map((p, idx) => {
              const IconComp = p.icon
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.query)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded-full text-[10px] font-semibold shrink-0 flex items-center gap-1 transition"
                >
                  <IconComp className="w-3 h-3" />
                  <span>{p.label}</span>
                </button>
              )
            })}
          </div>

          {/* Ô NHẬP TIN NHẮN */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi kỹ thuật..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !inputMsg.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}