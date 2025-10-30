// Minimal product + UI script for the static prototype.
// Put this file as script.js next to index.html and styles.css

const PRODUCTS = generateSampleProducts(36); // initial items
let visibleCount = 12;
let CART = {};
let WISHLIST = {};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  renderProducts();
  setupSearchAndFilters();
  setupModal();
  setupCart();
  updateCounters();
  document.getElementById("loadMore").addEventListener("click", () => {
    visibleCount += 12;
    renderProducts();
  });
});

function generateSampleProducts(n=30){
  const cats = ["Electronics","Fashion","Home","Gaming","Beauty","Sports","Books"];
  const arr = [];
  for(let i=1;i<=n;i++){
    const category = cats[i % cats.length];
    const price = +(Math.random()*240+5).toFixed(2);
    arr.push({
      id: `p${i}`,
      title: `${category} Item ${i}`,
      desc: `High quality ${category.toLowerCase()} product. Great value, reliable supplier.`,
      price,
      rating: +(Math.random()*2+3).toFixed(1),
      reviews: Math.floor(Math.random()*1000),
      category,
      img: `https://picsum.photos/seed/product${i}/600/400`,
      suppliers: [
        { name: "Temu", price: +(price*0.6).toFixed(2), eta: "12-21 days" },
        { name: "AliExpress", price: +(price*0.65).toFixed(2), eta: "15-30 days" },
        { name: "LocalWarehouse", price: +(price*0.9).toFixed(2), eta: "3-7 days" }
      ]
    });
  }
  return arr;
}

function renderProducts(){
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";
  const {min,max,query,sort,cat} = currentFilters();
  const filtered = PRODUCTS.filter(p=>{
    if(cat && cat!=="All" && p.category!==cat) return false;
    if(query && !(`${p.title} ${p.desc}`.toLowerCase().includes(query.toLowerCase()))) return false;
    if(min && p.price < min) return false;
    if(max && p.price > max) return false;
    return true;
  });
  if(sort==="price-asc") filtered.sort((a,b)=>a.price-b.price);
  if(sort==="price-desc") filtered.sort((a,b)=>b.price-a.price);
  if(sort==="rating") filtered.sort((a,b)=>b.rating-b.rating);
  const list = filtered.slice(0,visibleCount);
  list.forEach(p => grid.appendChild(productCard(p)));
  if(filtered.length === 0) grid.innerHTML = "<div class='muted'>No products found. Try a different search or filter.</div>";
}

function productCard(p){
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `
    <img loading="lazy" src="${p.img}" alt="${p.title}" />
    <div class="card-body">
      <div class="card-title">${escapeHtml(p.title)}</div>
      <div class="card-desc">${escapeHtml(p.desc)}</div>
      <div class="card-row">
        <div>
          <div class="price">$${p.price.toFixed(2)}</div>
          <div class="small muted">⭐ ${p.rating} · ${p.reviews} reviews</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn quick-view" data-id="${p.id}">View</button>
          <button class="btn btn-ghost add-cart" data-id="${p.id}">Add</button>
          <button class="btn btn-ghost wish" data-id="${p.id}">♡</button>
        </div>
      </div>
    </div>
  `;
  el.querySelectorAll(".quick-view").forEach(b => b.addEventListener("click", () => openModal(p.id)));
  el.querySelectorAll(".add-cart").forEach(b => b.addEventListener("click", () => addToCart(p.id,1)));
  el.querySelectorAll(".wish").forEach(b => b.addEventListener("click", () => toggleWish(p.id)));
  return el;
}

function currentFilters(){
  return {
    min: parseFloat(document.getElementById("minPrice").value) || null,
    max: parseFloat(document.getElementById("maxPrice").value) || null,
    query: document.getElementById("search").value || "",
    sort: document.getElementById("sortSelect").value || "relevance",
    cat: Array.from(document.querySelectorAll(".nav-link.active")).map(n=>n.textContent)[0] || "All"
  };
}

function setupSearchAndFilters(){
  document.getElementById("searchBtn").addEventListener("click", renderProducts);
  document.getElementById("search").addEventListener("input", debounce(renderProducts, 300));
  document.getElementById("applyPrice").addEventListener("click", renderProducts);
  document.getElementById("sortSelect").addEventListener("change", renderProducts);

  document.querySelectorAll(".nav-link").forEach(a=>{
    a.addEventListener("click", ()=>{
      document.querySelectorAll(".nav-link").forEach(x=>x.classList.remove("active"));
      a.classList.add("active");
      renderProducts();
    });
  });

  // default category = All
  document.querySelector(".nav-link").classList.add("active");
}

