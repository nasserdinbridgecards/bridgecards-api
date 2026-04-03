<script>
const API = "https://bridgecards-api.onrender.com";

let PRODUCTS = [];
let CART = [];

// تحميل المنتجات
async function init() {
  try {
    const res = await fetch(API + "/api/products");
    const data = await res.json();

    PRODUCTS = data.content || data || [];
    render(PRODUCTS);

  } catch (e) {
    console.error(e);
    alert("فشل تحميل المنتجات");
  }
}

// شعار احترافي
function logo(name) {
  const map = {
    amazon:"amazon.com",
    netflix:"netflix.com",
    google:"google.com",
    apple:"apple.com",
    ikea:"ikea.com",
    playstation:"playstation.com",
    xbox:"xbox.com",
    steam:"steampowered.com",
    binance:"binance.com",
    spotify:"spotify.com"
  };

  for (let k in map) {
    if (name.toLowerCase().includes(k)) {
      return "https://logo.clearbit.com/" + map[k];
    }
  }
  return "";
}

// عرض المنتجات
function render(list) {
  const box = document.querySelector(".pgrid");
  if (!box) return;

  box.innerHTML = "";

  list.slice(0,30).forEach(p => {
    const name = p.productName || "Card";
    const img = p.logoUrls?.[0] || logo(name);
    const base = p.fixedRecipientDenominations?.[0] || 10;

    const price = (base * 1.07).toFixed(2); // ربح 7%

    const el = document.createElement("div");
    el.className = "pc";

    el.innerHTML = `
      <div class="pc-head">
        <img src="${img}" class="pc-logo"
        onerror="this.style.display='none'">
      </div>

      <div class="pc-body">
        <div class="pc-name">${name}</div>
        <div class="pc-price">$${price}</div>

        <button class="add-btn">إضافة</button>
      </div>
    `;

    el.querySelector("button").onclick = () => {
      CART.push(p);
      updateCart();
      toast("تمت الإضافة للسلة");
    };

    box.appendChild(el);
  });
}

// السلة
function updateCart() {
  const n = document.querySelector(".cart-n");
  if (n) n.innerText = CART.length;
}

// إشعار
function toast(t) {
  let d = document.querySelector(".toast");
  if (!d) {
    d = document.createElement("div");
    d.className = "toast";
    document.body.appendChild(d);
  }
  d.innerText = t;
  d.classList.add("show");
  setTimeout(()=>d.classList.remove("show"),2000);
}

// تشغيل
document.addEventListener("DOMContentLoaded", init);
</script>
