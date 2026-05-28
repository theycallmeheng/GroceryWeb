import React, { useState, useEffect } from 'react';
import axios from 'axios';

const STATUSES = [
    { id: 1, name: 'Chờ xác nhận' },
    { id: 2, name: 'Đang chuẩn bị hàng' },
    { id: 3, name: 'Đang giao hàng' },
    { id: 4, name: 'Giao thành công' },
    { id: 5, name: 'Đã hủy' },
    { id: 6, name: 'Yêu cầu hủy' }
];

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Tương đương document.addEventListener('DOMContentLoaded', ...)
    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        try {
            // Lưu ý: Cần đảm bảo backend có API lấy đơn hàng của User đang đăng nhập
            const res = await axios.get('http://localhost:8081/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setOrders(res.data);
        } catch (error) {
            console.error("Lỗi tải đơn hàng:", error);
        }
    };

    const handleCancelOrder = async (orderId, isRequest) => {
        const message = isRequest ? 'Bạn muốn gửi yêu cầu hủy đơn hàng này cho Admin xem xét?' : 'Bạn có chắc chắn muốn hủy đơn hàng này?';
        if (!window.confirm(message)) return;
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://localhost:8081/api/orders/${orderId}/cancel`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert(isRequest ? 'Đã gửi yêu cầu hủy!' : 'Đã hủy đơn hàng!');
            fetchOrders(); // Tải lại danh sách tự động cập nhật State
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi khi thao tác với đơn hàng');
        }
    };

    const handleViewOrder = async (orderId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`http://localhost:8081/api/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSelectedOrder(res.data);
            setShowModal(true);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container-fluid py-5">
            <h2 className="mb-4 fw-bold">Đơn hàng của tôi</h2>
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Mã ĐH</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Trạng thái</th><th className="text-end">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => {
                                    const statusId = order.status?.id || order.status || 1;
                                    const statusObj = STATUSES.find(s => s.id === parseInt(statusId));
                                    const canCancel = parseInt(statusId) === 1;
                                    const canRequestCancel = parseInt(statusId) === 2 || parseInt(statusId) === 3;

                                    return (
                                        <tr key={order.id}>
                                            <td><strong>#{order.id}</strong></td>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td className="text-primary fw-bold">{order.total?.toLocaleString()} đ</td>
                                            <td><span className={`badge ${statusId === 1 ? 'bg-warning text-dark' : statusId === 4 ? 'bg-success' : statusId === 5 ? 'bg-danger' : statusId === 6 ? 'bg-secondary' : 'bg-info'}`}>{statusObj?.name}</span></td>
                                            <td className="text-end">
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <button onClick={() => handleViewOrder(order.id)} className="btn btn-sm btn-primary" style={{minWidth: '100px'}}>Xem</button>
                                                    {canCancel && <button onClick={() => handleCancelOrder(order.id, false)} className="btn btn-sm btn-outline-danger" style={{minWidth: '100px'}}>Hủy</button>}
                                                    {canRequestCancel && <button onClick={() => handleCancelOrder(order.id, true)} className="btn btn-sm btn-outline-warning" style={{minWidth: '100px'}}>Yêu cầu hủy</button>}
                                                    {(!canCancel && !canRequestCancel) && <button disabled className="btn btn-sm btn-outline-secondary" style={{minWidth: '100px'}}>Hủy</button>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal hiển thị chi tiết (Có thể tách ra Component riêng cho gọn) */}
            {showModal && selectedOrder && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Đơn hàng #{selectedOrder.id}</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-4 g-3">
                                    <div className="col-md-6">
                                        <p className="mb-1 text-muted">Ngày đặt:</p>
                                        <p className="fw-bold">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="mb-1 text-muted">Trạng thái đơn hàng:</p>
                                        <span className={`badge fs-6 ${selectedOrder.status?.id === 1 || selectedOrder.status === 1 ? 'bg-warning text-dark' : 'bg-info'}`}>
                                            {selectedOrder.status?.name || STATUSES.find(s => s.id === parseInt(selectedOrder.status?.id || selectedOrder.status || 1))?.name || 'Chờ xác nhận'}
                                        </span>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="mb-1 text-muted">Người nhận:</p>
                                        <p className="fw-bold">{selectedOrder.users?.username || 'Khách hàng'} - {selectedOrder.phone || selectedOrder.users?.phone || 'N/A'}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="mb-1 text-muted">Địa chỉ giao:</p>
                                        <p className="fw-bold">{selectedOrder.address || 'N/A'}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="mb-1 text-muted">Phương thức TT:</p>
                                        <p className="fw-bold">{selectedOrder.paymentMethod || 'Tiền mặt'}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="mb-1 text-muted">Trạng thái TT:</p>
                                        <p className="fw-bold text-success">{selectedOrder.paymentStatus || 'Chờ xác nhận'}</p>
                                    </div>
                                    {selectedOrder.note && (
                                        <div className="col-md-12">
                                            <p className="mb-1 text-muted">Ghi chú của bạn:</p>
                                            <div className="p-2 bg-light border rounded">
                                                <p className="mb-0 text-dark fst-italic">{selectedOrder.note}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="col-md-12">
                                        <p className="mb-1 text-muted">Shipper:</p>
                                        <p className="fw-bold">{selectedOrder.shipper ? `${selectedOrder.shipper.name} (${selectedOrder.shipper.phone})` : 'Chưa phân công'}</p>
                                    </div>
                                </div>
                                
                                <h6 className="fw-bold mb-3">Sản phẩm đã đặt:</h6>
                                <div className="table-responsive border rounded">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr><th>Sản phẩm</th><th className="text-center">Số lượng</th><th className="text-end">Đơn giá</th><th className="text-end">Thành tiền</th></tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.orderItems?.length > 0 ? selectedOrder.orderItems.map(item => (<tr key={item.id}><td><div className="d-flex align-items-center gap-2"><img src={item.product?.image || 'https://placehold.co/100x100?text=No+Image'} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/100x100?text=No+Image"; }} alt="img" style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}}/><span>{item.product?.name || item.name}</span></div></td><td className="text-center">{item.quantity}</td><td className="text-end">{item.price?.toLocaleString()} đ</td><td className="text-end fw-bold">{(item.quantity * item.price)?.toLocaleString()} đ</td></tr>)) : <tr><td colSpan="4" className="text-center py-3 text-muted">Không có chi tiết sản phẩm</td></tr>}
                                            <tr><td colSpan="3" className="text-end fw-bold bg-light">Tổng cộng:</td><td className="text-end fw-bold text-danger fs-5 bg-light">{selectedOrder.total?.toLocaleString()} đ</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}