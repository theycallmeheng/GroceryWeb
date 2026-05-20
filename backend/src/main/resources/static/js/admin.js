document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    // Check if token exists
    if (!token) {
        window.location.href = '/dangnhap';
        return;
    }

    // Thiết lập xử lý menu
    setupMenu(token);

    // Lấy view từ URL parameter (ví dụ: ?view=users)
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    const initialView = viewParam ? viewParam + 'View' : 'dashboardView';

    // Đánh dấu active cho menu tương ứng
    const menuItems = document.querySelectorAll('#adminMenu a');
    menuItems.forEach(m => m.classList.remove('active'));
    const activeItem = Array.from(menuItems).find(m => m.getAttribute('data-target') === initialView);
    if (activeItem) {
        activeItem.classList.add('active');
    } else if (menuItems.length > 0) {
        menuItems[0].classList.add('active');
    }

    // Load view ban đầu theo cấu hình URL
    loadView(initialView, token);

    // Xử lý khi nhấn nút Trở lại / Tiến lên (Back/Forward) của trình duyệt
    window.addEventListener('popstate', function() {
        const params = new URLSearchParams(window.location.search);
        const vParam = params.get('view');
        const vId = vParam ? vParam + 'View' : 'dashboardView';
        
        document.querySelectorAll('#adminMenu a').forEach(m => m.classList.remove('active'));
        const aItem = Array.from(document.querySelectorAll('#adminMenu a')).find(m => m.getAttribute('data-target') === vId);
        if (aItem) aItem.classList.add('active');

        loadView(vId, token);
    });

    // Logout event listener
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/dangnhap';
    });
});

function setupMenu(token) {
    const menuItems = document.querySelectorAll('#adminMenu a');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            // Remove active class from all
            menuItems.forEach(m => m.classList.remove('active'));
            // Add active class to clicked
            this.classList.add('active');
            
            const targetView = this.getAttribute('data-target');
            
            // Thay đổi URL tương ứng với API/View đang gọi mà không load lại trang
            const viewName = targetView.replace('View', '');
            const newUrl = window.location.pathname + '?view=' + viewName;
            window.history.pushState({ path: newUrl }, '', newUrl);
            
            loadView(targetView, token);
        });
    });
}

function hideAllViews() {
    const views = document.querySelectorAll('.view-section');
    views.forEach(view => view.style.display = 'none');
    document.getElementById('error').style.display = 'none';
}

