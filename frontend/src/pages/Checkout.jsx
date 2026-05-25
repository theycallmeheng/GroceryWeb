import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
    const [cartItems, setCartItems] = useState([]);
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('thuong');
    const [shippingFee, setShippingFee] = useState(15000);
    const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/dangnhap');
                return;
            }
            try {
                const [userRes, cartRes] = await Promise.all([
                    axios.get('http://localhost:8081/api/users/me', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:8081/api/cartItems', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setPhone(userRes.data.phone || '');
                setAddress(userRes.data.address || '');
                setCartItems(cartRes.data);
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            }
        };
        fetchData();
    }, [navigate]);

    const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    const totalAmount = subtotal + shippingFee;

    const handleOrder = async () => {
        if (cartItems.length === 0) {
            alert("Giỏ hàng trống!");
            return;
        }
        if (!phone || !address) {
            alert("Vui lòng nhập đủ SĐT và địa chỉ!");
            return;
        }

        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:8081/api/orders/create', {
                phone,
                address,
                total: totalAmount,
                deliveryTime,
                paymentMethod
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/success'); // Chuyển hướng tới trang thành công
        } catch (error) {
            alert('Lỗi khi đặt hàng!');
        }
    };

    const renderQrCode = () => {
        if (paymentMethod !== 'QR') return null;
        const addInfo = `Thanh toan don hang SDT ${phone || 'Khach'}`;
        const qrUrl = `https://img.vietqr.io/image/MB-0338744205-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(addInfo)}&accountName=HOANG%20DINH%20DAT`;
        
        return (
            <div className="p-3 bg-light rounded text-center mb-4 border">
                <p className="fw-bold text-primary mb-2">Quét mã QR bằng App Ngân hàng</p>
                <img src={qrUrl} alt="QR Code" className="img-fluid rounded border p-2 bg-white" style={{ width: '260px', height: '260px' }} />
                <p className="small text-muted mt-2 mb-0">Nội dung CK: <strong className="text-dark">{addInfo}</strong></p>
            </div>
        );
    };

    return (
        <div className="container-fluid py-5">
            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-4">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold me-3" style={{width: '32px', height: '32px'}}>1</div>
                                <h3 className="m-0 fs-5 fw-bold">Thông tin liên hệ</h3>
                            </div>
                            <div className="mb-3 ps-5">
                                <label className="form-label fw-bold text-muted">Số điện thoại người nhận</label>
                                <input type="text" className="form-control bg-light fs-5 py-2" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Nhập số điện thoại..." />
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-4">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold me-3" style={{width: '32px', height: '32px'}}>2</div>
                                <h3 className="m-0 fs-5 fw-bold">Địa chỉ nhận hàng</h3>
                            </div>
                            <div className="mb-3 ps-5">
                                <label className="form-label fw-bold text-muted">Nơi nhận</label>
                                <textarea className="form-control bg-light fs-5 py-2" rows="3" value={address} onChange={e => setAddress(e.target.value)} placeholder="Nhập địa chỉ chi tiết..."></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-4">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold me-3" style={{width: '32px', height: '32px'}}>3</div>
                                <h3 className="m-0 fs-5 fw-bold">Thời gian giao hàng</h3>
                            </div>
                            <div className="row g-3 ps-5">
                                <div className="col-sm-6">
                                    <div className={`card p-3 h-100 border-2 ${deliveryTime === 'thuong' ? 'border-primary bg-primary bg-opacity-10 text-primary' : 'border-light'}`} style={{cursor:'pointer'}} onClick={() => { setDeliveryTime('thuong'); setShippingFee(15000); }}>
                                        <div className="fw-bold mb-1"><i className="bi bi-truck me-1"></i>Giao hàng Thường</div>
                                        <div className="small">Phí vận chuyển: 15.000 đ</div>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className={`card p-3 h-100 border-2 ${deliveryTime === 'nhanh' ? 'border-primary bg-primary bg-opacity-10 text-primary' : 'border-light'}`} style={{cursor:'pointer'}} onClick={() => { setDeliveryTime('nhanh'); setShippingFee(40000); }}>
                                        <div className="fw-bold mb-1"><i className="bi bi-lightning-charge me-1"></i>Giao hàng Nhanh</div>
                                        <div className="small">Phí vận chuyển: 40.000 đ</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-5">
                    <div className="card shadow-sm border-0 bg-white sticky-top" style={{ top: '80px' }}>
                        <div className="card-body p-4">
                            <h4 className="fw-bold border-bottom pb-3 mb-3">Tóm tắt đơn hàng</h4>
                            <div className="mb-4" style={{maxHeight: '300px', overflowY: 'auto'}}>
                                {cartItems.map(item => (
                                    <div key={item.id} className="d-flex justify-content-between align-items-center py-3 border-bottom border-light">
                                        <span className="text-muted"><span className="fw-bold text-dark">{item.quantity}</span> x {item.product?.name}</span>
                                        <span className="fw-bold text-primary">{((item.quantity || 0) * (item.product?.price || 0)).toLocaleString()} đ</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="d-flex justify-content-between mb-2"><span className="text-muted">Tổng tiền hàng</span><span className="fw-bold">{subtotal.toLocaleString()} đ</span></div>
                            <div className="d-flex justify-content-between mb-3 pb-3 border-bottom"><span className="text-muted">Phí vận chuyển</span><span className="fw-bold">{shippingFee.toLocaleString()} đ</span></div>
                            <div className="d-flex justify-content-between mb-4"><span className="fs-5 fw-bold">Tổng thanh toán</span><span className="fs-4 fw-bold text-danger">{totalAmount.toLocaleString()} đ</span></div>

                            <h5 className="fw-bold mb-3 mt-4">Phương thức thanh toán</h5>
                            <div className="row g-2 mb-3">
                                <div className="col-6">
                                    <div className={`p-3 text-center border rounded-3 fw-bold ${paymentMethod === 'Tiền mặt' ? 'border-primary bg-primary bg-opacity-10 text-primary' : 'border-light'}`} style={{cursor:'pointer'}} onClick={() => setPaymentMethod('Tiền mặt')}>
                                        <i className="bi bi-cash-stack me-2 fs-5"></i> Tiền mặt
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className={`p-3 text-center border rounded-3 fw-bold ${paymentMethod === 'QR' ? 'border-primary bg-primary bg-opacity-10 text-primary' : 'border-light'}`} style={{cursor:'pointer'}} onClick={() => setPaymentMethod('QR')}>
                                        <i className="bi bi-qr-code-scan me-2 fs-5"></i> Quét QR
                                    </div>
                                </div>
                            </div>

                            {renderQrCode()}

                            <button onClick={handleOrder} className="btn btn-primary w-100 py-3 fs-5 fw-bold mt-2 shadow-sm">
                                <i className="bi bi-check-circle me-2"></i> Xác nhận Đặt hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}