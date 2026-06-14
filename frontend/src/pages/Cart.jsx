import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8081/api';
const COMBO_STORAGE_PREFIX = 'grocery_cart_combos';
const FREE_SHIPPING_THRESHOLD = 500000;

const createDefaultCombos = () => [{ id: crypto.randomUUID(), name: 'Combo 1', items: [] }];

const getComboStorageKey = (user) => {
    const userKey = user?.id || user?.username || user?.email || 'current';
    return `${COMBO_STORAGE_PREFIX}_${userKey}`;
};

const createInitialCombos = (storageKey) => {
    if (!storageKey) {
        return createDefaultCombos();
    }

    try {
        const savedCombos = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (Array.isArray(savedCombos) && savedCombos.length > 0) {
            return savedCombos;
        }
    } catch (error) {
        console.error('Lỗi đọc danh sách combo:', error);
    }

    return createDefaultCombos();
};

export default function Cart() {
    const [cartItems, setCartItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [combos, setCombos] = useState([]);
    const [comboStorageKey, setComboStorageKey] = useState('');
    const [selectedComboId, setSelectedComboId] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [ingredientQty, setIngredientQty] = useState(1);
    const [total, setTotal] = useState(0);
    const [isBuyingCombo, setIsBuyingCombo] = useState(false);
    const [showComboModal, setShowComboModal] = useState(false);
    const navigate = useNavigate();

    const selectedCombo = useMemo(
        () => combos.find(combo => combo.id === selectedComboId) || combos[0],
        [combos, selectedComboId]
    );

    const selectedComboTotal = useMemo(() => {
        if (!selectedCombo) return 0;
        return selectedCombo.items.reduce((sum, item) => {
            const product = products.find(p => p.id?.toString() === item.productId.toString());
            return sum + (product?.price || item.price || 0) * item.quantity;
        }, 0);
    }, [products, selectedCombo]);
    const freeShippingRemaining = Math.max(FREE_SHIPPING_THRESHOLD - total, 0);
    const freeShippingProgress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const hasFreeShipping = total >= FREE_SHIPPING_THRESHOLD;

    function authHeaders() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : null;
    }

    function calculateTotal(items) {
        const sum = items.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);
        setTotal(sum);
    }

    async function fetchCart() {
        const headers = authHeaders();
        if (!headers) {
            navigate('/dangnhap');
            return;
        }

        try {
            const res = await axios.get(`${API_BASE}/cartItems`, { headers });
            setCartItems(res.data);
            calculateTotal(res.data);
        } catch (error) {
            console.error('Lỗi tải giỏ hàng:', error);
        }
    }

    async function fetchProducts() {
        const headers = authHeaders();
        if (!headers) return;

        try {
            const res = await axios.get(`${API_BASE}/products`, { headers });
            setProducts(res.data);
        } catch (error) {
            console.error('Lỗi tải danh sách sản phẩm:', error);
        }
    }

    async function fetchCurrentUserCombos() {
        const headers = authHeaders();
        if (!headers) {
            navigate('/dangnhap');
            return;
        }

        try {
            const res = await axios.get(`${API_BASE}/users/me`, { headers });
            const storageKey = getComboStorageKey(res.data);
            const userCombos = createInitialCombos(storageKey);
            setComboStorageKey(storageKey);
            setCombos(userCombos);
            setSelectedComboId(userCombos[0]?.id || '');
        } catch (error) {
            console.error('Lỗi tải combo của người dùng:', error);
        }
    }

    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    useEffect(() => {
        void fetchCurrentUserCombos();
        void fetchCart();
        void fetchProducts();
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

    useEffect(() => {
        if (comboStorageKey && combos.length > 0) {
            localStorage.setItem(comboStorageKey, JSON.stringify(combos));
        }
    }, [comboStorageKey, combos]);

    const nextComboName = () => {
        const maxNumber = combos.reduce((max, combo) => {
            const match = combo.name.match(/^Combo\s+(\d+)$/i);
            return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
        return `Combo ${maxNumber + 1}`;
    };

    const handleCreateCombo = () => {
        if (!comboStorageKey) return;

        const newCombo = { id: crypto.randomUUID(), name: nextComboName(), items: [] };
        setCombos(prev => [...prev, newCombo]);
        setSelectedComboId(newCombo.id);
    };

    const handleSaveCartAsCombo = () => {
        if (!comboStorageKey) {
            window.dispatchEvent(new CustomEvent('showToast', {
                detail: { message: 'Chưa tải xong thông tin người dùng.', type: 'warning' }
            }));
            return;
        }

        if (cartItems.length === 0) {
            window.dispatchEvent(new CustomEvent('showToast', {
                detail: { message: 'Giỏ hàng đang trống, chưa thể lưu combo.', type: 'warning' }
            }));
            return;
        }

        const newCombo = {
            id: crypto.randomUUID(),
            name: nextComboName(),
            items: cartItems.map(item => ({
                productId: item.product?.id,
                quantity: item.quantity,
                name: item.product?.name,
                price: item.product?.price,
                image: item.product?.image,
                unit: item.product?.unit
            })).filter(item => item.productId)
        };

        setCombos(prev => [...prev, newCombo]);
        setSelectedComboId(newCombo.id);
        setShowComboModal(true);
        window.dispatchEvent(new CustomEvent('showToast', {
            detail: { message: 'Đã lưu giỏ hàng thành combo.', type: 'success' }
        }));
    };

    const handleRenameCombo = (comboId, name) => {
        setCombos(prev => prev.map(combo => (
            combo.id === comboId ? { ...combo, name } : combo
        )));
    };

    const handleDeleteCombo = (comboId) => {
        if (combos.length <= 1) {
            window.dispatchEvent(new CustomEvent('showToast', {
                detail: { message: 'Cần giữ lại ít nhất 1 combo.', type: 'warning' }
            }));
            return;
        }

        if (!window.confirm('Xóa combo này?')) return;

        const nextCombos = combos.filter(combo => combo.id !== comboId);
        setCombos(nextCombos);
        if (selectedComboId === comboId) {
            setSelectedComboId(nextCombos[0]?.id || '');
        }
    };

    const handleAddIngredient = () => {
        if (!selectedCombo || !selectedProductId) return;

        const product = products.find(p => p.id?.toString() === selectedProductId.toString());
        if (!product) return;

        const qty = Math.max(1, Number(ingredientQty) || 1);
        setCombos(prev => prev.map(combo => {
            if (combo.id !== selectedCombo.id) return combo;

            const existingItem = combo.items.find(item => item.productId.toString() === product.id.toString());
            if (existingItem) {
                return {
                    ...combo,
                    items: combo.items.map(item => (
                        item.productId.toString() === product.id.toString()
                            ? { ...item, quantity: item.quantity + qty }
                            : item
                    ))
                };
            }

            return {
                ...combo,
                items: [
                    ...combo.items,
                    {
                        productId: product.id,
                        quantity: qty,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        unit: product.unit
                    }
                ]
            };
        }));
        setSelectedProductId('');
        setIngredientQty(1);
    };

    const handleUpdateIngredient = (productId, quantity) => {
        const nextQuantity = Math.max(1, Number(quantity) || 1);
        setCombos(prev => prev.map(combo => (
            combo.id === selectedCombo.id
                ? {
                    ...combo,
                    items: combo.items.map(item => (
                        item.productId.toString() === productId.toString()
                            ? { ...item, quantity: nextQuantity }
                            : item
                    ))
                }
                : combo
        )));
    };

    const handleRemoveIngredient = (productId) => {
        setCombos(prev => prev.map(combo => (
            combo.id === selectedCombo.id
                ? { ...combo, items: combo.items.filter(item => item.productId.toString() !== productId.toString()) }
                : combo
        )));
    };

    const handleUpdateQuantity = async (id, currentQty, amount) => {
        const newQty = currentQty + amount;
        if (newQty < 1) return;

        const headers = authHeaders();
        try {
            await axios.put(`${API_BASE}/cartItems/${id}`, { quantity: newQty }, { headers });
            fetchCart();
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            console.error('Lỗi cập nhật số lượng:', error);
            alert('Lỗi cập nhật số lượng');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xóa sản phẩm này khỏi giỏ hàng?')) return;

        const headers = authHeaders();
        try {
            await axios.delete(`${API_BASE}/cartItems/${id}`, { headers });
            fetchCart();
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm:', error);
            alert('Lỗi khi xóa sản phẩm');
        }
    };

    const handleBuyCombo = async () => {
        if (!selectedCombo || selectedCombo.items.length === 0) {
            window.dispatchEvent(new CustomEvent('showToast', {
                detail: { message: 'Combo chưa có nguyên liệu.', type: 'warning' }
            }));
            return;
        }

        const headers = authHeaders();
        if (!headers) {
            navigate('/dangnhap');
            return;
        }

        setIsBuyingCombo(true);
        try {
            await Promise.all(cartItems.map(item => axios.delete(`${API_BASE}/cartItems/${item.id}`, { headers })));
            await Promise.all(selectedCombo.items.map(item => (
                axios.post(`${API_BASE}/cartItems`, {
                    productId: item.productId,
                    quantity: item.quantity
                }, { headers })
            )));
            await fetchCart();
            window.dispatchEvent(new Event('cartUpdated'));
            window.dispatchEvent(new CustomEvent('showToast', {
                detail: { message: 'Đã thêm combo vào giỏ hàng.', type: 'success' }
            }));
        } catch (error) {
            console.error('Lỗi khi mua combo:', error);
            window.dispatchEvent(new CustomEvent('showToast', {
                detail: { message: 'Lỗi khi mua combo.', type: 'danger' }
            }));
        } finally {
            setIsBuyingCombo(false);
        }
    };

    const getComboItemProduct = (item) => (
        products.find(product => product.id?.toString() === item.productId.toString()) || item
    );

    return (
        <div className="container-fluid py-5">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <h2 className="fw-bold mb-0">Giỏ hàng của bạn</h2>
                <div className="d-flex flex-wrap gap-2">
                    <button onClick={handleSaveCartAsCombo} className="btn btn-outline-success fw-bold" disabled={!comboStorageKey || cartItems.length === 0}>
                        <i className="bi bi-bookmark-plus me-2"></i>Lưu giỏ hàng thành combo
                    </button>
                    <button onClick={() => setShowComboModal(true)} className="btn btn-success fw-bold" disabled={!comboStorageKey}>
                        <i className="bi bi-collection me-2"></i>Combo
                    </button>
                </div>
            </div>

            {showComboModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0, 0, 0, 0.55)' }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Danh sách combo</h5>
                                <button type="button" className="btn-close" aria-label="Đóng" onClick={() => setShowComboModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-4">
                                    <div className="col-lg-4">
                                        <div className="d-flex gap-2 mb-3">
                                            <button onClick={handleCreateCombo} className="btn btn-success fw-bold flex-grow-1">
                                                <i className="bi bi-plus-circle me-2"></i>Tạo combo
                                            </button>
                                            <button onClick={handleSaveCartAsCombo} className="btn btn-outline-success fw-bold" disabled={!comboStorageKey || cartItems.length === 0}>
                                                <i className="bi bi-bookmark-plus"></i>
                                            </button>
                                        </div>
                                        <div className="d-grid gap-2">
                                            {combos.map(combo => (
                                                <button
                                                    key={combo.id}
                                                    onClick={() => setSelectedComboId(combo.id)}
                                                    className={`btn text-start d-flex justify-content-between align-items-center ${selectedCombo?.id === combo.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                >
                                                    <span className="fw-bold">{combo.name || 'Combo chưa đặt tên'}</span>
                                                    <span className="badge bg-light text-dark">{combo.items.length}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="col-lg-8">
                                        {selectedCombo ? (
                                            <>
                                                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                                                    <div className="flex-grow-1">
                                                        <label className="form-label fw-bold">Tên combo</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-lg fw-bold"
                                                            value={selectedCombo.name}
                                                            onChange={(e) => handleRenameCombo(selectedCombo.id, e.target.value)}
                                                        />
                                                    </div>
                                                    <button onClick={() => handleDeleteCombo(selectedCombo.id)} className="btn btn-outline-danger mt-4">
                                                        <i className="bi bi-trash me-2"></i>Xóa combo
                                                    </button>
                                                </div>

                                                <div className="row g-2 align-items-end mb-4">
                                                    <div className="col-md-7">
                                                        <label className="form-label fw-bold">Thêm mặt hàng</label>
                                                        <select
                                                            className="form-select"
                                                            value={selectedProductId}
                                                            onChange={(e) => setSelectedProductId(e.target.value)}
                                                        >
                                                            <option value="">Chọn sản phẩm</option>
                                                            {products.map(product => (
                                                                <option key={product.id} value={product.id}>
                                                                    {product.name} - {(product.price || 0).toLocaleString()} đ
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <label className="form-label fw-bold">Số lượng</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="form-control"
                                                            value={ingredientQty}
                                                            onChange={(e) => setIngredientQty(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <button onClick={handleAddIngredient} className="btn btn-primary w-100 fw-bold" disabled={!selectedProductId}>
                                                            <i className="bi bi-plus-lg me-2"></i>Thêm
                                                        </button>
                                                    </div>
                                                </div>

                                                {selectedCombo.items.length === 0 ? (
                                                    <div className="text-center bg-light rounded py-4 text-muted fw-bold">
                                                        Combo này chưa có nguyên liệu.
                                                    </div>
                                                ) : (
                                                    <div className="d-grid gap-2">
                                                        {selectedCombo.items.map(item => {
                                                            const product = getComboItemProduct(item);
                                                            return (
                                                                <div key={item.productId} className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border rounded bg-light">
                                                                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                                                                        <img
                                                                            src={product.image || 'https://placehold.co/100x100?text=No+Image'}
                                                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image'; }}
                                                                            alt={product.name}
                                                                            style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px' }}
                                                                        />
                                                                        <div>
                                                                            <div className="fw-bold">{product.name}</div>
                                                                            <div className="text-danger fw-bold">{(product.price || 0).toLocaleString()} đ</div>
                                                                        </div>
                                                                    </div>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        className="form-control text-center fw-bold"
                                                                        value={item.quantity}
                                                                        onChange={(e) => handleUpdateIngredient(item.productId, e.target.value)}
                                                                        style={{ width: '90px' }}
                                                                    />
                                                                    <button onClick={() => handleRemoveIngredient(item.productId)} className="btn btn-outline-danger">
                                                                        <i className="bi bi-x-lg"></i>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4 pt-3 border-top">
                                                    <div>
                                                        <span className="text-muted me-2">Tổng combo:</span>
                                                        <span className="fw-bold fs-4 text-primary">{selectedComboTotal.toLocaleString()} đ</span>
                                                    </div>
                                                    <button
                                                        onClick={handleBuyCombo}
                                                        disabled={isBuyingCombo || selectedCombo.items.length === 0}
                                                        className="btn btn-success btn-lg fw-bold"
                                                    >
                                                        {isBuyingCombo ? 'Đang mua...' : 'Mua combo'}
                                                        <i className="bi bi-cart-check ms-2"></i>
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-5 text-muted fw-bold">Chưa có combo nào.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4 bg-light rounded">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-5">
                                    <h5 className="text-muted">Giỏ hàng trống</h5>
                                    <Link to="/" className="btn btn-primary mt-3">Tiếp tục mua sắm</Link>
                                </div>
                            ) : (
                                cartItems.map(item => (
                                    <div key={item.id} className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom bg-white mb-2 rounded shadow-sm">
                                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                                            <img
                                                src={item.product?.image || 'https://placehold.co/100x100?text=No+Image'}
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image'; }}
                                                alt={item.product?.name}
                                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                                            />
                                            <span className="fw-bold fs-6">{item.product?.name}</span>
                                        </div>
                                        <div className="d-flex flex-wrap align-items-center justify-content-end gap-3">
                                            <div className="d-flex align-items-center bg-light border rounded overflow-hidden">
                                                <button onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)} className="btn btn-sm btn-light border-0 px-3 fw-bold">-</button>
                                                <span className="fw-bold px-3">{item.quantity}</span>
                                                <button onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)} className="btn btn-sm btn-light border-0 px-3 fw-bold">+</button>
                                            </div>
                                            <span className="fw-bold text-primary">{((item.product?.price || 0) * item.quantity).toLocaleString()} đ</span>
                                            <button onClick={() => handleDelete(item.id)} className="btn btn-sm btn-danger rounded d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 bg-dark text-white sticky-top" style={{ top: '80px' }}>
                        <div className="card-body p-4">
                            <h4 className="fw-bold mb-4">Tóm tắt đơn hàng</h4>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="text-light">Tổng tiền hàng:</span>
                                <span className="fw-bold fs-4 text-warning">{total.toLocaleString()} đ</span>
                            </div>
                            {cartItems.length > 0 && (
                                <div className={`rounded-3 p-3 mb-4 ${hasFreeShipping ? 'bg-success bg-opacity-25 border border-success' : 'bg-white bg-opacity-10 border border-secondary'}`}>
                                    <div className="d-flex align-items-start gap-2 mb-2">
                                        <i className={`bi ${hasFreeShipping ? 'bi-truck text-success' : 'bi-truck text-warning'} fs-5`}></i>
                                        <div className="flex-grow-1">
                                            <div className="fw-bold">
                                                {hasFreeShipping
                                                    ? 'Đơn hàng đã được miễn phí giao hàng'
                                                    : `Mua thêm ${freeShippingRemaining.toLocaleString()} đ nữa để được miễn phí giao hàng`}
                                            </div>
                                            <div className="small text-light opacity-75">
                                                Freeship cho đơn hàng từ {FREE_SHIPPING_THRESHOLD.toLocaleString()} đ
                                            </div>
                                        </div>
                                    </div>
                                    <div className="progress" style={{ height: '10px' }}>
                                        <div
                                            className={`progress-bar ${hasFreeShipping ? 'bg-success' : 'bg-warning'}`}
                                            role="progressbar"
                                            style={{ width: `${freeShippingProgress}%` }}
                                            aria-valuenow={freeShippingProgress}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        ></div>
                                    </div>
                                </div>
                            )}
                            <hr className="border-secondary mb-4" />
                            <Link to="/thanhtoan" className={`btn btn-primary w-100 py-3 fw-bold fs-5 shadow ${cartItems.length === 0 ? 'disabled' : ''}`}>
                                Tiến hành đặt hàng <i className="bi bi-arrow-right ms-2"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