function loadView(viewId, token) {
    hideAllViews();
    document.getElementById('loading').style.display = 'block';

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    if (viewId === 'dashboardView') {
        fetchAdminData('/api/admin/dashboard', headers, (data) => {
            document.getElementById('msg').innerText = data.message;
            document.getElementById('totalUsers').innerText = data.totalUsers;
            document.getElementById('totalOrders').innerText = data.totalOrders;
            document.getElementById('dashboardView').style.display = 'block';
        });
    } else if (viewId === 'usersView') {
        fetchAdminData('/api/admin/users', headers, (data) => {
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = '';
            data.forEach(user => {
                tbody.innerHTML += `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.firstname || ''} ${user.lastname || ''}</td>
                        <td>${user.phone || ''}</td>
                        <td>${user.role}</td>
                        <td>
                            <button class="btn-warning" onclick="openEditUserModal(${user.id})" style="padding: 5px; cursor: pointer; border-radius: 4px; border: none; margin-right: 5px;">Sửa</button>
                            <button class="btn-danger" onclick="deleteUser(${user.id})" style="padding: 5px; cursor: pointer; background-color: #dc3545; color: white; border: none; border-radius: 4px;">Xóa</button>
                        </td>
                    </tr>
                `;
            });
            document.getElementById('usersView').style.display = 'block';
        });
    } else if (viewId === 'ordersView') {
        fetchAdminData('/api/admin/orders', headers, (data) => {
            const tbody = document.getElementById('ordersTableBody');
            tbody.innerHTML = '';

            const statuses = [
                { id: 1, name: 'Chờ xác nhận' },
                { id: 2, name: 'Đang chuẩn bị hàng' },
                { id: 3, name: 'Đang giao hàng' },
                { id: 4, name: 'Giao thành công' },
                { id: 5, name: 'Đã hủy' }
            ];

            data.forEach(order => {
                let customerName = order.users ? order.users.username : 'N/A';
                if (order.users && order.users.firstname && order.users.lastname) {
                    customerName = `${order.users.firstname} ${order.users.lastname} (${order.users.username})`;
                }

                // Lấy ID trạng thái, mặc định là 1 (Chờ xác nhận)
                const statusId = order.status ? (order.status.id || order.status) : 1;
                // Tìm đối tượng trạng thái từ danh sách đã định nghĩa
                const statusObj = statuses.find(s => s.id === parseInt(statusId));
                // Lấy tên trạng thái, có fallback
                const statusName = statusObj ? statusObj.name : 'Trạng thái không xác định';

                tbody.innerHTML += `
                    <tr>
                        <td>${order.id}</td>
                        <td>${customerName}</td>
                        <td>${order.total}</td>
                        <td>${statusName}</td>
                        <td>${order.shipper ? order.shipper.name : '<span style="color:red">Chưa phân công</span>'}</td>
                        <td>
                            <button class="btn-info" onclick="viewOrderDetails(${order.id})" style="padding: 5px; cursor: pointer;">Chi tiết</button>
                            <button class="btn-warning" onclick="openShipperModal(${order.id})" style="padding: 5px; cursor: pointer;">Phân công</button>
                        </td>
                    </tr>
                `;
            });
            document.getElementById('ordersView').style.display = 'block';
        });
    } else if (viewId === 'productsView') {
        fetchAdminData('/api/admin/products', headers, (data) => {
            const tbody = document.getElementById('productsTableBody');
            tbody.innerHTML = '';
            data.forEach(product => {
                tbody.innerHTML += `
                    <tr>
                        <td>${product.id}</td>
                        <td>${product.name}</td>
                        <td>${product.price}</td>
                        <td>${product.category ? product.category.name : 'N/A'}</td>
                        <td><strong>${product.quantity || 0}</strong></td>
                        <td>
                            <button class="btn-warning" onclick="openEditProductModal(${product.id})" style="padding: 5px; cursor: pointer; border-radius: 4px; border: none; margin-right: 5px;">Sửa</button>
                            <button class="btn-info" onclick="openStockModal(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.quantity || 0}, ${product.price})" style="padding: 5px; cursor: pointer; border-radius: 4px; border: none; margin-right: 5px; background-color: #17a2b8; color: white;">Nhập hàng</button>
                            <button class="btn-danger" onclick="deleteProduct(${product.id})" style="padding: 5px; cursor: pointer; background-color: #dc3545; color: white; border: none; border-radius: 4px;">Xóa</button>
                        </td>
                    </tr>
                `;
            });
            document.getElementById('productsView').style.display = 'block';
        });
    } else if (viewId === 'revenueView') {
        // Lấy trực tiếp dữ liệu từ bảng Sản phẩm (Đã được Server lưu sẵn Doanh thu)
        fetchAdminData('/api/products', headers, (products) => {
            let totalRevenue = 0;
            let totalProfit = 0;

            const tbody = document.getElementById('revenueTableBody');
            tbody.innerHTML = '';

            // Lọc ra những sản phẩm đã từng được bán (soldQuantity > 0)
            const soldProducts = products.filter(p => p.soldQuantity && p.soldQuantity > 0);

            soldProducts.forEach(p => {
                const rev = p.revenue || 0;
                const prof = p.profit || 0;
                const qty = p.soldQuantity || 0;
                
                totalRevenue += rev;
                totalProfit += prof;

                tbody.innerHTML += `
                    <tr>
                        <td>${p.name}</td>
                        <td>${qty}</td>
                        <td>${rev.toLocaleString()} VNĐ</td>
                        <td>${prof.toLocaleString()} VNĐ</td>
                    </tr>
                `;
            });

            document.getElementById('revTotalRevenue').innerText = totalRevenue.toLocaleString() + ' VNĐ';
            document.getElementById('revTotalProfit').innerText = totalProfit.toLocaleString() + ' VNĐ';

            document.getElementById('revenueView').style.display = 'block';
        });
    } else if (viewId === 'shippersView') {
        fetchAdminData('/api/admin/shippers', headers, (data) => {
            const tbody = document.getElementById('shippersTableBody');
            tbody.innerHTML = '';
            data.forEach(shipper => {
                tbody.innerHTML += `
                    <tr>
                        <td>${shipper.id}</td>
                        <td><strong>${shipper.empCode}</strong></td>
                        <td>${shipper.name}</td>
                        <td>${shipper.phone}</td>
                            <td>${shipper.address || ''}</td>
                        <td>${shipper.vehicle}</td>
                            <td>
                                <button class="btn-warning" onclick="openEditShipperModal(${shipper.id})" style="padding: 5px; cursor: pointer; border-radius: 4px; border: none; margin-right: 5px;">Sửa</button>
                                <button class="btn-danger" onclick="deleteShipper(${shipper.id})" style="padding: 5px; cursor: pointer; background-color: #dc3545; color: white; border: none; border-radius: 4px;">Xóa</button>
                            </td>
                    </tr>
                `;
            });
            document.getElementById('shippersView').style.display = 'block';
        });
    }
}

