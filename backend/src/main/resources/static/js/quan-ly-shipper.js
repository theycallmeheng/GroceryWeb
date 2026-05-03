// Lấy token xác thực của admin từ Local Storage
function getAdminToken() {
    // Thay 'token' bằng key thực tế bạn đang dùng để lưu JWT Token
    return localStorage.getItem("token"); 
}

// Hàm gọi API lấy danh sách Shipper
async function loadShippers() {
    try {
        const response = await fetch('http://localhost:8081/api/admin/shippers', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAdminToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const shippers = await response.json();
            renderShippers(shippers);
        } else {
            console.error("Lỗi API, mã trạng thái:", response.status);
            document.getElementById('shipper-list').innerHTML = 
                '<tr><td colspan="7" style="text-align: center; color: red;">Lỗi khi tải dữ liệu! Vui lòng kiểm tra quyền Admin.</td></tr>';
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        document.getElementById('shipper-list').innerHTML = 
            `<tr><td colspan="7" style="text-align: center; color: red;">Lỗi kết nối: ${error.message} (Hãy chắc chắn Backend 8081 đang chạy)</td></tr>`;
    }
}

// Hàm hiển thị dữ liệu ra bảng HTML
function renderShippers(shippers) {
    const tbody = document.getElementById('shipper-list');
    tbody.innerHTML = ''; // Xóa chữ "Đang tải dữ liệu..."

    if (shippers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Chưa có nhân viên giao hàng nào</td></tr>';
        return;
    }

    // Lặp qua mảng shipper và tạo các hàng (tr) cho bảng
    shippers.forEach(shipper => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${shipper.id}</td>
            <td><strong>${shipper.empCode}</strong></td>
            <td>${shipper.name}</td>
            <td>${shipper.phone}</td>
            <td>${shipper.address}</td>
            <td>${shipper.vehicle}</td>
            <td>
                <button class="btn btn-edit" onclick="alert('Chức năng sửa Shipper ${shipper.id}')">Sửa</button>
                <button class="btn btn-delete" onclick="alert('Chức năng xóa Shipper ${shipper.id}')">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Tự động gọi hàm loadShippers khi trang HTML vừa tải xong
window.addEventListener("DOMContentLoaded", () => {
    loadShippers();
});