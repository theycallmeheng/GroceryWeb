import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            // Bổ sung Token xác thực đề phòng Backend chặn
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            try {
                // Cách 1: Thử gọi API lấy 1 sản phẩm (Phòng khi sau này bạn thêm API này vào Backend)
                const res = await axios.get(`http://localhost:8081/api/products/${id}`, { headers });
                setProduct(res.data);
            } catch (err) {
                // Cách 2: Nếu Backend chưa có API (báo lỗi 404), gọi API lấy tất cả rồi tự lọc ra sản phẩm tương ứng
                const resAll = await axios.get('http://localhost:8081/api/products', { headers });
                const foundProduct = resAll.data.find(p => p.id.toString() === id.toString());
                if (!foundProduct) throw new Error("Không tìm thấy sản phẩm");
                setProduct(foundProduct);
            }
        } catch (error) {
            console.error("Lỗi tải chi tiết sản phẩm:", error);
            alert("Sản phẩm không tồn tại!");
            navigate('/');
        }
        setLoading(false);
    };

    const handleQuantityChange = (amount) => {
        const newQty = quantity + amount;
        if (newQty >= 1 && newQty <= (product?.quantity || 1)) {
            setQuantity(newQty);
        }
    };

    const handleAddToCart = async (redirect = false) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Bạn cần đăng nhập để mua hàng!');
            navigate('/dangnhap');
            return;
        }
        try {
            await axios.post('http://localhost:8081/api/cartItems', { productId: product.id, quantity: quantity }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (redirect) {
                window.location.href = '/giohang'; // Cập nhật Header và nhảy sang giỏ hàng
            } else {
                alert('Đã thêm sản phẩm vào giỏ hàng!');
                window.location.reload(); // Cập nhật Header
            }
        } catch (error) {
            alert('Lỗi thêm vào giỏ hàng');
        }
    };

    if (loading) {
        return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
    }

    if (!product) return null;

    return (
        <div className="container-fluid px-4 px-lg-5 py-5">
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb fs-5">
                    <li className="breadcrumb-item"><a href="/" className="text-decoration-none text-success fw-bold" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Trang chủ</a></li>
                    <li className="breadcrumb-item active" aria-current="page">{product.name}</li>
                </ol>
            </nav>

            <div className="row g-5">
                <div className="col-md-6 col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden sticky-top" style={{top: '100px'}}>
                        <img src={product.image || 'https://placehold.co/600x600?text=No+Image'} 
                             onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x600?text=No+Image"; }} 
                             alt={product.name} 
                             className="img-fluid w-100" 
                             style={{ objectFit: 'cover', aspectRatio: '1/1' }} 
                        />
                    </div>
                </div>
                <div className="col-md-6 col-lg-7">
                    <h2 className="display-5 fw-bold mb-3">{product.name}</h2>
                    <div className="d-flex align-items-center mb-4 gap-3">
                        <span className="badge bg-success fs-6">{product.category?.name || 'Chưa phân loại'}</span>
                        <span className="text-muted fs-5">Đã bán: <strong className="text-dark">{product.soldQuantity || 0}</strong></span>
                    </div>
                    
                    <h3 className="display-6 text-danger fw-bold mb-4">{product.price?.toLocaleString()} đ <span className="fs-5 text-muted fw-normal">/ {product.unit || 'Sản phẩm'}</span></h3>
                    
                    <div className="card bg-light border-0 mb-4 p-4">
                        <h5 className="fw-bold mb-3">Mô tả sản phẩm</h5>
                        <p className="text-secondary mb-0 fs-5" style={{ lineHeight: '1.8' }}>
                            {product.description || 'Chưa có mô tả cho sản phẩm này. Khám phá các sản phẩm tươi ngon và chất lượng nhất mỗi ngày tại cửa hàng của chúng tôi.'}
                        </p>
                    </div>

                    <div className="mb-4 d-flex align-items-center gap-3">
                        <label className="fw-bold fs-5 mb-0">Tình trạng:</label>
                        {product.quantity > 0 ? (
                            <span className="badge bg-success bg-opacity-10 text-success fs-5 px-3 py-2"><i className="bi bi-check-circle-fill me-2"></i>Còn {product.quantity} sản phẩm</span>
                        ) : (
                            <span className="badge bg-danger bg-opacity-10 text-danger fs-5 px-3 py-2"><i className="bi bi-x-circle-fill me-2"></i>Hết hàng</span>
                        )}
                    </div>

                    <div className="d-flex align-items-center gap-4 mb-5">
                        <label className="fw-bold fs-5 mb-0">Số lượng:</label>
                        <div className="d-flex align-items-center bg-white border rounded overflow-hidden shadow-sm" style={{ width: '150px' }}>
                            <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1 || product.quantity <= 0} className="btn btn-light border-0 px-3 fw-bold fs-4">-</button>
                            <input type="text" className="form-control text-center border-0 bg-white fw-bold fs-5 px-0" value={quantity} readOnly />
                            <button onClick={() => handleQuantityChange(1)} disabled={quantity >= product.quantity || product.quantity <= 0} className="btn btn-light border-0 px-3 fw-bold fs-4">+</button>
                        </div>
                    </div>

                    <div className="d-flex gap-3">
                        <button onClick={() => handleAddToCart(false)} disabled={product.quantity <= 0} className="btn btn-outline-primary btn-lg px-4 py-3 fw-bold flex-grow-1">
                            <i className="bi bi-cart-plus me-2"></i> Thêm vào giỏ
                        </button>
                        <button onClick={() => handleAddToCart(true)} disabled={product.quantity <= 0} className="btn btn-primary btn-lg px-4 py-3 fw-bold shadow flex-grow-1">
                            Mua ngay <i className="bi bi-arrow-right-circle ms-2"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}