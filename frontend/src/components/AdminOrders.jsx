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

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get('http://localhost:8081/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Lọc và Đẩy đơn "Yêu cầu hủy" (id: 6) lên vị trí trên cùng
            const sortedOrders = res.data.sort((a, b) => {
                const statusA = a.status?.id || a.status;
                const statusB = b.status?.id || b.status;
                if (statusA === 6 && statusB !== 6) return -1;
                if (statusA !== 6 && statusB === 6) return 1;
                return new Date(b.createdAt) - new Date(a.createdAt); // Các đơn khác xếp theo thời gian
            });
            
            setOrders(sortedOrders);
        } catch (error) {
            console.error("Lỗi tải danh sách đơn hàng:", error);
        }
    };

    const handleAction = async (orderId, statusId) => {
        let confirmMsg = "Bạn có chắc chắn muốn cập nhật trạng thái đơn này?";
        if (statusId === 5) confirmMsg = "Xác nhận ĐỒNG Ý cho khách hủy đơn hàng này?";
        if (statusId === 2) confirmMsg = "Xác nhận TỪ CHỐI hủy, đưa đơn hàng về Đang chuẩn bị?";
        
        if (!window.confirm(confirmMsg)) return;

        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://localhost:8081/api/orders/${orderId}/status?statusId=${statusId}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Xử lý thành công!');
            fetchOrders(); // Load lại bảng
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi xử lý đơn hàng');
        }
    };

    return (
        <div className="card shadow-sm border-0 mt-4">
            <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold"><i className="bi bi-bell-fill text-danger me-2"></i>Quản lý Yêu cầu Đơn hàng</h5>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Mã ĐH</th>
                                <th>Ngày đặt</th>
                                <th>Khách hàng</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th className="text-end">Thao tác Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const statusId = order.status?.id || order.status || 1;
                                const statusObj = STATUSES.find(s => s.id === parseInt(statusId));
                                const isRequestCancel = parseInt(statusId) === 6;

                                return (
                                    <tr key={order.id} className={isRequestCancel ? 'table-warning' : ''}>
                                        <td><strong>#{order.id}</strong></td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className="fw-bold">{order.users?.username || 'Khách'}</span><br/>
                                            <small className="text-muted">{order.phone}</small>
                                        </td>
                                        <td className="text-primary fw-bold">{order.total?.toLocaleString()} đ</td>
                                        <td>
                                            <span className={`badge ${isRequestCancel ? 'bg-danger custom-blink fs-6 px-3 py-2 shadow-sm' : statusId === 5 ? 'bg-danger' : statusId === 4 ? 'bg-success' : 'bg-info'}`}>
                                                {isRequestCancel ? <><i className="bi bi-exclamation-triangle-fill me-1"></i> Yêu cầu hủy</> : statusObj?.name}
                                            </span>
                                        </td>
                                        <td className="text-end">
                                            {isRequestCancel ? (
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <button onClick={() => handleAction(order.id, 5)} className="btn btn-sm btn-danger fw-bold shadow-sm">
                                                        Đồng ý Hủy
                                                    </button>
                                                    <button onClick={() => handleAction(order.id, 2)} className="btn btn-sm btn-success fw-bold shadow-sm">
                                                        Từ chối
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-muted small">
                                                    {statusId === 5 ? 'Đã hủy' : statusId === 4 ? 'Giao thành công' : 'Đang xử lý'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <style>{`
                .custom-blink { animation: blinker 1s linear infinite; box-shadow: 0 0 10px rgba(255,0,0,0.5); }
                @keyframes blinker { 50% { opacity: 0.4; } }
            `}</style>
        </div>
    );
}