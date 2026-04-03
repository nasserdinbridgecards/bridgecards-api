<script>
const API = "https://bridgecards-api.onrender.com";

async function loadProducts() {
  try {
    const res = await fetch(API + "/api/products");
    const data = await res.json();

    console.log("DATA:", data); // مهم للتأكد

    const products = data.content || data || [];

    const container = document.querySelector(".pgrid");

    if (!container) {
      console.error("❌ لم يتم العثور على pgrid");
      return;
    }

    container.innerHTML = "";

    products.slice(0, 20).forEach(p => {
      const name = p.productName || "Card";
      const price = p.fixedRecipientDenominations?.[0] || 10;
      const img = p.logoUrls?.[0] || "";

      const el = document.createElement("div");
      el.className = "pc";

      el.innerHTML = `
        <div class="pc-head">
          <img src="${img}" class="pc-logo">
        </div>
        <div class="pc-body">
          <div class="pc-name">${name}</div>
          <div class="pc-price">$${price}</div>
          <button class="add-btn">إضافة</button>
        </div>
      `;

      container.appendChild(el);
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    alert("خطأ في تحميل المنتجات");
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);
</script>
