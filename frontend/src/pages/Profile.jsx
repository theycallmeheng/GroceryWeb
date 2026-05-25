import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const [user, setUser] = useState({ username: '', email: '', firstname: '', lastname: '', phone: '', address: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/dangnhap');
            return;
        }
        axios.get('http://localhost:8081/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setUser(res.data))
            .catch(err => console.error(err));
    }, [navigate]);

    const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://localhost:8081/api/users/${user.id}`, user, { headers: { Authorization: `Bearer ${token}` } });
            alert('Cập nhật thông tin thành công!');
        } catch (error) {
            alert('Lỗi cập nhật!');
        }
    };

    return (
        <div className="container-fluid py-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4 p-md-5">
                            <h2 className="text-center mb-4 fw-bold">Hồ sơ cá nhân</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3"><label className="form-label fw-bold">Username</label><input type="text" className="form-control bg-light" disabled value={user.username || ''} /></div>
                                <div className="mb-3"><label className="form-label fw-bold">Email</label><input type="email" className="form-control bg-light" disabled value={user.email || ''} /></div>
                                <div className="row mb-3">
                                    <div className="col-md-6 mb-3 mb-md-0">
                                        <label className="form-label fw-bold">Họ đệm</label>
                                        <input type="text" name="lastname" className="form-control" value={user.lastname || ''} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Tên</label>
                                        <input type="text" name="firstname" className="form-control" value={user.firstname || ''} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="mb-3"><label className="form-label fw-bold">Số điện thoại</label><input type="text" name="phone" className="form-control" required value={user.phone || ''} onChange={handleChange} /></div>
                                <div className="mb-4"><label className="form-label fw-bold">Địa chỉ</label><input type="text" name="address" className="form-control" value={user.address || ''} onChange={handleChange} /></div>
                                <button type="submit" className="btn btn-primary w-100 py-2"><i className="bi bi-save me-2"></i>Lưu thay đổi</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}