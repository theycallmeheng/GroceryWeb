import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Cart() {
    const [cartItems, setCartItems] = useState([]);
    const [total, setTotal] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/dangnhap');
            return;
        }
        try {
            const res = await axios.get('http://localhost:8081/api/cartItems', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCartItems(res.data);
            calculateTotal(res.data);
        } catch (error) {
            console.error("Lỗi tải giỏ hàng:", error);
        }
    };

    const calculateTotal = (items) => {
        const sum = items.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);
        setTotal(sum);
    };

    const handleUpdateQuantity = async (id, currentQty, amount) => {
        const newQty = currentQty + amount;
        if (newQty < 1) return;
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://localhost:8081/api/cartItems/${id}`, { quantity: newQty }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCart(); // Cập nhật lại list sau khi sửa số lượng
        } catch (error) {
            alert('Lỗi cập nhật số lượng');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xóa sản phẩm này khỏi giỏ hàng?')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:8081/api/cartItems/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCart();
        } catch (error) {
            alert('Lỗi khi xóa sản phẩm');
        }
    };

    return (
        <div className="container-fluid py-5">
            <h2 className="mb-4 fw-bold">Giỏ hàng của bạn</h2>
            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4 bg-light rounded">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-5">
                                    <h5 className="text-muted">Giỏ hàng trống</h5>
                                    <Link to="/" className="btn btn-primary mt-3">Tiếp tục mua sắm</Link>
                                </div>
                            ) : (
                                <>
                                    {cartItems.map(item => (
                                        <div key={item.id} className="d-flex align-items-center justify-content-between p-3 border-bottom bg-white mb-2 rounded shadow-sm">
                                            <div className="d-flex align-items-center gap-3" style={{ width: '40%' }}>
                                                <img src={item.product?.image || 'https://placehold.co/100x100?text=No+Image'} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/100x100?text=No+Image"; }} alt={item.product?.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                                                <span className="fw-bold fs-6">{item.product?.name}</span>
                                            </div>
                                            <div className="d-flex align-items-center justify-content-between" style={{ width: '60%' }}>
                                                <div className="d-flex align-items-center bg-light border rounded overflow-hidden">
                                                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)} className="btn btn-sm btn-light border-0 px-3 fw-bold">-</button>
                                                    <span className="fw-bold px-3">{item.quantity}</span>
                                                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)} className="btn btn-sm btn-light border-0 px-3 fw-bold">+</button>
                                                </div>
                                                <span className="fw-bold text-primary">{((item.product?.price || 0) * item.quantity).toLocaleString()} đ</span>
                                                <button onClick={() => handleDelete(item.id)} className="btn btn-sm btn-danger rounded d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 bg-dark text-white sticky-top" style={{ top: '80px' }}>
                        <div className="card-body p-4">
                            <h4 className="fw-bold mb-4">Tóm tắt đơn hàng</h4>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="text-light">Tổng tiền hàng:</span>
                                <span className="fw-bold fs-4 text-warning">{total.toLocaleString()} đ</span>
                            </div>
                            <hr className="border-secondary mb-4" />
                            <Link to="/thanhtoan" className={`btn btn-primary w-100 py-3 fw-bold fs-5 shadow ${cartItems.length === 0 ? 'disabled' : ''}`}>
                                Tiến hành Đặt hàng <i className="bi bi-arrow-right ms-2"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}