async function fetchAdminData(endpoint, headers, callback) {
    try {
        const response = await fetch(`http://localhost:8081${endpoint}`, {
            method: 'GET',
            headers: headers
        });

        document.getElementById('loading').style.display = 'none';

        if (response.ok) {
            const data = await response.json();
            callback(data);
        } else if (response.status === 401 || response.status === 403) {
            const errorElem = document.getElementById('error');
            errorElem.innerText = 'Bạn không có quyền truy cập vào trang quản trị!';
            errorElem.style.display = 'block';
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        } else {
            document.getElementById('error').innerText = 'Có lỗi xảy ra: ' + response.statusText;
            document.getElementById('error').style.display = 'block';
        }
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').innerText = 'Lỗi kết nối Server: ' + error.message;
        document.getElementById('error').style.display = 'block';
    }
}

// === CÁC HÀM XỬ LÝ PHÂN CÔNG SHIPPER ===
function openShipperModal(orderId) {
    document.getElementById('modalOrderId').innerText = orderId;
    
    const token = localStorage.getItem('token');
    fetch('http://localhost:8081/api/admin/shippers', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(shippers => {
        const select = document.getElementById('modalShipperSelect');
        select.innerHTML = '<option value="">-- Chọn Shipper --</option>';
        shippers.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.name} - ${s.empCode}</option>`;
        });
        document.getElementById('assignShipperModal').style.display = 'block';
    });
}

function closeShipperModal() {
    document.getElementById('assignShipperModal').style.display = 'none';
}

function submitAssignShipper() {
    const orderId = document.getElementById('modalOrderId').innerText;
    const shipperId = document.getElementById('modalShipperSelect').value;
    if (!shipperId) {
        alert('Vui lòng chọn Shipper');
        return;
    }
    
    const token = localStorage.getItem('token');
    fetch(`http://localhost:8081/api/admin/orders/${orderId}/assign-shipper`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shipperId: parseInt(shipperId) })
    })
    .then(res => {
        if (res.ok) {
            alert('Phân công Shipper thành công!');
            closeShipperModal();
            loadView('ordersView', token); // Tải lại bảng để update UI
        } else {
            alert('Lỗi khi phân công Shipper');
        }
    });
}

