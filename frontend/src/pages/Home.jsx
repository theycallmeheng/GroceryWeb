import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([{ id: 'All', name: 'Tất cả' }]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12; // Số sản phẩm trên mỗi trang

    // Quản lý Badge Quảng cáo (Ads)
    const [adsProducts, setAdsProducts] = useState([]);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [showAds, setShowAds] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, []);

    // Tự động chuyển đổi sản phẩm quảng cáo sau mỗi 4 giây
    useEffect(() => {
        let timer;
        if (showAds && adsProducts.length > 0) {
            timer = setTimeout(() => {
                setCurrentAdIndex((prev) => (prev + 1) % adsProducts.length);
            }, 4000);
        }
        return () => clearTimeout(timer);
    }, [showAds, adsProducts.length, currentAdIndex]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Gửi kèm Token nếu có, đề phòng backend chặn API khi chưa đăng nhập
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const res = await axios.get('http://localhost:8081/api/products', { headers });
            setProducts(res.data);

            // Lấy ngẫu nhiên 12 sản phẩm cho Badge Quảng cáo
            if (res.data && res.data.length > 0) {
                const shuffled = [...res.data].sort(() => 0.5 - Math.random());
                setAdsProducts(shuffled.slice(0, 12));
                setShowAds(true);
            }

            // Tự động trích xuất ĐẦY ĐỦ các danh mục từ danh sách sản phẩm
            const catMap = new Map();
            res.data.forEach(p => {
                const catId = p.category?.id || p.categoryId;
                const catName = p.category?.name;
                if (catId && catName && !catMap.has(catId)) {
                    catMap.set(catId, catName);
                }
            });

            if (catMap.size > 0) {
                const loadedCategories = [{ id: 'All', name: 'Tất cả' }];
                Array.from(catMap.entries())
                    .sort((a, b) => a[0] - b[0]) // Sắp xếp theo ID
                    .forEach(([id, name]) => loadedCategories.push({ id, name }));
                setCategories(loadedCategories);
            } else {
                // Mặc định nếu chưa có danh mục nào được gán trong DB
                setCategories([
                    { id: 'All', name: 'Tất cả' },
                    { id: 1, name: 'Nước uống' },
                    { id: 2, name: 'Rau củ / Trái cây' },
                    { id: 3, name: 'Thịt và cá' },
                    { id: 4, name: 'Trứng và Sữa' },
                    { id: 5, name: 'Đồ khô / Gia vị' },
                    { id: 6, name: 'Đồ ăn vặt' }
                ]);
            }
        } catch (error) {
            console.error("Lỗi tải danh sách sản phẩm:", error);
        }
        setLoading(false);
    };

    const handleAddToCart = async (productId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Bạn cần đăng nhập để mua hàng!', type: 'warning' } }));
            navigate('/dangnhap');
            return;
        }
        try {
            await axios.post('http://localhost:8081/api/cartItems', { productId, quantity: 1 }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Phát sự kiện để Header tự động cập nhật số lượng giỏ hàng mà không cần reload
            window.dispatchEvent(new Event('cartUpdated'));
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đã thêm sản phẩm vào giỏ hàng!', type: 'success' } }));
        } catch (error) {
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Lỗi thêm vào giỏ hàng', type: 'danger' } }));
        }
    };

    // Lọc sản phẩm theo Từ khóa tìm kiếm và Danh mục
    const filteredProducts = products.filter(product => {
        const matchSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryId = product.category?.id || product.categoryId || 1;
        const matchCategory = activeCategory === 'All' || categoryId.toString() === activeCategory.toString();
        return matchSearch && matchCategory;
    });

    // Tính toán phân trang
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const currentItems = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Hàm điều hướng Badge Quảng cáo
    const nextAd = () => setCurrentAdIndex((prev) => (prev + 1) % adsProducts.length);
    const prevAd = () => setCurrentAdIndex((prev) => (prev - 1 + adsProducts.length) % adsProducts.length);

    return (
        <div>
            {/* Hero Banner Section */}
            <div className="bg-primary bg-opacity-10 py-5 mb-5">
                <div className="container-fluid text-center">
                    <h1 className="display-4 fw-bold text-primary mb-3">Chào mừng đến với Grocery</h1>
                    <p className="lead text-muted mb-4">Khám phá các sản phẩm tươi ngon và chất lượng nhất mỗi ngày</p>
                    
                    {/* Thanh tìm kiếm */}
                    <div className="mx-auto" style={{ maxWidth: '600px' }}>
                        <div className="input-group input-group-lg shadow-sm">
                            <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                            <input type="text" className="form-control border-start-0 ps-0" placeholder="Tìm kiếm tên sản phẩm..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                        </div>
                    </div>

                    {/* Badge Quảng cáo nổi bật ở phần đầu */}
                    {showAds && adsProducts.length > 0 && (
                        <div className="mx-auto mt-5 text-start" style={{ maxWidth: '850px' }}>
                            <div className="card shadow-lg border-0 rounded-4 overflow-hidden position-relative bg-white">
                                <button 
                                    onClick={() => setShowAds(false)} 
                                    className="btn btn-light position-absolute top-0 end-0 m-3 rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                                    style={{ zIndex: 10, width: '36px', height: '36px', padding: 0 }}
                                >
                                    <i className="bi bi-x fs-4"></i>
                                </button>
                                <div className="bg-warning text-dark text-center fw-bold py-2 fs-5 text-uppercase" style={{ letterSpacing: '1px' }}>
                                    <i className="bi bi-star-fill me-2 text-danger"></i> Siêu phẩm gợi ý hôm nay <i className="bi bi-star-fill ms-2 text-danger"></i>
                                </div>
                                
                                <div className="row g-0 align-items-center">
                                    <div className="col-md-6">
                                        <Link to={`/product/${adsProducts[currentAdIndex].id}`}>
                                            <img 
                                                src={adsProducts[currentAdIndex].image || 'https://placehold.co/600x600?text=No+Image'} 
                                                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x600?text=No+Image"; }} 
                                                alt={adsProducts[currentAdIndex].name} 
                                                className="img-fluid w-100" 
                                                style={{ objectFit: 'cover', height: '100%', minHeight: '320px' }} 
                                            />
                                        </Link>
                                    </div>
                                    <div className="col-md-6 p-4 p-lg-5 text-center text-md-start d-flex flex-column h-100">
                                        <Link to={`/product/${adsProducts[currentAdIndex].id}`} className="text-decoration-none text-dark mb-3">
                                            <h3 className="fw-bold lh-base">{adsProducts[currentAdIndex].name}</h3>
                                        </Link>
                                        <p className="text-danger display-6 fw-bold mb-4">{adsProducts[currentAdIndex].price?.toLocaleString()} đ</p>
                                        
                                        <Link to={`/product/${adsProducts[currentAdIndex].id}`} className="btn btn-primary btn-lg rounded-pill fw-bold shadow-sm mb-4">
                                            Khám phá ngay <i className="bi bi-arrow-right ms-2"></i>
                                        </Link>
                                        
                                        <div className="d-flex justify-content-center justify-content-md-start align-items-center gap-4 mt-auto pt-3 border-top">
                                            <button onClick={prevAd} className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '45px', height: '45px'}}><i className="bi bi-chevron-left fs-5"></i></button>
                                            <span className="text-muted fw-bold fs-5">{currentAdIndex + 1} / {adsProducts.length}</span>
                                            <button onClick={nextAd} className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '45px', height: '45px'}}><i className="bi bi-chevron-right fs-5"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="container-fluid pb-5">
                {/* Phân loại danh mục */}
                <div className="d-flex flex-wrap justify-content-center gap-2 mb-5">
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); }} className={`btn px-4 rounded-pill fw-bold ${activeCategory === cat.id ? 'btn-primary shadow' : 'btn-outline-secondary'}`}>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Danh sách sản phẩm */}
                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-box-seam display-1 text-muted mb-3 d-block"></i>
                        <h4 className="text-muted">Không tìm thấy sản phẩm nào!</h4>
                    </div>
                ) : (
                    <>
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                            {currentItems.map(product => (
                                <div className="col" key={product.id}>
                                <div className="card h-100 shadow-sm border-0 transition-all">
                                    <Link to={`/product/${product.id}`} className="text-decoration-none text-dark d-flex flex-column h-100">
                                        <div className="position-relative">
                                            <img src={product.image || 'https://placehold.co/400x400?text=No+Image'} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400?text=No+Image"; }} className="card-img-top" alt={product.name} style={{ height: '220px', objectFit: 'cover' }} />
                                            {product.quantity <= 0 && <span className="position-absolute top-0 start-0 m-2 badge bg-danger fs-6 shadow-sm">Hết hàng</span>}
                                        </div>
                                        <div className="card-body d-flex flex-column text-center p-4 pb-3">
                                            <h5 className="card-title fs-5 fw-bold mb-2">{product.name}</h5>
                                            <p className="card-text text-danger fw-bold fs-4 mb-0">{product.price?.toLocaleString()} đ</p>
                                        </div>
                                    </Link>
                                    <div className="card-footer bg-white border-0 px-4 pb-4 pt-0 mt-auto">
                                        <button onClick={() => handleAddToCart(product.id)} disabled={product.quantity <= 0} className="btn btn-primary w-100 py-2 fw-bold shadow-sm">
                                            <i className="bi bi-cart-plus me-2"></i> {product.quantity <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            ))}
                        </div>

                        {/* Thanh điều hướng phân trang */}
                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-5">
                                <nav aria-label="Page navigation">
                                    <ul className="pagination pagination-lg">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Trước</button>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Sau</button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}