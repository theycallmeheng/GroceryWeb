import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                const res = await axios.post('http://localhost:8081/api/auth/login', { username, password });
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', res.data.role || 'ROLE_USER');
                alert('Đăng nhập thành công!');
                
                if (res.data.role === 'ROLE_ADMIN') {
                    window.location.href = '/admin'; // Chuyển hướng và tải lại trang để đồng bộ Header
                } else {
                    window.location.href = '/'; // Chuyển hướng và tải lại trang để đồng bộ Header
                }
            } else {
                if (password !== confirmPassword) {
                    alert('Mật khẩu xác nhận không khớp!');
                    return;
                }
                await axios.post('http://localhost:8081/api/auth/register', { username, password, email });
                alert('Đăng ký thành công! Vui lòng đăng nhập.');
                setIsLogin(true);
            }
        } catch (error) {
            alert(isLogin ? 'Đăng nhập thất bại. Kiểm tra lại thông tin!' : 'Đăng ký thất bại!');
        }
    };

    return (
        <div className="container py-5" style={{ maxWidth: '500px' }}>
            <div className="card shadow-sm border-0">
                <div className="card-body p-4">
                    <h2 className="text-center mb-4 fw-bold text-success">{isLogin ? 'Đăng nhập' : 'Đăng ký'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Tên đăng nhập</label>
                            <input type="text" className="form-control" required value={username} onChange={(e) => setUsername(e.target.value)} />
                        </div>
                        {!isLogin && (
                            <div className="mb-3">
                                <label className="form-label fw-bold">Email</label>
                                <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="form-label fw-bold">Mật khẩu</label>
                            <input type="password" className="form-control" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    {!isLogin && (
                        <div className="mb-4">
                            <label className="form-label fw-bold">Xác nhận mật khẩu</label>
                            <input type="password" className="form-control" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                    )}
                        <button type="submit" className="btn btn-success w-100 py-2 fw-bold">{isLogin ? 'Đăng nhập' : 'Đăng ký'}</button>
                    </form>
                    <div className="text-center mt-3">
                        <span className="text-muted">{isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}</span>
                        <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}