// === CÁC HÀM XỬ LÝ NHẬP HÀNG TỒN KHO ===
function calculateImportPrice(sellingPrice) {
    if (sellingPrice >= 500000) return sellingPrice - 100000;
    if (sellingPrice >= 300000) return sellingPrice - 70000;
    if (sellingPrice >= 200000) return sellingPrice - 60000;
    if (sellingPrice >= 100000) return sellingPrice - 30000;
    if (sellingPrice >= 50000) return sellingPrice - 20000;
    if (sellingPrice >= 30000) return sellingPrice - 10000;
    if (sellingPrice >= 10000) return sellingPrice - 5000;
    return sellingPrice - 3000;
}

function openStockModal(id, name, currentQuantity, price = 0) {
    document.getElementById('stockProductId').innerText = id;
    document.getElementById('stockProductName').value = name;
    const importPrice = Math.max(0, calculateImportPrice(price || 0));
    document.getElementById('stockImportPrice').value = importPrice;
    document.getElementById('currentStock').value = currentQuantity || 0;
    document.getElementById('addStockQty').value = 1;
    document.getElementById('stockModal').style.display = 'block';
}

function closeStockModal() {
    document.getElementById('stockModal').style.display = 'none';
}

function submitAddStock() {
    const id = document.getElementById('stockProductId').innerText;
    const qty = parseInt(document.getElementById('addStockQty').value, 10);
    const importPriceRaw = document.getElementById('stockImportPrice').value.trim();
    const importPrice = importPriceRaw === '' ? null : parseFloat(importPriceRaw);
    const token = localStorage.getItem('token');

    if (!qty || qty < 1 || (importPrice !== null && (isNaN(importPrice) || importPrice < 0))) {
        alert('Vui lòng nhập số lượng hợp lệ và giá nhập hợp lệ (hoặc để trống để tự động tính).');
        return;
    }

    const importPriceParam = importPrice === null ? '' : `&importPrice=${importPrice}`;
    fetch(`http://localhost:8081/api/products/${id}/stock?quantity=${qty}${importPriceParam}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
        if (res.ok) {
            alert('Nhập hàng thành công!');
            closeStockModal();
            loadView('productsView', token); // Tải lại bảng sản phẩm để cập nhật số lượng
        } else {
            alert('Có lỗi xảy ra khi nhập hàng.');
        }
    }).catch(err => console.error('Lỗi:', err));
}

// === CÁC HÀM XỬ LÝ CRUD NGƯỜI DÙNG ===
let currentUserId = null;

function openAddUserModal() {
    currentUserId = null;
    document.getElementById('modalUserTitle').innerText = 'Thêm Người Dùng Mới';
    document.getElementById('userUsername').value = '';
    document.getElementById('userUsername').disabled = false; // Cho phép sửa khi thêm mới
    document.getElementById('userEmail').value = '';
    document.getElementById('userEmail').disabled = false; // Cho phép sửa khi thêm mới
    document.getElementById('userPassword').value = '';
    document.getElementById('userPasswordGroup').style.display = 'block';
    document.getElementById('userLastname').value = '';
    document.getElementById('userFirstname').value = '';
    document.getElementById('userPhone').value = '';
    document.getElementById('userRole').value = 'ROLE_USER';
    document.getElementById('userModal').style.display = 'block';
}

function openEditUserModal(id) {
    currentUserId = id;
    document.getElementById('modalUserTitle').innerText = 'Chỉnh Sửa Người Dùng';
    const token = localStorage.getItem('token');
    
    fetch(`http://localhost:8081/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(users => {
        const u = users.find(x => x.id === id);
        if (u) {
            document.getElementById('userUsername').value = u.username || '';
            document.getElementById('userUsername').disabled = true; // Không cho sửa username
            document.getElementById('userEmail').value = u.email || '';
            document.getElementById('userEmail').disabled = true; // Không cho sửa email
            document.getElementById('userPasswordGroup').style.display = 'none'; // Không cho đổi mk ở form này
            document.getElementById('userLastname').value = u.lastname || '';
            document.getElementById('userFirstname').value = u.firstname || '';
            document.getElementById('userPhone').value = u.phone || '';
            document.getElementById('userRole').value = u.role || 'ROLE_USER';
            document.getElementById('userModal').style.display = 'block';
        }
    });
}

