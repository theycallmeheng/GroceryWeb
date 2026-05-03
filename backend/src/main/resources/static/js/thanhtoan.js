// Hàm tạo giao diện từng mặt hàng trong đơn hàng
function matHang(c) {
  return `
    <div class="mat-hang">
        <div>
            <span>
                <span>${c?.quantity}</span>
                <span>x</span>
                <span>${c.product?.name}</span>
            </span>
        </div>
        <span class="font-bold">${numberToVnd(c?.quantity * c?.product?.price)}</span>
    </div>
    `;
}

let totalAmount = 0; // Biến lưu tổng tiền để gửi khi đặt hàng

// Hàm tải giỏ hàng và tính tổng tiền
async function loadCart() {
  const carts = await getCartItemsService();
  console.log(carts);
  let total = 0;

  // Xóa nội dung cũ trước khi append để tránh bị lặp dữ liệu khi load lại
  $(".ds-mat-hang").html(""); 

  carts.map((c) => {
    $(".ds-mat-hang").append(matHang(c));
    total += parseInt(c?.quantity || 0) * parseInt(c?.product?.price || 0);
  });

  console.log("Tổng cộng:", total);
  totalAmount = total + 15000;
  
  // Hiển thị các loại tiền
  document.getElementById("tongTienHang").innerHTML = numberToVnd(total);
  document.getElementById("phiVanChuyen").innerHTML = numberToVnd(15000);
  document.getElementById("tongTien").innerHTML = numberToVnd(totalAmount);
}

// Hàm thực hiện đặt hàng
async function makeOrder() {
  // Lấy dữ liệu mới nhất từ các ô nhập liệu (nếu người dùng có sửa địa chỉ)
  const orderData = {
    phone: document.getElementById("sdt").value,
    address: document.getElementById("diachi").value,
    total: totalAmount, // Gửi kèm tổng tiền (bao gồm phí ship)
    deliveryTime: window.selectedDeliveryTime || '90_phut' // Gửi thêm thời gian giao hàng
  };

  const res = await createOrderService(orderData); // Truyền dữ liệu nếu service hỗ trợ
  console.log(res);
  
  if (res && res.id) {
    window.location.href = "/donhang.html?id=" + res.id;
  } else {
    alert("Có lỗi xảy ra khi đặt hàng!");
  }
}

// Hàm tải thông tin user lên các ô nhập liệu
async function loadUserInfo() {
  try {
    const user = await fetchUser();
    if (user) {
      // SỬA QUAN TRỌNG: Dùng .value cho cả SDT và Địa chỉ để người dùng có thể sửa được
      document.getElementById("sdt").value = user.phone || "";
      document.getElementById("diachi").value = user.address || "";
    }
  } catch (error) {
    console.error("Lỗi khi tải thông tin user:", error);
  }
}

// Chạy các hàm khi trang web tải xong
window.addEventListener("DOMContentLoaded", (event) => {
  loadUserInfo();
  loadCart();
});