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
let selectedPaymentMethod = 'COD'; // Mặc định là thanh toán khi nhận hàng

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
  
  updateQrCode();
}

// Hàm chọn phương thức thanh toán
window.chonPhuongThucThanhToan = function(element, method) {
  // Xóa class active ở tất cả các ô
  const options = document.querySelectorAll('.hinh-thuc-thanh-toan > div');
  options.forEach(opt => opt.classList.remove('active'));
  
  // Thêm class active cho ô vừa click
  element.classList.add('active');
  selectedPaymentMethod = method;

  // Hiển thị hoặc ẩn vùng mã QR
  if (method === 'QR') {
    document.getElementById('qrCodeContainer').style.display = 'block';
    updateQrCode();
  } else {
    document.getElementById('qrCodeContainer').style.display = 'none';
  }
}

function updateQrCode() {
    const bankId = "MB"; // Thay bằng mã ngân hàng của bạn (VD: MB, VCB, TCB)
    const accountNo = "0123456789"; // Thay bằng số tài khoản của bạn
    const accountName = "NGUYEN VAN A"; // Thay bằng tên chủ tài khoản (viết hoa không dấu)
    
    const sdt = document.getElementById("sdt").value || "Khach";
    const addInfo = "Thanh toan don hang SDT " + sdt; // Sử dụng SDT làm nội dung CK
    
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;
    
    const imgQrCode = document.getElementById("imgQrCode");
    if (imgQrCode) imgQrCode.src = qrUrl;
    
    const noiDungCk = document.getElementById("noiDungCk");
    if (noiDungCk) noiDungCk.innerText = addInfo;
}

// Hàm thực hiện đặt hàng
async function makeOrder() {
  // Lấy dữ liệu mới nhất từ các ô nhập liệu (nếu người dùng có sửa địa chỉ)
  const orderData = {
    phone: document.getElementById("sdt").value,
    address: document.getElementById("diachi").value,
    total: totalAmount, // Gửi kèm tổng tiền (bao gồm phí ship)
    deliveryTime: window.selectedDeliveryTime || '90_phut', // Gửi thêm thời gian giao hàng
    paymentMethod: selectedPaymentMethod // Gửi thêm thông tin chọn phương thức
  };

  const res = await createOrderService(orderData); // Truyền dữ liệu nếu service hỗ trợ
  console.log(res);
  
  if (res && res.id) {
    window.location.href = "/donhang?id=" + res.id;
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
      const sdtInput = document.getElementById("sdt");
      sdtInput.value = user.phone || "";
      document.getElementById("diachi").value = user.address || "";
      
      // Lắng nghe sự kiện để nếu KH nhập đổi số điện thoại, mã QR sẽ tự đổi nội dung theo
      sdtInput.addEventListener("input", updateQrCode);
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