function closeUserFormModal() {
    document.getElementById('userModal').style.display = 'none';
}

function saveUser() {
    const data = {
        username: document.getElementById('userUsername').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPassword').value,
        lastname: document.getElementById('userLastname').value,
        firstname: document.getElementById('userFirstname').value,
        phone: document.getElementById('userPhone').value,
        role: document.getElementById('userRole').value
    };

    const token = localStorage.getItem('token');
    const url = currentUserId ? `http://localhost:8081/api/admin/users/${currentUserId}` : `http://localhost:8081/api/admin/users`;
    const method = currentUserId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(async res => {
        if (res.ok) {
            alert(currentUserId ? 'Cập nhật Người dùng thành công!' : 'Thêm Người dùng thành công!');
            closeUserFormModal();
            loadView('usersView', token); 
        } else {
            const msg = await res.text();
            alert('Lỗi: ' + msg);
        }
    });
}

function deleteUser(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa Người dùng này? Mọi đơn hàng liên quan có thể bị ảnh hưởng!')) return;
    const token = localStorage.getItem('token');
    fetch(`http://localhost:8081/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (res.ok) {
            alert('Xóa Người dùng thành công!');
            loadView('usersView', token);
        } else {
            alert('Lỗi khi xóa Người dùng');
        }
    });
}

// === CÁC HÀM XỬ LÝ CRUD SẢN PHẨM ===
let currentProductId = null;

function openAddProductModal() {
    currentProductId = null;
    document.getElementById('modalProductTitle').innerText = 'Thêm Sản Phẩm Mới';
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('productCategory').value = '1';
    document.getElementById('productModal').style.display = 'block';
}

function openEditProductModal(id) {
    currentProductId = id;
    document.getElementById('modalProductTitle').innerText = 'Chỉnh sửa Sản Phẩm';
    const token = localStorage.getItem('token');
    
    fetch(`http://localhost:8081/api/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(products => {
        const p = products.find(x => x.id === id);
        if (p) {
            document.getElementById('productName').value = p.name || '';
            document.getElementById('productPrice').value = p.price || '';
            document.getElementById('productImage').value = p.image || '';
            document.getElementById('productCategory').value = p.category ? p.category.id : '1';
            document.getElementById('productModal').style.display = 'block';
        }
    });
}

function closeProductFormModal() {
    document.getElementById('productModal').style.display = 'none';
}

function saveProduct() {
    const name = document.getElementById('productName').value.trim();
    const priceRaw = document.getElementById('productPrice').value;
    const image = document.getElementById('productImage').value.trim();
    const categoryId = parseInt(document.getElementById('productCategory').value);
    const price = parseFloat(priceRaw);

    if (!name || !image || !categoryId || isNaN(price) || price < 0) {
        alert('Vui lòng nhập đủ Tên sản phẩm, URL hình ảnh, Giá bán ra và Danh mục hợp lệ.');
        return;
    }

    const data = {
        name: name,
        price: price,
        image: image,
        category: { id: categoryId }
    };

    const token = localStorage.getItem('token');
    const url = currentProductId ? `http://localhost:8081/api/admin/products/${currentProductId}` : `http://localhost:8081/api/admin/products`;
    const method = currentProductId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (res.ok) {
            alert(currentProductId ? 'Cập nhật Sản phẩm thành công!' : 'Thêm Sản phẩm thành công!');
            closeProductFormModal();
            loadView('productsView', token); 
        } else {
            alert('Lỗi khi lưu Sản phẩm');
        }
    });
}

