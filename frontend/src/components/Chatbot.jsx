import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Chào bạn! Mình là Trợ lý Ảo Grocery. Bạn đang muốn tìm mua món gì hôm nay?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            // Không gửi kèm token để tránh lỗi 401 khi token hết hạn (vì API này đã được mở khóa public)
            const res = await axios.post('http://localhost:8081/api/chatbot/ask', { message: userMsg });
            setTimeout(() => {
                setMessages(prev => [...prev, { 
                    sender: 'bot', 
                    text: res.data.reply, 
                    products: res.data.products 
                }]);
                setIsTyping(false);
            }, 800); // Giả lập độ trễ cho giống người đang gõ chữ
        } catch (error) {
            console.error("Lỗi từ Chatbot API:", error);
            let errMsg = 'Xin lỗi, hệ thống bot đang bận (Mất kết nối)!';
            if (error.response?.status === 401 || error.response?.status === 403) {
                errMsg = 'Bạn cần đăng nhập tài khoản thì mới trò chuyện với mình được nhé!';
            } else if (error.response?.status === 404) {
                errMsg = 'Hệ thống báo lỗi 404: Có vẻ bạn chưa Restart lại Spring Boot nên mình chưa được đánh thức!';
            }
            setMessages(prev => [...prev, { sender: 'bot', text: errMsg }]);
            setIsTyping(false);
        }
    };

    const handleAddToCart = async (productId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Bạn cần đăng nhập để mua hàng!', type: 'warning' } }));
            return;
        }
        try {
            await axios.post('http://localhost:8081/api/cartItems', { productId, quantity: 1 }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.dispatchEvent(new Event('cartUpdated'));
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đã thêm từ Chatbot vào giỏ!', type: 'success' } }));
        } catch (error) {
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Lỗi thêm vào giỏ hàng', type: 'danger' } }));
        }
    };

    return (
        <>
            {/* Nút bật/tắt Chatbot ở góc phải dưới */}
            <button onClick={() => setIsOpen(!isOpen)} className="btn btn-primary rounded-circle shadow-lg position-fixed d-flex align-items-center justify-content-center" style={{ bottom: '30px', right: '30px', width: '60px', height: '60px', zIndex: 1040 }}>
                <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-robot'} fs-3`}></i>
            </button>

            {/* Khung Chat */}
            {isOpen && (
                <div className="card shadow-lg border-0 position-fixed" style={{ bottom: isExpanded ? '20px' : '100px', right: isExpanded ? '20px' : '30px', width: isExpanded ? '600px' : '380px', height: isExpanded ? '85vh' : '550px', maxWidth: 'calc(100vw - 40px)', zIndex: 1040, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                    <div className="card-header bg-primary text-white py-3 fw-bold d-flex align-items-center justify-content-between">
                        <div>
                            <i className="bi bi-robot me-2 fs-5"></i> Trợ lý mua sắm
                        </div>
                        <div>
                            <button onClick={() => setIsExpanded(!isExpanded)} className="btn btn-sm btn-primary border-0" title={isExpanded ? "Thu nhỏ" : "Phóng to"}>
                                <i className={`bi ${isExpanded ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'} fs-5`}></i>
                            </button>
                            <button onClick={() => setIsOpen(false)} className="btn btn-sm btn-primary border-0 ms-1" title="Đóng">
                                <i className="bi bi-x-lg fs-5"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div className="card-body bg-light" style={{ overflowY: 'auto', flex: 1 }}>
                        {messages.map((msg, index) => (
                            <div key={index} className={`d-flex flex-column mb-3 ${msg.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                                <div className={`p-3 rounded-4 shadow-sm ${msg.sender === 'user' ? 'bg-primary text-white rounded-bottom-0 rounded-start-4' : 'bg-white text-dark rounded-bottom-0 rounded-end-4'}`} style={{ maxWidth: '85%' }}>
                                    {msg.text}
                                </div>
                                
                                {/* Nếu Bot trả về danh sách sản phẩm thì hiển thị thành list cuộn ngang */}
                                {msg.products && msg.products.length > 0 && (
                                    <div className="d-flex gap-2 mt-2 pb-2" style={{ maxWidth: '320px', overflowX: 'auto' }}>
                                        {msg.products.map(p => (
                                            <div key={p.id} className="card border-0 shadow-sm flex-shrink-0" style={{ width: '140px', fontSize: '0.85rem' }}>
                                                <img src={p.image || 'https://placehold.co/100'} alt={p.name} className="card-img-top" style={{height: '90px', objectFit: 'cover'}} />
                                                <div className="card-body p-2 text-center">
                                                    <div className="text-truncate fw-bold mb-1" title={p.name}>{p.name}</div>
                                                    <div className="text-danger fw-bold mb-2">{p.price?.toLocaleString()} đ</div>
                                                    <button onClick={() => handleAddToCart(p.id)} className="btn btn-sm btn-outline-primary w-100 py-1" style={{fontSize: '0.8rem'}}>
                                                        + Vào giỏ
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && <div className="text-muted small ps-2 fst-italic">Trợ lý đang trả lời...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="card-footer bg-white border-top-0 p-2">
                        <div className="input-group">
                            <input type="text" className="form-control border-0 bg-light rounded-pill ps-3" placeholder="Nhập món ăn bạn cần tìm..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                            <button className="btn btn-primary rounded-circle ms-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}} onClick={handleSend}>
                                <i className="bi bi-send-fill"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
