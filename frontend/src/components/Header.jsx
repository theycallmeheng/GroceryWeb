import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Header() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await axios.get('http://localhost:8081/api/users/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(res.data);
                } catch (error) {
                    console.error("Token hết hạn hoặc lỗi xác thực", error);
                    localStorage.removeItem('token');
                }
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/dangnhap');
    };

    return (
        <header className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top py-3">
            <div className="container-fluid px-4">
                <Link className="navbar-brand fw-bold text-success fs-2 d-flex align-items-center" to="/">
                    <i className="bi bi-shop me-2"></i>Grocery
                </Link>
                <div className="d-flex align-items-center gap-4">
                    <Link to="/" className="nav-link fw-bold fs-5 text-dark">Trang chủ</Link>
                    <Link to="/orders" className="nav-link fw-bold fs-5 text-dark">Đơn hàng</Link>
                    <Link to="/giohang" className="nav-link position-relative text-dark ms-2 me-2">
                        <i className="bi bi-cart3 fs-3"></i>
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white" style={{ fontSize: '0.75rem' }}>
                            {user?.userCartItems?.length || 0}
                        </span>
                    </Link>
                    {user ? (
                        <div className="d-flex align-items-center gap-3 ms-2 border-start ps-4">
                            <Link to="/profile" className="text-decoration-none text-dark fw-bold d-flex align-items-center gap-2 bg-light px-3 py-2 rounded-pill shadow-sm">
                                <i className="bi bi-person-circle fs-5 text-primary"></i>
                                <span className="fs-6">{user.username}</span>
                            </Link>
                            <button className="btn btn-outline-danger rounded-pill px-3 py-2 fw-bold shadow-sm" onClick={handleLogout}>
                                <i className="bi bi-box-arrow-right me-1"></i> Đăng xuất
                            </button>
                        </div>
                    ) : (
                        <div className="ms-2 border-start ps-4">
                            <Link to="/dangnhap" className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm">Đăng nhập</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}