function deleteProduct(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa Sản phẩm này?')) return;
    const token = localStorage.getItem('token');
    fetch(`http://localhost:8081/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (res.ok) {
            alert('Xóa Sản phẩm thành công!');
            loadView('productsView', token);
        } else {
            alert('Lỗi khi xóa Sản phẩm');
        }
    });
}

// === CÁC HÀM XỬ LÝ CHI TIẾT & TRẠNG THÁI ĐƠN HÀNG ===
function viewOrderDetails(orderId) {
    document.getElementById('detailOrderId').innerText = orderId;
    const token = localStorage.getItem('token');
    
    fetch(`http://localhost:8081/api/admin/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(order => {
        // Render nội dung chi tiết
        let content = `
            <p><strong>Khách hàng:</strong> ${order.users ? order.users.username : 'N/A'}</p>
            <p><strong>Số điện thoại:</strong> ${order.users && order.users.phone ? order.users.phone : 'N/A'}</p>
            <p><strong>Địa chỉ giao:</strong> ${order.address || (order.users && order.users.address ? order.users.address : 'N/A')}</p>
            <p><strong>Tổng tiền:</strong> ${order.total} VNĐ</p>
            <p><strong>Shipper phụ trách:</strong> ${order.shipper ? order.shipper.name + ' (' + order.shipper.phone + ')' : 'Chưa có'}</p>
            <h4>Danh sách sản phẩm:</h4>
            <table class="admin-table" style="width: 100%; margin-top: 10px;">
                <thead>
                    <tr>
                        <th style="text-align: left;">Sản phẩm</th>
                        <th style="text-align: center;">Số lượng</th>
                        <th style="text-align: right;">Đơn giá</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        const items = order.orderItems || order.orderDetails || order.items || [];
        if (items.length > 0) {
            items.forEach(item => {
                const itemPrice = item.price || (item.product ? item.product.price : 'N/A');
                content += `
                    <tr>
                        <td style="text-align: left;">${item.product ? item.product.name : 'Sản phẩm'}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">${itemPrice} VNĐ</td>
                    </tr>
                `;
            });
        } else {
            content += `<tr><td colspan="3" style="text-align: center;">Không có thông tin chi tiết sản phẩm.</td></tr>`;
        }
        content += `</tbody></table>`;
        
        document.getElementById('orderDetailContent').innerHTML = content;
        
        const statuses = [
            { id: 1, name: 'Chờ xác nhận' },
            { id: 2, name: 'Đang chuẩn bị hàng' },
            { id: 3, name: 'Đang giao hàng' },
            { id: 4, name: 'Giao thành công' },
            { id: 5, name: 'Đã hủy' }
        ];

        const select = document.getElementById('modalStatusSelect');
        
        let currentStatusId = 1;
        if (order.status) {
            if (typeof order.status === 'object' && order.status.id != null) {
                currentStatusId = parseInt(order.status.id);
            } else if (!isNaN(parseInt(order.status))) {
                currentStatusId = parseInt(order.status);
            }
        }
        
        let optionsHtml = '';
        statuses.forEach(s => {
            const isSelected = (currentStatusId === s.id) ? 'selected' : '';
            optionsHtml += `<option value="${s.id}" ${isSelected}>${s.name}</option>`;
        });
        select.innerHTML = optionsHtml;
        
        // Khóa chức năng cập nhật nếu đơn hàng đã hủy hoặc đã giao thành công
        const updateBtn = document.querySelector('#orderDetailModal button[onclick="submitUpdateStatus()"]');
        if (currentStatusId === 5 || currentStatusId === 4) {
            select.disabled = true;
            if (updateBtn) updateBtn.style.display = 'none';
        } else {
            select.disabled = false;
            if (updateBtn) updateBtn.style.display = 'inline-block';
        }
        
        document.getElementById('orderDetailModal').style.display = 'block';
    });
}

function closeOrderDetailModal() {
    document.getElementById('orderDetailModal').style.display = 'none';
}

function submitUpdateStatus() {
    const orderId = document.getElementById('detailOrderId').innerText;
    const statusId = document.getElementById('modalStatusSelect').value;
    
    const token = localStorage.getItem('token');
    // Truyền statusId qua cả Query Parameter (để phòng backend dùng @RequestParam) và Body
    fetch(`http://localhost:8081/api/orders/${orderId}/status?statusId=${statusId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statusId: parseInt(statusId) })
    })
    .then(async res => {
        if (res.ok) {
            alert('Cập nhật trạng thái thành công!');
            closeOrderDetailModal();
            loadView('ordersView', token); // Tải lại bảng để update UI
        } else {
            let errMsg = await res.text();
            try {
                const errObj = JSON.parse(errMsg);
                errMsg = errObj.message || errObj.error || errMsg;
            } catch(e) {}
            alert('Lỗi khi cập nhật trạng thái: ' + errMsg);
        }
    });
}

