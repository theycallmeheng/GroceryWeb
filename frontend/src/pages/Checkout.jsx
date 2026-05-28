import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ShippingCalculator from '../components/ShippingCalculator';

export default function Checkout() {
    const [cartItems, setCartItems] = useState([]);
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [shippingFee, setShippingFee] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
    const [note, setNote] = useState('');
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
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Giỏ hàng trống!', type: 'warning' } }));
            return;
        }
        if (!phone || !address) {
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Vui lòng nhập đủ SĐT và địa chỉ!', type: 'warning' } }));
            return;
        }
        if (shippingFee === 0) {
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Vui lòng ấn nút \'Tính Phí Ship\' trên bản đồ trước khi đặt hàng!', type: 'warning' } }));
            return;
        }

        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:8081/api/orders/create', {
                phone,
                address,
                total: totalAmount,
                paymentMethod,
                note
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/success'); // Chuyển hướng tới trang thành công
        } catch (error) {
            const msg = error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng!';
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: msg, type: 'danger' } }));
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
                            <div className="mb-3 ps-5">
                                <label className="form-label fw-bold text-muted">Ghi chú đơn hàng (Tùy chọn)</label>
                                <textarea className="form-control bg-light fs-5 py-2" rows="2" value={note} onChange={e => setNote(e.target.value)} placeholder="Giao giờ hành chính, gọi điện trước khi giao..."></textarea>
                            </div>
                        </div>
                    </div>

                    <ShippingCalculator 
                        initialAddress={address}
                        onFeeCalculated={(fee) => setShippingFee(fee)} 
                        onAddressSelected={(addr) => setAddress(addr)} 
                    />
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