function setupModal(){
  const modal = document.getElementById("modal");
  const close = document.getElementById("modalClose");
  close.addEventListener("click", () => modal.classList.add("hidden"));
  document.getElementById("modalAdd").addEventListener("click", () => {
    const id = document.getElementById("modalAdd").dataset.id;
    const qty = parseInt(document.getElementById("modalQty").value || "1",10);
    addToCart(id, qty);
    modal.classList.add("hidden");
  });
  document.getElementById("modalWish").addEventListener("click", () => {
    const id = document.getElementById("modalWish").dataset.id;
    toggleWish(id);
    modal.classList.add("hidden");
  });
}

function openModal(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const modal = document.getElementById("modal");
  modal.classList.remove("hidden");
  document.getElementById("modalImg").src = p.img;
  document.getElementById("modalTitle").textContent = p.title;
  document.getElementById("modalDesc").textContent = p.desc;
  document.getElementById("modalPrice").textContent = `$${p.price.toFixed(2)}`;
  document.getElementById("modalQty").value = 1;
  const supWrap = document.getElementById("modalSuppliers");
  supWrap.innerHTML = "<strong>Suppliers</strong>";
  p.suppliers.forEach(s => {
    const btn = document.createElement("div");
    btn.className = "small muted";
    btn.style.marginTop = "6px";
    btn.textContent = `${s.name} — $${s.price.toFixed(2)} — ETA ${s.eta}`;
    supWrap.appendChild(btn);
  });
  document.getElementById("modalAdd").dataset.id = p.id;
  document.getElementById("modalWish").dataset.id = p.id;
}

function setupCart(){
  document.getElementById("cartBtn").addEventListener("click", ()=>toggleCart());
  document.getElementById("closeCart").addEventListener("click", ()=>toggleCart(true));
  document.getElementById("checkoutBtn").addEventListener("click", ()=>alert("Checkout is a mock in this prototype. We'll integrate payments later."));
}

function toggleCart(forceClose=false){
  const drawer = document.getElementById("cartDrawer");
  if(forceClose) drawer.classList.add("hidden");
  else drawer.classList.toggle("hidden");
  renderCart();
}

function addToCart(id, qty=1){
  const prod = PRODUCTS.find(p => p.id === id);
  if(!prod) return;
  if(!CART[id]) CART[id] = { ...prod, qty:0 };
  CART[id].qty += qty;
  updateCounters();
  renderCart();
}

function renderCart(){
  const wrap = document.getElementById("cartItems");
  wrap.innerHTML = "";
  const keys = Object.keys(CART);
  if(keys.length === 0){
    wrap.innerHTML = "<div class='muted'>Your cart is empty — add some items!</div>";
  } else {
    keys.forEach(k=>{
      const it = CART[k];
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <img src="${it.img}" alt="${escapeHtml(it.title)}" />
        <div style="flex:1">
          <div style="font-weight:700">${escapeHtml(it.title)}</div>
          <div class="small muted">$${it.price.toFixed(2)} · qty: <button class="cart-decr" data-id="${it.id}">-</button> <span>${it.qty}</span> <button class="cart-incr" data-id="${it.id}">+</button></div>
        </div>
        <div style="font-weight:700">$${(it.price*it.qty).toFixed(2)}</div>
      `;
      wrap.appendChild(div);
    });
    wrap.querySelectorAll(".cart-decr").forEach(b => b.addEventListener("click", e=>{
      const id = e.target.dataset.id;
      CART[id].qty = Math.max(0, CART[id].qty - 1);
      if(CART[id].qty === 0) delete CART[id];
      renderCart(); updateCounters();
    }));
    wrap.querySelectorAll(".cart-incr").forEach(b => b.addEventListener("click", e=>{
      const id = e.target.dataset.id;
      CART[id].qty += 1;
      renderCart(); updateCounters();
    }));
  }

  const total = Object.values(CART).reduce((s,i)=>s + i.price * i.qty, 0);
  document.getElementById("cartTotal").textContent = `$${total.toFixed(2)}`;
  document.getElementById("cartCount").textContent = keys.length;
  if(keys.length>0) document.getElementById("cartCount").classList.add("badge");
}

function toggleWish(id){
  if(WISHLIST[id]) delete WISHLIST[id];
  else {
    const p = PRODUCTS.find(x=>x.id===id);
    if(p) WISHLIST[id] = p;
  }
  updateCounters();
}

function updateCounters(){
  document.getElementById("wishCount").textContent = Object.keys(WISHLIST).length;
  document.getElementById("cartCount").textContent = Object.keys(CART).length;
  // small animation cue
  if(Object.keys(CART).length>0) document.getElementById("cartBtn").classList.add("has-items");
  else document.getElementById("cartBtn").classList.remove("has-items");
}

// small helpers
function escapeHtml(t){ return (t+"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" })[m]); }
function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms)}}

