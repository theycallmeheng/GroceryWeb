import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Admin() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialView = searchParams.get('view') || 'dashboard';
    const [activeTab, setActiveTab] = useState(initialView);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Data states
    const [dashboardData, setDashboardData] = useState({ totalUsers: 0, totalOrders: 0, totalProducts: 0, totalShippers: 0, totalRevenue: 0, totalProfit: 0 });
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [shippers, setShippers] = useState([]);
    const [revenueData, setRevenueData] = useState({ list: [], totalRev: 0, totalProf: 0, productStats: [] });
    const [stockReceipts, setStockReceipts] = useState([]);

    // Modals visibility
    const [modals, setModals] = useState({});
    const openModal = (name) => setModals({ ...modals, [name]: true });
    const closeModal = (name) => setModals({ ...modals, [name]: false });

    // Form states
    const [userForm, setUserForm] = useState({});
    const [productForm, setProductForm] = useState({ category: { id: 1 } });
    const [shipperForm, setShipperForm] = useState({});
    const [orderDetail, setOrderDetail] = useState(null);
    const [stockForm, setStockForm] = useState({});
    const [assignShipperForm, setAssignShipperForm] = useState({});
    const [selectedOrderStatus, setSelectedOrderStatus] = useState('');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'ROLE_ADMIN') {
            navigate('/');
            return;
        }
        fetchData(activeTab);
        setSearchParams({ view: activeTab });
    }, [activeTab]);

    useEffect(() => {
        if (orderDetail) {
            setSelectedOrderStatus(orderDetail.status?.id || orderDetail.status || 1);
            setSelectedPaymentStatus(orderDetail.paymentStatus || 'Chờ xác nhận');
        }
    }, [orderDetail]);

    const getAuthHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchData = async (tab) => {
        setLoading(true);
        try {
            if (tab === 'dashboard') {
                const [resUsers, resOrders, resProducts, resShippers, resRevenue] = await Promise.all([
                    axios.get('http://localhost:8081/api/admin/users', getAuthHeaders()),
                    axios.get('http://localhost:8081/api/admin/orders', getAuthHeaders()),
                    axios.get('http://localhost:8081/api/admin/products', getAuthHeaders()),
                    axios.get('http://localhost:8081/api/admin/shippers', getAuthHeaders()),
                    axios.get('http://localhost:8081/api/admin/reports/revenue', getAuthHeaders())
                ]);
                setDashboardData({
                    totalUsers: resUsers.data.length,
                    totalOrders: resOrders.data.length,
                    totalProducts: resProducts.data.length,
                    totalShippers: resShippers.data.length,
                    totalRevenue: resRevenue.data.totalRevenue,
                    totalProfit: resRevenue.data.totalProfit
                });
            } else if (tab === 'users') {
                const res = await axios.get('http://localhost:8081/api/admin/users', getAuthHeaders());
                setUsers(res.data);
            } else if (tab === 'orders') {
                const res = await axios.get('http://localhost:8081/api/admin/orders', getAuthHeaders());
                setOrders(res.data);
            } else if (tab === 'products') {
                const res = await axios.get('http://localhost:8081/api/admin/products', getAuthHeaders());
                setProducts(res.data);
            } else if (tab === 'shippers') {
                const res = await axios.get('http://localhost:8081/api/admin/shippers', getAuthHeaders());
                setShippers(res.data);
            } else if (tab === 'stock') {
                const [resStock, resProd] = await Promise.all([
                    axios.get('http://localhost:8081/api/admin/stock-receipts', getAuthHeaders()),
                    axios.get('http://localhost:8081/api/admin/products', getAuthHeaders())
                ]);
                setStockReceipts(resStock.data);
                setProducts(resProd.data);
            } else if (tab === 'revenue') {
                const res = await axios.get('http://localhost:8081/api/admin/reports/revenue', getAuthHeaders());
                setRevenueData({ 
                    list: [], 
                    totalRev: res.data.totalRevenue, 
                    totalProf: res.data.totalProfit, 
                    productStats: res.data.productStats 
                });
            }
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                alert('Phiên đăng nhập hết hạn hoặc không có quyền.');
                navigate('/dangnhap');
            }
        }
        setLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/dangnhap');
    };

    // === XỬ LÝ CRUD ===
    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            if (userForm.id) await axios.put(`http://localhost:8081/api/admin/users/${userForm.id}`, userForm, getAuthHeaders());
            else await axios.post('http://localhost:8081/api/admin/users', userForm, getAuthHeaders());
            alert('Lưu người dùng thành công!');
            closeModal('user');
            fetchData('users');
        } catch (err) { alert('Lỗi lưu người dùng'); }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Xóa người dùng?')) return;
        try {
            await axios.delete(`http://localhost:8081/api/admin/users/${id}`, getAuthHeaders());
            fetchData('users');
        } catch (err) { alert('Lỗi xóa'); }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...productForm, category: { id: parseInt(productForm.categoryId || productForm.category?.id || 1) } };
            if (productForm.id) await axios.put(`http://localhost:8081/api/admin/products/${productForm.id}`, payload, getAuthHeaders());
            else await axios.post('http://localhost:8081/api/admin/products', payload, getAuthHeaders());
            alert('Lưu sản phẩm thành công!');
            closeModal('product');
            fetchData('products');
        } catch (err) { alert('Lỗi lưu sản phẩm'); }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Xóa sản phẩm?')) return;
        try {
            await axios.delete(`http://localhost:8081/api/admin/products/${id}`, getAuthHeaders());
            fetchData('products');
        } catch (err) { alert('Lỗi xóa'); }
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        try {
            const { id, quantity, importPrice } = stockForm;
            await axios.post('http://localhost:8081/api/admin/stock-receipts', {
                productId: id,
                quantity: quantity,
                importPrice: importPrice || 0
            }, getAuthHeaders());
            alert('Nhập hàng thành công!');
            closeModal('stock');
            fetchData(activeTab); // Reload lại tab hiện tại
        } catch (err) { alert('Lỗi nhập hàng'); }
    };

    const handleSaveShipper = async (e) => {
        e.preventDefault();
        try {
            if (shipperForm.id) await axios.put(`http://localhost:8081/api/admin/shippers/${shipperForm.id}`, shipperForm, getAuthHeaders());
            else await axios.post('http://localhost:8081/api/admin/shippers', shipperForm, getAuthHeaders());
            alert('Lưu Shipper thành công!');
            closeModal('shipper');
            fetchData('shippers');
        } catch (err) { alert('Lỗi lưu Shipper'); }
    };

    const handleDeleteShipper = async (id) => {
        if (!window.confirm('Xóa Shipper?')) return;
        try {
            await axios.delete(`http://localhost:8081/api/admin/shippers/${id}`, getAuthHeaders());
            fetchData('shippers');
        } catch (err) { alert('Lỗi xóa'); }
    };

    const handleUpdateOrderStatus = async (statusId) => {
        try {
            await axios.put(`http://localhost:8081/api/orders/${orderDetail.id}/status?statusId=${statusId}`, { statusId }, getAuthHeaders());
            alert('Cập nhật trạng thái đơn hàng thành công!');
            fetchData('orders');
            closeModal('order');
        } catch (err) { alert('Lỗi cập nhật'); }
    };

    const handleUpdatePaymentStatus = async (paymentStatus) => {
        try {
            await axios.put(`http://localhost:8081/api/orders/${orderDetail.id}/payment-status`, { paymentStatus }, getAuthHeaders());
            alert('Cập nhật trạng thái thanh toán thành công!');
            fetchData('orders');
            closeModal('order');
        } catch (err) { alert('Lỗi cập nhật'); }
    };

    const handleAssignShipper = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://localhost:8081/api/admin/orders/${assignShipperForm.orderId}/assign-shipper`, { shipperId: assignShipperForm.shipperId }, getAuthHeaders());
            alert('Phân công thành công!');
            closeModal('assignShipper');
            fetchData('orders');
        } catch (err) { alert('Lỗi phân công'); }
    };

    const navItems = [
        { id: 'dashboard', name: 'Trang chủ', icon: 'bi-house-door' },
        { id: 'revenue', name: 'Doanh thu', icon: 'bi-graph-up-arrow' },
        { id: 'users', name: 'Người dùng', icon: 'bi-people' },
        { id: 'orders', name: 'Đơn hàng', icon: 'bi-cart-check' },
        { id: 'products', name: 'Sản phẩm', icon: 'bi-box-seam' },
        { id: 'stock', name: 'Nhập kho', icon: 'bi-box-arrow-in-down' },
        { id: 'shippers', name: 'Shipper', icon: 'bi-truck' },
    ];

    const getStatusName = (id) => ({ 1: 'Chờ xác nhận', 2: 'Đang chuẩn bị hàng', 3: 'Đang giao hàng', 4: 'Giao thành công', 5: 'Đã hủy', 6: 'Yêu cầu hủy' }[id] || 'Chờ xác nhận');

    return (
        <div className="d-flex flex-column" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <header className="navbar navbar-dark bg-dark sticky-top px-4 py-2 shadow">
                <span className="navbar-brand fs-4 fw-bold">Admin Dashboard</span>
                <button onClick={handleLogout} className="btn btn-danger btn-sm"><i className="bi bi-box-arrow-right me-2"></i>Đăng xuất</button>
            </header>

            <div className="container-fluid flex-grow-1 p-0">
                <div className="row m-0 h-100">
                    <aside className="col-md-3 col-lg-2 d-md-block bg-white border-end pt-3 px-2">
                        <ul className="nav flex-column gap-2">
                            {navItems.map(item => (
                                <li className="nav-item" key={item.id}>
                                    <button className={`nav-link w-100 text-start border-0 ${activeTab === item.id ? 'active bg-primary text-white rounded' : 'bg-transparent text-dark'}`} onClick={() => setActiveTab(item.id)}>
                                        <i className={`bi ${item.icon} me-2`}></i>{item.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </aside>

                    <main className="col-md-9 col-lg-10 p-4 p-md-5">
                        {loading ? <div className="text-center py-5"><div className="spinner-border text-primary"></div></div> : (
                            <>
                                {activeTab === 'dashboard' && (
                                    <div>
                                        <h2 className="mb-4">Trang chủ Quản trị</h2>
                                        <div className="row g-4 mb-4">
                                            <div className="col-md-6 col-lg-3">
                                                <div className="card bg-primary bg-opacity-10 border-primary shadow-sm h-100">
                                                    <div className="card-body text-center p-4">
                                                        <i className="bi bi-people display-4 text-primary mb-2"></i>
                                                        <h5 className="card-title fw-normal fs-6 text-muted">Người dùng</h5>
                                                        <p className="fs-3 fw-bold text-primary mb-0">{dashboardData.totalUsers}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6 col-lg-3">
                                                <div className="card bg-success bg-opacity-10 border-success shadow-sm h-100">
                                                    <div className="card-body text-center p-4">
                                                        <i className="bi bi-cart-check display-4 text-success mb-2"></i>
                                                        <h5 className="card-title fw-normal fs-6 text-muted">Đơn hàng</h5>
                                                        <p className="fs-3 fw-bold text-success mb-0">{dashboardData.totalOrders}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6 col-lg-3">
                                                <div className="card bg-warning bg-opacity-10 border-warning shadow-sm h-100">
                                                    <div className="card-body text-center p-4">
                                                        <i className="bi bi-box-seam display-4 text-warning mb-2"></i>
                                                        <h5 className="card-title fw-normal fs-6 text-muted">Sản phẩm</h5>
                                                        <p className="fs-3 fw-bold text-warning mb-0">{dashboardData.totalProducts}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6 col-lg-3">
                                                <div className="card bg-info bg-opacity-10 border-info shadow-sm h-100">
                                                    <div className="card-body text-center p-4">
                                                        <i className="bi bi-truck display-4 text-info mb-2"></i>
                                                        <h5 className="card-title fw-normal fs-6 text-muted">Shipper</h5>
                                                        <p className="fs-3 fw-bold text-info mb-0">{dashboardData.totalShippers}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-12 col-lg-6">
                                                <div className="card bg-danger bg-opacity-10 border-danger shadow-sm h-100">
                                                    <div className="card-body d-flex align-items-center justify-content-between p-4">
                                                        <div>
                                                            <h5 className="card-title fw-normal fs-5 text-muted mb-1">Doanh thu tạm tính</h5>
                                                            <p className="fs-2 fw-bold text-danger mb-0">{dashboardData.totalRevenue?.toLocaleString()} đ</p>
                                                        </div>
                                                        <i className="bi bi-graph-up-arrow display-3 text-danger opacity-50"></i>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-12 col-lg-6">
                                                <div className="card bg-info bg-opacity-10 border-info shadow-sm h-100">
                                                    <div className="card-body d-flex align-items-center justify-content-between p-4">
                                                        <div>
                                                            <h5 className="card-title fw-normal fs-5 text-muted mb-1">Lợi nhuận tạm tính</h5>
                                                            <p className="fs-2 fw-bold text-info mb-0">{dashboardData.totalProfit?.toLocaleString()} đ</p>
                                                        </div>
                                                        <i className="bi bi-cash-coin display-3 text-info opacity-50"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'users' && (
                                    <div>
                                        <div className="d-flex justify-content-between align-items-center mb-4"><h3 className="mb-0">Quản lý Người dùng</h3><button className="btn btn-primary px-4 py-2" onClick={() => { setUserForm({ role: 'ROLE_USER' }); openModal('user'); }}><i className="bi bi-plus-lg me-2"></i> Thêm Người Dùng</button></div>
                                        <div className="table-responsive bg-white rounded shadow-sm p-4">
                                            <table className="table table-hover align-middle mb-0"><thead className="table-dark"><tr><th>ID</th><th>Username</th><th>Email</th><th>Họ tên</th><th>Vai trò</th><th>Hành động</th></tr></thead>
                                                <tbody>{users.map(u => (<tr key={u.id}><td>{u.id}</td><td>{u.username}</td><td>{u.email}</td><td>{u.firstname} {u.lastname}</td><td>{u.role}</td><td><button className="btn btn-sm btn-warning me-2" onClick={() => { setUserForm(u); openModal('user'); }}>Sửa</button><button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(u.id)}>Xóa</button></td></tr>))}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'products' && (
                                    <div>
                                        <div className="d-flex justify-content-between align-items-center mb-4"><h3 className="mb-0">Quản lý Sản phẩm</h3><button className="btn btn-primary px-4 py-2" onClick={() => { setProductForm({ categoryId: 1 }); openModal('product'); }}><i className="bi bi-plus-lg me-2"></i> Thêm Sản phẩm</button></div>
                                        <div className="table-responsive bg-white rounded shadow-sm p-4">
                                            <table className="table table-hover align-middle mb-0"><thead className="table-dark"><tr><th>ID</th><th>Tên SP</th><th>Giá</th><th>Tồn kho</th><th>Hành động</th></tr></thead>
                                                <tbody>{products.map(p => (<tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.price?.toLocaleString()}</td><td><strong>{p.quantity || 0}</strong></td><td><button className="btn btn-sm btn-warning me-2" onClick={() => { setProductForm(p); openModal('product'); }}>Sửa</button><button className="btn btn-sm btn-danger" onClick={() => handleDeleteProduct(p.id)}>Xóa</button></td></tr>))}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'orders' && (
                                    <div>
                                        <h3 className="mb-4">Quản lý Đơn hàng</h3>
                                        <div className="table-responsive bg-white rounded shadow-sm p-4">
                                            <table className="table table-hover align-middle mb-0"><thead className="table-dark"><tr><th>Mã ĐH</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Shipper</th><th>Hành động</th></tr></thead>
                                                <tbody>{orders.map(o => (<tr key={o.id}><td><strong>#{o.id}</strong></td><td>{o.users?.username}</td><td>{o.total?.toLocaleString()} đ</td><td><span className={`badge ${o.status?.id === 1 || o.status === 1 ? 'bg-warning text-dark' : o.status?.id === 4 ? 'bg-success' : o.status?.id === 5 ? 'bg-danger' : o.status?.id === 6 ? 'bg-secondary' : 'bg-info'}`}>{getStatusName(o.status?.id || o.status || 1)}</span></td><td>{o.shipper ? o.shipper.name : <span className="text-danger">Chưa có</span>}</td><td><button className="btn btn-sm btn-primary me-2" onClick={() => { setOrderDetail(o); openModal('order'); }}>Chi tiết</button><button className="btn btn-sm btn-warning" onClick={() => { axios.get('http://localhost:8081/api/admin/shippers', getAuthHeaders()).then(res => { setShippers(res.data); setAssignShipperForm({ orderId: o.id, shipperId: '' }); openModal('assignShipper'); }); }}>Phân công</button></td></tr>))}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'stock' && (
                                    <div>
                                        <div className="d-flex justify-content-between align-items-center mb-4"><h3 className="mb-0">Lịch sử Nhập kho</h3><button className="btn btn-primary px-4 py-2" onClick={() => { setStockForm({ id: '', quantity: 1, importPrice: '' }); openModal('stock'); }}><i className="bi bi-plus-lg me-2"></i> Tạo phiếu nhập</button></div>
                                        <div className="table-responsive bg-white rounded shadow-sm p-4">
                                            <table className="table table-hover align-middle mb-0"><thead className="table-dark"><tr><th>Mã Phiếu</th><th>Ngày nhập</th><th>Người nhập</th><th>Sản phẩm</th><th className="text-center">Số lượng</th><th className="text-end">Giá nhập</th><th className="text-end">Tổng chi phí</th></tr></thead>
                                                <tbody>
                                                    {stockReceipts.map(r => (
                                                        <tr key={r.id}>
                                                            <td><strong>#{r.id}</strong></td>
                                                            <td>{new Date(r.createdAt).toLocaleString()}</td>
                                                            <td>{r.user?.username}</td>
                                                            <td>{r.product?.name}</td>
                                                            <td className="text-center fw-bold text-success">+{r.quantity}</td>
                                                            <td className="text-end">{r.importPrice?.toLocaleString()} đ</td>
                                                            <td className="text-end fw-bold">{(r.importPrice * r.quantity)?.toLocaleString()} đ</td>
                                                        </tr>
                                                    ))}
                                                    {stockReceipts.length === 0 && <tr><td colSpan="7" className="text-center py-3 text-muted">Chưa có lịch sử nhập kho</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'shippers' && (
                                    <div>
                                        <div className="d-flex justify-content-between align-items-center mb-4"><h3 className="mb-0">Quản lý Shipper</h3><button className="btn btn-primary px-4 py-2" onClick={() => { setShipperForm({}); openModal('shipper'); }}><i className="bi bi-plus-lg me-2"></i> Thêm Shipper</button></div>
                                        <div className="table-responsive bg-white rounded shadow-sm p-4">
                                            <table className="table table-hover align-middle mb-0"><thead className="table-dark"><tr><th>ID</th><th>Mã NV</th><th>Họ Tên</th><th>SĐT</th><th>Hành động</th></tr></thead>
                                                <tbody>{shippers.map(s => (<tr key={s.id}><td>{s.id}</td><td>{s.empCode}</td><td>{s.name}</td><td>{s.phone}</td><td><button className="btn btn-sm btn-warning me-2" onClick={() => { setShipperForm(s); openModal('shipper'); }}>Sửa</button><button className="btn btn-sm btn-danger" onClick={() => handleDeleteShipper(s.id)}>Xóa</button></td></tr>))}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'revenue' && (
                                    <div>
                                        <h3 className="mb-4">Doanh thu & Lợi nhuận</h3>
                                        <div className="row g-4 mb-5">
                                            <div className="col-md-6"><div className="card bg-success bg-opacity-10 border-success shadow-sm text-center p-4"><h5 className="text-success fs-5 mb-2">Tổng Doanh Thu</h5><p className="fs-2 fw-bold text-success mb-0">{revenueData.totalRev.toLocaleString()} VNĐ</p></div></div>
                                            <div className="col-md-6"><div className="card bg-info bg-opacity-10 border-info shadow-sm text-center p-4"><h5 className="text-info fs-5 mb-2">Tổng Lợi Nhuận</h5><p className="fs-2 fw-bold text-info mb-0">{revenueData.totalProf.toLocaleString()} VNĐ</p></div></div>
                                        </div>

                                        <h4 className="mb-4">Chi tiết Sản phẩm bán ra</h4>
                                        <div className="table-responsive bg-white rounded shadow-sm p-4">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="table-dark">
                                                    <tr>
                                                        <th>Tên Sản phẩm</th>
                                                        <th className="text-end">Giá nhập</th>
                                                        <th className="text-end">Giá bán</th>
                                                        <th className="text-center">Số lượng bán</th>
                                                        <th className="text-end">Doanh thu</th>
                                                        <th className="text-end">Lợi nhuận</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {revenueData.productStats && revenueData.productStats.length > 0 ? revenueData.productStats.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td><strong>{item.name}</strong></td>
                                                            <td className="text-end text-muted">{item.importPrice.toLocaleString()} đ</td>
                                                            <td className="text-end text-primary">{item.sellPrice.toLocaleString()} đ</td>
                                                            <td className="text-center fw-bold">{item.quantity}</td>
                                                            <td className="text-end fw-bold text-success">{item.totalRev.toLocaleString()} đ</td>
                                                            <td className="text-end fw-bold text-info">{item.totalProf.toLocaleString()} đ</td>
                                                        </tr>
                                                    )) : <tr><td colSpan="6" className="text-center text-muted py-3">Chưa có dữ liệu</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* --- MODALS (Rút gọn) --- */}
            {modals.product && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content"><form onSubmit={handleSaveProduct}>
                    <div className="modal-header"><h5 className="modal-title">{productForm.id ? 'Sửa' : 'Thêm'} Sản phẩm</h5><button type="button" className="btn-close" onClick={() => closeModal('product')}></button></div>
                    <div className="modal-body"><input type="text" className="form-control mb-2" placeholder="Tên SP" required value={productForm.name || ''} onChange={e => setProductForm({...productForm, name: e.target.value})} /><input type="number" className="form-control mb-2" placeholder="Giá" required value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: e.target.value})} /><input type="url" className="form-control mb-2" placeholder="Ảnh URL" required value={productForm.image || ''} onChange={e => setProductForm({...productForm, image: e.target.value})} /><select className="form-select" value={productForm.categoryId || productForm.category?.id || 1} onChange={e => setProductForm({...productForm, categoryId: e.target.value})}><option value="1">Nước uống</option><option value="2">Rau củ / Trái cây</option><option value="3">Thịt và cá</option><option value="4">Trứng và Sữa</option><option value="5">Đồ khô / Gia vị</option><option value="6">Đồ ăn vặt</option></select></div>
                    <div className="modal-footer"><button type="submit" className="btn btn-primary w-100">Lưu</button></div>
                </form></div></div></div>
            )}

            {modals.stock && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content"><form onSubmit={handleAddStock}>
                    <div className="modal-header"><h5 className="modal-title">Phiếu Nhập Kho</h5><button type="button" className="btn-close" onClick={() => closeModal('stock')}></button></div>
                    <div className="modal-body">
                        {stockForm.name ? (
                            <p className="fw-bold mb-3">Sản phẩm: {stockForm.name} <span className="text-muted">(Tồn hiện tại: {stockForm.currentQty})</span></p>
                        ) : (
                            <div className="mb-3"><label className="form-label fw-bold">Chọn sản phẩm</label><select className="form-select" required value={stockForm.id} onChange={e => setStockForm({...stockForm, id: e.target.value})}><option value="">-- Chọn sản phẩm --</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} (Tồn: {p.quantity || 0})</option>)}</select></div>
                        )}
                        <div className="mb-3"><label className="form-label fw-bold">Số lượng nhập</label><input type="number" min="1" className="form-control" placeholder="Nhập số lượng" required value={stockForm.quantity || 1} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} /></div>
                        <div className="mb-3"><label className="form-label fw-bold">Giá nhập</label><input type="number" className="form-control" placeholder="Giá nhập 1 sản phẩm (Tùy chọn)" value={stockForm.importPrice || ''} onChange={e => setStockForm({...stockForm, importPrice: e.target.value})} /></div>
                    </div>
                    <div className="modal-footer"><button type="submit" className="btn btn-primary w-100">Xác nhận</button></div>
                </form></div></div></div>
            )}

            {modals.order && orderDetail && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content">
                    <div className="modal-header bg-light"><h5 className="modal-title fw-bold">Chi tiết Đơn hàng #{orderDetail.id}</h5><button type="button" className="btn-close" onClick={() => closeModal('order')}></button></div>
                    <div className="modal-body">
                        <div className="row g-3 mb-4">
                            <div className="col-md-6"><p className="mb-1 text-muted">Khách hàng:</p><p className="fw-bold">{orderDetail.users?.username || 'N/A'}</p></div>
                            <div className="col-md-6"><p className="mb-1 text-muted">Ngày đặt:</p><p className="fw-bold">{new Date(orderDetail.createdAt).toLocaleString()}</p></div>
                            <div className="col-md-6"><p className="mb-1 text-muted">Số điện thoại:</p><p className="fw-bold">{orderDetail.phone || 'N/A'}</p></div>
                            <div className="col-md-6"><p className="mb-1 text-muted">Địa chỉ:</p><p className="fw-bold">{orderDetail.address || 'N/A'}</p></div>
                            <div className="col-md-6"><p className="mb-1 text-muted">Phương thức TT:</p><p className="fw-bold">{orderDetail.paymentMethod || 'Tiền mặt'}</p></div>
                            <div className="col-md-6"><p className="mb-1 text-muted">Shipper:</p><p className="fw-bold">{orderDetail.shipper ? `${orderDetail.shipper.name} (${orderDetail.shipper.phone})` : 'Chưa phân công'}</p></div>
                        </div>

                        <h6 className="fw-bold mb-3">Chi tiết sản phẩm</h6>
                        <div className="table-responsive border rounded-top mb-4">
                            <table className="table table-hover align-middle mb-0"><thead className="table-light"><tr><th>Sản phẩm</th><th className="text-center">Số lượng</th><th className="text-end">Đơn giá</th><th className="text-end">Thành tiền</th></tr></thead>
                                <tbody>
                                    {orderDetail.orderItems?.map(item => (<tr key={item.id}><td>{item.product?.name || item.name}</td><td className="text-center">{item.quantity}</td><td className="text-end">{item.price?.toLocaleString()} đ</td><td className="text-end fw-bold">{(item.quantity * item.price)?.toLocaleString()} đ</td></tr>))}
                                    <tr><td colSpan="3" className="text-end fw-bold bg-light">Tổng cộng:</td><td className="text-end fw-bold text-danger fs-5 bg-light">{orderDetail.total?.toLocaleString()} đ</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <h6 className="fw-bold">Hành động</h6>
                        {orderDetail.status?.id === 4 || orderDetail.status?.id === 5 ? (
                            <div className="alert alert-warning text-center" role="alert">
                                <i className="bi bi-lock-fill me-2"></i>
                                Đơn hàng đã <strong>{getStatusName(orderDetail.status.id)}</strong> và không thể thay đổi trạng thái.
                            </div>
                        ) : (
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Cập nhật trạng thái đơn hàng</label>
                                    <div className="d-flex gap-2"><select className="form-select" value={selectedOrderStatus} onChange={e => setSelectedOrderStatus(e.target.value)}><option value="1">Chờ xác nhận</option><option value="2">Đang chuẩn bị hàng</option><option value="3">Đang giao hàng</option><option value="4">Giao thành công</option><option value="5">Đã hủy</option><option value="6">Yêu cầu hủy</option></select><button className="btn btn-primary text-nowrap" onClick={() => handleUpdateOrderStatus(selectedOrderStatus)}>Lưu</button></div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Cập nhật trạng thái thanh toán</label>
                                    <div className="d-flex gap-2"><select className="form-select" value={selectedPaymentStatus} onChange={e => setSelectedPaymentStatus(e.target.value)}><option value="Chờ xác nhận">Chờ xác nhận</option><option value="Chưa thanh toán">Chưa thanh toán</option><option value="Đã thanh toán">Đã thanh toán</option></select><button className="btn btn-primary text-nowrap" onClick={() => handleUpdatePaymentStatus(selectedPaymentStatus)}>Lưu</button></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div></div></div>
            )}

            {modals.assignShipper && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content"><form onSubmit={handleAssignShipper}>
                    <div className="modal-header"><h5 className="modal-title">Phân công Shipper</h5><button type="button" className="btn-close" onClick={() => closeModal('assignShipper')}></button></div>
                    <div className="modal-body"><select className="form-select" required value={assignShipperForm.shipperId} onChange={e => setAssignShipperForm({...assignShipperForm, shipperId: e.target.value})}><option value="">-- Chọn Shipper --</option>{shippers.map(s => <option key={s.id} value={s.id}>{s.name} - {s.empCode}</option>)}</select></div>
                    <div className="modal-footer"><button type="submit" className="btn btn-primary w-100">Xác nhận</button></div>
                </form></div></div></div>
            )}

            {modals.user && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content"><form onSubmit={handleSaveUser}>
                    <div className="modal-header"><h5 className="modal-title">{userForm.id ? 'Sửa' : 'Thêm'} User</h5><button type="button" className="btn-close" onClick={() => closeModal('user')}></button></div>
                    <div className="modal-body"><input type="text" className="form-control mb-2" placeholder="Username" required disabled={!!userForm.id} value={userForm.username || ''} onChange={e => setUserForm({...userForm, username: e.target.value})} /><input type="email" className="form-control mb-2" placeholder="Email" required disabled={!!userForm.id} value={userForm.email || ''} onChange={e => setUserForm({...userForm, email: e.target.value})} /><input type="password" className="form-control mb-2" placeholder="Mật khẩu (bỏ trống nếu giữ nguyên)" value={userForm.password || ''} onChange={e => setUserForm({...userForm, password: e.target.value})} /><select className="form-select" value={userForm.role || 'ROLE_USER'} onChange={e => setUserForm({...userForm, role: e.target.value})}><option value="ROLE_USER">Người dùng</option><option value="ROLE_ADMIN">Admin</option></select></div>
                    <div className="modal-footer"><button type="submit" className="btn btn-primary w-100">Lưu</button></div>
                </form></div></div></div>
            )}

            {modals.shipper && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content"><form onSubmit={handleSaveShipper}>
                    <div className="modal-header"><h5 className="modal-title">{shipperForm.id ? 'Sửa' : 'Thêm'} Shipper</h5><button type="button" className="btn-close" onClick={() => closeModal('shipper')}></button></div>
                    <div className="modal-body"><input type="text" className="form-control mb-2" placeholder="Họ tên" required value={shipperForm.name || ''} onChange={e => setShipperForm({...shipperForm, name: e.target.value})} /><input type="text" className="form-control mb-2" placeholder="Số điện thoại" required value={shipperForm.phone || ''} onChange={e => setShipperForm({...shipperForm, phone: e.target.value})} /><input type="text" className="form-control" placeholder="Phương tiện" required value={shipperForm.vehicle || ''} onChange={e => setShipperForm({...shipperForm, vehicle: e.target.value})} /></div>
                    <div className="modal-footer"><button type="submit" className="btn btn-primary w-100">Lưu</button></div>
                </form></div></div></div>
            )}
        </div>
    );
}