// === CÁC HÀM XỬ LÝ CRUD SHIPPER ===
let currentShipperId = null;

function openAddShipperModal() {
    currentShipperId = null;
    document.getElementById('modalShipperTitle').innerText = 'Thêm Shipper Mới';
    document.getElementById('shipperEmpCode').value = '';
    document.getElementById('empCodeGroup').style.display = 'none'; // Ẩn khi thêm mới
    document.getElementById('shipperName').value = '';
    document.getElementById('shipperPhone').value = '';
    document.getElementById('shipperAddress').value = '';
    document.getElementById('shipperVehicle').value = '';
    document.getElementById('shipperModal').style.display = 'block';
}

function openEditShipperModal(id) {
    currentShipperId = id;
    document.getElementById('modalShipperTitle').innerText = 'Chỉnh sửa Shipper';
    const token = localStorage.getItem('token');
    document.getElementById('empCodeGroup').style.display = 'block'; // Hiện lại khi sửa
    
    fetch(`http://localhost:8081/api/admin/shippers`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(shippers => {
        const s = shippers.find(x => x.id === id);
        if (s) {
            document.getElementById('shipperEmpCode').value = s.empCode || '';
            document.getElementById('shipperName').value = s.name || '';
            document.getElementById('shipperPhone').value = s.phone || '';
            document.getElementById('shipperAddress').value = s.address || '';
            document.getElementById('shipperVehicle').value = s.vehicle || '';
            document.getElementById('shipperModal').style.display = 'block';
        }
    });
}

function closeShipperFormModal() {
    document.getElementById('shipperModal').style.display = 'none';
}

function saveShipper() {
    const data = {
        empCode: document.getElementById('shipperEmpCode').value,
        name: document.getElementById('shipperName').value,
        phone: document.getElementById('shipperPhone').value,
        address: document.getElementById('shipperAddress').value,
        vehicle: document.getElementById('shipperVehicle').value
    };

    const token = localStorage.getItem('token');
    // Nếu currentShipperId có giá trị thì gọi API PUT (Cập nhật), ngược lại gọi POST (Thêm mới)
    const url = currentShipperId ? `http://localhost:8081/api/admin/shippers/${currentShipperId}` : `http://localhost:8081/api/admin/shippers`;
    const method = currentShipperId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (res.ok) {
            alert(currentShipperId ? 'Cập nhật Shipper thành công!' : 'Thêm Shipper thành công!');
            closeShipperFormModal();
            loadView('shippersView', token); // Tải lại danh sách shipper
        } else {
            alert('Lỗi khi lưu Shipper');
        }
    });
}

function deleteShipper(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa Shipper này?')) return;
    const token = localStorage.getItem('token');
    fetch(`http://localhost:8081/api/admin/shippers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (res.ok) {
            alert('Xóa Shipper thành công!');
            loadView('shippersView', token); // Tải lại danh sách shipper
        } else {
            alert('Lỗi khi xóa Shipper');
        }
    });
}
