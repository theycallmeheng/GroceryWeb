let perPage = 20;
let page = 1;
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
if (urlParams.has("page")) page = Number(urlParams.get("page"));

let start = (page - 1) * perPage;
let end = perPage * page - 1;

let lengthProduct = 0;
let numberPage = 0;

const phantrang = document.getElementById("phan-trang");
const phantrang1 = document.getElementById("phan-trang-1");

let user;
async function load() {
  user = await fetchUser();
  document.getElementById("gioHangSL").innerText = user.userCartItems.length;
}
load();

function isInCart(productId) {
  for (let i = 0; i < user?.userCartItems?.length; i++) {
    if (user.userCartItems[i].product.id === productId) return true;
  }
  return false;
}

const dsSanPham = document.getElementById("ds-san-pham");

async function addCart(productId) {
  const res = await addCartService(productId);
  await load();
  console.log(res);
  alert("Đã thêm sản phẩm vào giỏ hàng");
}

function mauSanPham(ten, anh, mota, gia, id) {
  return `<div class="san_pham">
          <div class="noi_dung_san_pham">
            <p class="ghi_chu">Thực phẩm</p>
            <img class="anh-minh_hoa_san_pham" src="${anh}" />
            <div class="can_le"></div>
            <h4 class="ten_san_pham">${ten}</h4>
            <p class="mo_ta_san_pham">${""}</p>
            <div class="gia_san_pham"><p>đ${gia}</p></div>
            <button onClick="addCart(${id},1)" class="nut_them_vao_gio_hang ${
    isInCart(id) ? " disabled " : ""
  }">Thêm vào giỏ hàng</button>
          </div>
        </div>`;
}

// ===== FILTER + PAGINATION =====
let allProducts = [];
let filteredProducts = [];

function renderProducts(list) {
  dsSanPham.innerHTML = "";
  list.forEach((product) => {
    dsSanPham.innerHTML += mauSanPham(
      product.name,
      product.image,
      "",
      product.price,
      product.id
    );
  });
}

function updatePagination() {
  numberPage = Math.max(1, Math.ceil(filteredProducts.length / perPage));

  let html = `<div class="phantrang">`;
  html += `<button onclick="goPage(1)" type="button" class="veTrangDau"><<</button>`;
  html += `<button onclick="goPage(Math.max(1, ${page - 1}))" type="button" class="truoc"><</button>`;
  if (page > 1) html += `<button onclick="goPage(${page - 1})" type="button" class="page">${page - 1}</button>`;
  html += `<button type="button" class="tranghientai">${page}</button>`;
  if (page < numberPage) html += `<button onclick="goPage(${page + 1})" type="button" class="page">${page + 1}</button>`;
  html += `<button onclick="goPage(${numberPage})" type="button" class="denTrangCuoi">>></button>`;
  html += `</div>`;
  phantrang.innerHTML = html;
  phantrang1.innerHTML = html;
}

function goPage(newPage) {
  page = newPage;
  start = (page - 1) * perPage;
  end = perPage * page - 1;
  const pageItems = filteredProducts.slice(start, end + 1);
  renderProducts(pageItems);
  updatePagination();
}

function filterCategory(category) {
  if (category === "ALL") {
    filteredProducts = allProducts;
  } else {
    filteredProducts = allProducts.filter(
      (p) => p.category && p.category.name && p.category.name.trim().toLowerCase() === category.trim().toLowerCase()
    );
  }
  goPage(1);
}

// ===== LOAD PRODUCTS =====
async function loadProduct() {
  const products = await fetch("http://localhost:8081/api/products", {
    headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
  }).then((res) => res.json());

  allProducts = products;
  filteredProducts = products;
  goPage(page);
}

loadProduct();

function handleSearch(event) {
    const keyword = event.target.value.toLowerCase().trim();
    
    // Lọc sản phẩm từ danh sách gốc allProducts
    filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(keyword)
    );

    // Cập nhật lại giao diện
    page = 1; // Reset về trang đầu
    goPage(1); 
}