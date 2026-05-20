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
  // Sử dụng card của Bootstrap để đồng bộ giao diện và hiển thị đẹp hơn
  return `
    <div class="col">
        <div class="card h-100 shadow-sm border-0">
            <img src="${anh}" class="card-img-top" alt="${ten}" style="height: 180px; object-fit: cover; border-bottom: 1px solid #f0f0f0;">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title fs-6 fw-bold" style="flex-grow: 1;">${ten}</h5>
                <p class="card-text text-danger fw-bold mt-2 fs-5">${numberToVnd(gia)}</p>
                <button onClick="addCart(${id})" class="btn ${isInCart(id) ? 'btn-success disabled' : 'btn-primary'} w-100 mt-2">
                    <i class="bi ${isInCart(id) ? 'bi-check-lg' : 'bi-cart-plus'} me-1"></i>
                    ${isInCart(id) ? 'Đã ở trong giỏ' : 'Thêm vào giỏ'}
                </button>
            </div>
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
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(numberPage, page + 1);
  const disablePrev = page === 1 ? "disabled" : "";
  const disableNext = page === numberPage ? "disabled" : "";

  html += `<button onclick="goPage(1)" type="button" class="veTrangDau" ${disablePrev}><<</button>`;
  html += `<button onclick="goPage(${prevPage})" type="button" class="truoc" ${disablePrev}><</button>`;
  if (page > 1) {
    html += `<button onclick="goPage(${page - 1})" type="button" class="page">${page - 1}</button>`;
  }
  html += `<button type="button" class="tranghientai">${page}</button>`;
  if (page < numberPage) {
    html += `<button onclick="goPage(${page + 1})" type="button" class="page">${page + 1}</button>`;
  }
  html += `<button onclick="goPage(${nextPage})" type="button" class="sau" ${disableNext}>></button>`;
  html += `<button onclick="goPage(${numberPage})" type="button" class="denTrangCuoi" ${disableNext}>>></button>`;
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

  // Bắt từ khóa search từ thanh công cụ (nếu redirect từ trang khác sang)
  if (urlParams.has("search")) {
    const keyword = urlParams.get("search").toLowerCase().trim();
    filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(keyword));
  }

  goPage(page);
  initAdsBanner();
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

// ===== ADS POPUP =====
function getRandomProducts(list, count) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

let adsProducts = [];
let adsIndex = 0;
let adsTimer = null;

function renderAdsProduct(product) {
  const adsList = document.getElementById("ads-list");
  if (!adsList) return;

  const card = `
    <div class="ads-item">
      <img src="${product.image}" alt="${product.name}">
      <div class="ads-item-body">
        <div class="ads-item-title">${product.name}</div>
        <div class="ads-item-price">${numberToVnd(product.price)}</div>
        <button onClick="addCart(${product.id})" class="btn btn-sm ${isInCart(product.id) ? 'btn-success disabled' : 'btn-primary'}">
          ${isInCart(product.id) ? 'Đã ở trong giỏ' : 'Thêm vào giỏ'}
        </button>
      </div>
    </div>`;
  adsList.innerHTML = card;
}

function scheduleNextAds() {
  if (!adsProducts.length) return;
  if (adsTimer) clearTimeout(adsTimer);
  const delay = 3000 + Math.floor(Math.random() * 2000);
  adsTimer = setTimeout(() => {
    adsIndex = (adsIndex + 1) % adsProducts.length;
    renderAdsProduct(adsProducts[adsIndex]);
    scheduleNextAds();
  }, delay);
}

function adsPrev() {
  if (!adsProducts.length) return;
  adsIndex = (adsIndex - 1 + adsProducts.length) % adsProducts.length;
  renderAdsProduct(adsProducts[adsIndex]);
  scheduleNextAds();
}

function adsNext() {
  if (!adsProducts.length) return;
  adsIndex = (adsIndex + 1) % adsProducts.length;
  renderAdsProduct(adsProducts[adsIndex]);
  scheduleNextAds();
}

function closeAdsBanner() {
  const banner = document.getElementById("ads-banner");
  if (!banner) return;
  if (adsTimer) {
    clearTimeout(adsTimer);
    adsTimer = null;
  }
  banner.classList.add("hidden");
}

function initAdsBanner() {
  const banner = document.getElementById("ads-banner");
  const adsList = document.getElementById("ads-list");
  if (!banner || !adsList || !allProducts.length) return;

  adsProducts = getRandomProducts(allProducts, 12);
  adsIndex = 0;
  renderAdsProduct(adsProducts[adsIndex]);
  scheduleNextAds();
  banner.classList.remove("hidden");
}