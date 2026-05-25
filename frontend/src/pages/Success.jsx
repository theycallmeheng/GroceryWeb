import React from 'react';
import { Link } from 'react-router-dom';

export default function Success() {
    return (
        <div className="container-fluid text-center py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
            <div className="card shadow-sm border-0 p-5" style={{ maxWidth: '500px', width: '100%', borderRadius: '15px' }}>
                <div className="mb-4">
                    <i className="bi bi-check-circle-fill" style={{ fontSize: '5rem', color: '#198754' }}></i>
                </div>
                <h2 className="fw-bold mb-3">Đặt hàng thành công!</h2>
                <p className="text-muted mb-4 fs-5">Cảm ơn bạn đã tin tưởng mua sắm tại cửa hàng chúng tôi.</p>
                <p className="mb-4">Vào phần <strong>đơn hàng</strong> để xem chi tiết.</p>
                <div className="d-grid gap-3">
                    <Link to="/orders" className="btn btn-primary py-3 fw-bold fs-5">Xem đơn hàng của tôi</Link>
                    <Link to="/" className="btn btn-outline-secondary py-3 fw-bold fs-5">Quay về trang chủ</Link>
                </div>
            </div>
        </div>
    );
}