const khung = document.querySelector(".khung"),
  dangKy = document.querySelector(".dangky-link"),
  dangNhap = document.querySelector(".dangnhap-link");

// js code xuất hiện đăng ký và đăng nhập
dangKy.addEventListener("click", () => {
  khung.classList.add("active");
});
dangNhap.addEventListener("click", () => {
  khung.classList.remove("active");
});

// kiểm tra định dạng email
const kiemTraEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

//kiểm tra các trường nhập của đăng nhập
function xacnhan(event) {
  var giatriemail = document.getElementById("email").value.trim();
  var giatrimatkhau = document.getElementById("matkhau").value.trim();
  var email = document.getElementById("email");
  var matkhau = document.getElementById("matkhau");

  if (giatriemail == "") {
    email.style.border = "1px solid #ff8471";
    loi("loi_email", "Email không được bỏ trống");
  } else if (!kiemTraEmail(giatriemail)) {
    email.style.border = "1px solid #ff8471";
    loi("loi_email", "Email sai");
  } else {
    email.style.border = "1px solid #7b5be4";
    loi("loi_email", "");
  }

  if (giatrimatkhau == "") {
    matkhau.style.border = "1px solid #ff8471";
    loi("loi_mat_khau", "Mật khẩu không được bỏ trống");
  } else if (giatrimatkhau.length < 8) {
    matkhau.style.border = "1px solid #ff8471";
    loi("loi_mat_khau", "Mật khẩu phải nhiều hơn 8 kí tự");
  } else {
    matkhau.style.border = "1px solid #7b5be4";
    loi("loi_mat_khau", "");
  }

  if (
    giatriemail == "" ||
    giatrimatkhau == "" ||
    !kiemTraEmail(giatriemail) ||
    giatrimatkhau.length < 8
  ) {
    return false;
  } else {
    return true;
  }
}

function loi(id, message) {
  document.getElementById(id).innerHTML = message;
}

//kiểm tra các trường nhập của đăng ký
function xacnhandangky(event) {
  if (event) event.preventDefault();

  const giatriemaildangky = document.getElementById("emaildangky").value.trim();
  const giatritendangky = document.getElementById("tendangky").value.trim();
  const giatrimatkhaudangky = document.getElementById("matkhaudangky").value.trim();
  const giatrimatkhaudangkynhaplai = document.getElementById("matkhaudangkynhaplai").value.trim();
  const hodem = document.getElementById("hodem") ? document.getElementById("hodem").value.trim() : "";
  const ten = document.getElementById("ten") ? document.getElementById("ten").value.trim() : "";
  const sodienthoai = document.getElementById("sodienthoai") ? document.getElementById("sodienthoai").value.trim() : "";
  const diachi = document.getElementById("diachi") ? document.getElementById("diachi").value.trim() : "";

  let isValid = true;

  const checkField = (id, value, errorId, emptyMsg) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (value === "") {
      el.style.border = "1px solid #ff8471";
      loidangky(errorId, emptyMsg);
      isValid = false;
    } else {
      el.style.border = "1px solid #7b5be4";
      loidangky(errorId, "");
    }
  };

  // Kiểm tra email
  if (giatriemaildangky === "") {
    document.getElementById("emaildangky").style.border = "1px solid #ff8471";
    loidangky("loi_emaildangky", "Email không được để trống");
    isValid = false;
  } else if (!kiemTraEmail(giatriemaildangky)) {
    document.getElementById("emaildangky").style.border = "1px solid #ff8471";
    loidangky("loi_emaildangky", "Email sai định dạng");
    isValid = false;
  } else {
    document.getElementById("emaildangky").style.border = "1px solid #7b5be4";
    loidangky("loi_emaildangky", "");
  }

  checkField("tendangky", giatritendangky, "loi_tendangky", "Username không được để trống");

  // Kiểm tra mật khẩu
  if (giatrimatkhaudangky === "") {
    document.getElementById("matkhaudangky").style.border = "1px solid #ff8471";
    loidangky("loi_mat_khaudangky", "Mật khẩu không được để trống");
    isValid = false;
  } else if (giatrimatkhaudangky.length < 8) {
    document.getElementById("matkhaudangky").style.border = "1px solid #ff8471";
    loidangky("loi_mat_khaudangky", "Mật khẩu phải nhiều hơn 8 kí tự");
    isValid = false;
  } else {
    document.getElementById("matkhaudangky").style.border = "1px solid #7b5be4";
    loidangky("loi_mat_khaudangky", "");
  }

  // Kiểm tra xác nhận mật khẩu
  if (giatrimatkhaudangkynhaplai === "") {
    document.getElementById("matkhaudangkynhaplai").style.border = "1px solid #ff8471";
    loidangky("loi_mat_khaudangkynhaplai", "Vui lòng xác nhận mật khẩu");
    isValid = false;
  } else if (giatrimatkhaudangkynhaplai !== giatrimatkhaudangky) {
    document.getElementById("matkhaudangkynhaplai").style.border = "1px solid #ff8471";
    loidangky("loi_mat_khaudangkynhaplai", "Mật khẩu xác nhận không khớp");
    isValid = false;
  } else {
    document.getElementById("matkhaudangkynhaplai").style.border = "1px solid #7b5be4";
    loidangky("loi_mat_khaudangkynhaplai", "");
  }

  checkField("hodem", hodem, "loi_hodem", "Họ đệm không được để trống");
  checkField("ten", ten, "loi_ten", "Tên không được để trống");
  checkField("sodienthoai", sodienthoai, "loi_sodienthoai", "Số điện thoại không được để trống");
  checkField("diachi", diachi, "loi_diachi", "Địa chỉ không được để trống");

  if (isValid) {
    dangky();
  }
  return isValid;
}

function loidangky(id, message) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = message;
}
const api = "http://localhost:8081";

async function dangnhap(event) {
  event.preventDefault();
  fetch(`http://localhost:8081/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: document.getElementById("email").value.trim().toLowerCase(),
      password: document.getElementById("matkhau").value,
    }),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("Đăng nhập thất bại");
      }
      return res.json();
    })
    .then((dt) => {
      if (!dt || !dt.token) {
        throw new Error("Thiếu token đăng nhập");
      }
      localStorage.setItem("token", dt.token);
      localStorage.setItem("role", dt.role);
      
      // navigation dựa trên role
      if (dt.role === "ROLE_ADMIN") {
          window.location.href = "admin.html";
      } else {
          window.location.href = "index.html";
      }
    })
    .catch((error) => {
      console.error(error);
      loidangky("loi_email", "Sai email/username hoặc mật khẩu");
    });
}
async function dangky() {
  try {
    const res = await fetch(`http://localhost:8081/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: document.getElementById("emaildangky").value.trim(),
        username: document.getElementById("tendangky").value.trim(),
        password: document.getElementById("matkhaudangky").value,
        firstname: document.getElementById("ten").value.trim(),
        lastname: document.getElementById("hodem").value.trim(),
        phone: document.getElementById("sodienthoai").value.trim(),
        address: document.getElementById("diachi").value.trim(),
      }),
    });

    if (res.ok) {
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      window.location.href = "dangnhap.html";
    } else {
      const data = await res.text();
      
      // Bắt chữ từ Backend để hiển thị lỗi đỏ xuống ngay dưới ô nhập
      if (data.includes("Username")) {
        document.getElementById("tendangky").style.border = "1px solid #ff8471";
        loidangky("loi_tendangky", data);
      } else if (data.includes("Email")) {
        document.getElementById("emaildangky").style.border = "1px solid #ff8471";
        loidangky("loi_emaildangky", data);
      } else if (data.includes("Số điện thoại")) {
        document.getElementById("sodienthoai").style.border = "1px solid #ff8471";
        loidangky("loi_sodienthoai", data);
      } else {
        alert("Đăng ký thất bại: " + data);
      }
    }
  } catch (error) {
    alert("Lỗi kết nối đến server!");
  }
}
