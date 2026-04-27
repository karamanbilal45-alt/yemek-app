const app = {
    restaurants: JSON.parse(localStorage.getItem('xe_res_data')) || [
        { id: 1, user: "burger1", pass: "123", n: "Burger House", i: "🍔", c: "Burger", b: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=1472", p: [
            { name: "Klasik Hamburger", price: 185.00, type: "food" },
            { name: "Coca-Cola", price: 45.00, type: "drink" }
        ]},
        { id: 2, user: "pizza1", pass: "123", n: "Quick Pizza", i: "🍕", c: "Pizza", b: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1470", p: [
            { name: "Karışık Pizza", price: 245.00, type: "food" },
            { name: "Ayran", price: 25.00, type: "drink" }
        ]}
    ],
    orders: JSON.parse(localStorage.getItem('xe_orders')) || [],
    cart: [],
    currentUser: null,
    userRole: 'customer',
    isRegisterMode: false,
    activeRes: null,
    editingProductIdx: null,

    init() {
        this.saveData();
    },

    saveData() {
        localStorage.setItem('xe_res_data', JSON.stringify(this.restaurants));
        localStorage.setItem('xe_orders', JSON.stringify(this.orders));
    },

    switchTab(role) {
        this.userRole = role;
        this.isRegisterMode = false;
        document.querySelectorAll('.auth-tabs button').forEach(btn => btn.classList.remove('active'));
        document.getElementById('tab' + role.charAt(0).toUpperCase() + role.slice(1)).classList.add('active');
        document.getElementById('regSwitchText').classList.toggle('hidden', role === 'admin');
        this.updateAuthUI();
    },

    toggleRegister(mode) {
        this.isRegisterMode = mode;
        this.updateAuthUI();
    },

    updateAuthUI() {
        const isRes = this.userRole === 'res';
        document.getElementById('resNameField').classList.toggle('hidden', !(isRes && this.isRegisterMode));
        document.getElementById('authTitle').innerText = this.userRole.toUpperCase() + (this.isRegisterMode ? " KAYIT" : " GİRİŞİ");
        document.getElementById('loginActions').classList.toggle('hidden', this.isRegisterMode);
        document.getElementById('registerActions').classList.toggle('hidden', !this.isRegisterMode);
    },

    handleAuth(isRegister = false) {
        const user = document.getElementById('authUser').value.trim();
        const pass = document.getElementById('authPass').value.trim();
        const resName = document.getElementById('authResName').value.trim();

        if (!user || !pass) return alert("Lütfen tüm alanları doldurun!");

        // ADMİN GİRİŞİ
        if (this.userRole === 'admin') {
            if (user === "admin" && pass === "1234") {
                this.currentUser = "Admin";
                return this.loginSuccess('admin');
            }
            return alert("Geçersiz Admin Bilgileri!");
        }

        // RESTORAN GİRİŞİ / KAYDI
        if (this.userRole === 'res') {
            if (isRegister) {
                if(!resName) return alert("Restoran adını girin!");

                // ÇAKIŞMA KONTROLÜ (Aynı kullanıcı adı VEYA aynı şifre kontrolü)
                const isDuplicate = this.restaurants.some(r => r.user === user && r.pass === pass);
                if (isDuplicate) {
                    return alert("HATA: Bu kullanıcı adı ve şifre kombinasyonu zaten başka bir restoran tarafından kullanılıyor!");
                }

                const newRes = { 
                    id: Date.now(), 
                    user, 
                    pass, 
                    n: resName, 
                    i: "🍴", 
                    c: "Yerel", 
                    b: "https://images.unsplash.com/photo-1552566626-52f8b828add9", 
                    p: [] 
                };
                this.restaurants.push(newRes);
                this.saveData();
                this.activeRes = newRes;
                this.loginSuccess('res');
            } else {
                const res = this.restaurants.find(r => r.user === user && r.pass === pass);
                if (res) { 
                    this.activeRes = res; 
                    this.loginSuccess('res'); 
                } else alert("Kullanıcı adı veya şifre hatalı!");
            }
        } else {
            // Müşteri Girişi (Basit)
            this.currentUser = user;
            this.loginSuccess('customer');
        }
    },

    loginSuccess(role) {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appPanel').classList.remove('hidden');
        document.getElementById('userWelcome').innerText = `Hoş geldin, ${this.activeRes ? this.activeRes.n : this.currentUser}`;
        document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));

        if (role === 'admin') this.renderAdminPanel();
        else if (role === 'res') this.renderResPanel();
        else this.showRestaurants();
    },

    headerLogoAction() {
        if(this.userRole === 'customer') this.showRestaurants();
        else if(this.userRole === 'res') this.renderResPanel();
        else if(this.userRole === 'admin') this.renderAdminPanel();
    },

    // --- ADMIN PANELİ (KULLANICI ADI & ŞİFRE GÖRÜNTÜLEME) ---
    renderAdminPanel() {
        document.getElementById('adminPanel').classList.remove('hidden');
        const list = document.getElementById('adminResList');
        list.innerHTML = `
            <div style="display:grid; grid-template-columns: 2fr 2fr 2fr 1fr; gap:10px; padding:15px; background:var(--accent); color:var(--bg-dark); font-weight:bold; border-radius:10px; margin-bottom:15px;">
                <span>Restoran Adı</span>
                <span>Kullanıcı Adı</span>
                <span>Şifre</span>
                <span>İşlem</span>
            </div>
        ` + this.restaurants.map(r => `
            <div class="admin-item" style="display:grid; grid-template-columns: 2fr 2fr 2fr 1fr; gap:10px; align-items:center; background:rgba(255,255,255,0.05); padding:15px; margin-bottom:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.1);">
                <span style="font-weight:600;">${r.n}</span>
                <span style="color:var(--text-dim);">${r.user}</span>
                <code style="background:rgba(0,0,0,0.3); padding:3px 8px; border-radius:5px; color:var(--accent);">${r.pass}</code>
                <button onclick="app.deleteRes(${r.id})" class="btn-danger" style="padding:5px; margin:0; font-size:12px;">Kaldır</button>
            </div>
        `).join('');
    },

    deleteRes(id) {
        if(confirm("Bu restoranı tamamen silmek istediğinize emin misiniz?")) {
            this.restaurants = this.restaurants.filter(r => r.id !== id);
            this.saveData();
            this.renderAdminPanel();
        }
    },

    // --- RESTORAN YÖNETİMİ ---
    renderResPanel() {
        document.getElementById('restaurantSelection').classList.add('hidden');
        document.getElementById('menuSection').classList.add('hidden');
        document.getElementById('resAdminPanel').classList.remove('hidden');
        this.renderResProducts();
        this.renderResOrders();
    },

    renderResProducts() {
        const list = document.getElementById('resProductList');
        list.innerHTML = `<h3>Ürünleriniz</h3>` + (this.activeRes.p.length === 0 ? "<p>Menü henüz boş.</p>" : this.activeRes.p.map((p, idx) => `
            <div class="p-card">
                <h4>${p.name}</h4>
                <div class="p-price">${p.price} TL</div>
                <div style="display:flex; gap:5px;">
                    <button onclick="app.editProduct(${idx})" class="btn-action" style="padding:5px; font-size:12px; background:#3b82f6; color:white;">Düzenle</button>
                    <button onclick="app.deleteProduct(${idx})" class="btn-danger" style="padding:5px; font-size:12px; margin:0;">Sil</button>
                </div>
            </div>
        `).join(''));
    },

    saveProduct() {
        const name = document.getElementById('newPName').value;
        const price = parseFloat(document.getElementById('newPPrice').value);
        const type = document.getElementById('newPType').value;
        if(!name || isNaN(price)) return alert("Lütfen ürün bilgilerini tam girin!");

        if(this.editingProductIdx !== null) {
            this.activeRes.p[this.editingProductIdx] = { name, price, type };
            this.editingProductIdx = null;
        } else {
            this.activeRes.p.push({ name, price, type });
        }
        
        this.saveData();
        this.renderResProducts();
        this.resetProductForm();
    },

    editProduct(idx) {
        const p = this.activeRes.p[idx];
        this.editingProductIdx = idx;
        document.getElementById('newPName').value = p.name;
        document.getElementById('newPPrice').value = p.price;
        document.getElementById('newPType').value = p.type;
        document.getElementById('formTitle').innerText = "Ürünü Güncelle";
        document.getElementById('btnSubmitProduct').innerText = "GÜNCELLE";
        document.getElementById('btnCancelEdit').classList.remove('hidden');
    },

    resetProductForm() {
        this.editingProductIdx = null;
        document.getElementById('newPName').value = "";
        document.getElementById('newPPrice').value = "";
        document.getElementById('formTitle').innerText = "Yeni Ürün Ekle";
        document.getElementById('btnSubmitProduct').innerText = "EKLE";
        document.getElementById('btnCancelEdit').classList.add('hidden');
    },

    deleteProduct(idx) {
        if(confirm("Silmek istediğine emin misin?")) {
            this.activeRes.p.splice(idx, 1);
            this.saveData();
            this.renderResProducts();
        }
    },

    renderResOrders() {
        const myOrders = this.orders.filter(o => o.resId === this.activeRes.id);
        const container = document.getElementById('resOrderList');
        container.innerHTML = `<h3>Siparişler</h3>` + (myOrders.length === 0 ? "<p>Sipariş yok.</p>" : myOrders.reverse().map(o => `
            <div class="order-card status-${o.status}">
                <div class="order-header"><strong>#${o.id}</strong><span class="status-badge">${o.status}</span></div>
                <p><strong>Ürünler:</strong> ${o.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
                <p><strong>Adres:</strong> ${o.address}</p>
                <div class="order-actions">
                    <button onclick="app.updateOrderStatus(${o.id}, 'yolda')" class="btn-on-way">Yolda</button>
                    <button onclick="app.updateOrderStatus(${o.id}, 'teslim-edildi')" class="btn-delivered">Teslim Etildi</button>
                </div>
            </div>
        `).join(''));
    },

    updateOrderStatus(orderId, newStatus) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) { order.status = newStatus; this.saveData(); this.renderResOrders(); }
    },

    // --- MÜŞTERİ PANELİ ---
    showRestaurants() {
        document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
        document.getElementById('menuSection').classList.add('hidden');
        document.getElementById('restaurantSelection').classList.remove('hidden');
        const resList = document.getElementById('resList');
        resList.innerHTML = this.restaurants.map(r => `
            <div class="res-card" onclick="app.openMenu(${r.id})">
                <div class="res-logo">${r.i}</div>
                <h3>${r.n}</h3>
                <small>${r.c} Mutfağı</small>
            </div>
        `).join('');
    },

    openMenu(id) {
        this.activeRes = this.restaurants.find(r => r.id === id);
        document.getElementById('restaurantSelection').classList.add('hidden');
        document.getElementById('menuSection').classList.remove('hidden');
        document.getElementById('resBanner').style.backgroundImage = `url('${this.activeRes.b}')`;
        document.getElementById('activeResName').innerText = this.activeRes.n;
        this.renderProducts();
    },

    renderProducts() {
        const grid = document.getElementById('productGrid');
        grid.innerHTML = this.activeRes.p.map(p => `
            <div class="p-card">
                <h4>${p.name}</h4>
                <div class="p-price">${p.price.toFixed(2)} TL</div>
                <button class="btn-action" onclick="app.addToCart('${p.name}', ${p.price})">Ekle +</button>
            </div>
        `).join('');
    },

    addToCart(name, price) {
        const item = this.cart.find(i => i.name === name);
        if (item) item.quantity++;
        else this.cart.push({ name, price, quantity: 1 });
        this.updateCart();
    },

    updateCart() {
        const itemsDiv = document.getElementById('cartItems');
        itemsDiv.innerHTML = this.cart.map(item => `<div class="cart-item-ui"><span>${item.name} x${item.quantity}</span><span>${(item.price * item.quantity).toFixed(2)} TL</span></div>`).join('');
        const total = this.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        document.getElementById('cartTotal').innerText = total.toFixed(2);
    },

    openOrderModal() { if(this.cart.length === 0) return alert("Sepet boş!"); document.getElementById('orderModal').classList.remove('hidden'); },
    closeModal() { document.getElementById('orderModal').classList.add('hidden'); },

    confirmOrder() {
        const addr = document.getElementById('orderAddress').value;
        if (!addr) return alert("Adres girin!");
        const newOrder = { id: Math.floor(Math.random() * 10000), resId: this.activeRes.id, resName: this.activeRes.n, items: [...this.cart], total: document.getElementById('cartTotal').innerText, address: addr, status: 'hazırlanıyor' };
        this.orders.push(newOrder);
        this.saveData();
        alert("Siparişiniz alındı!");
        this.cart = []; this.updateCart(); this.closeModal(); this.showRestaurants();
    }
};

app.init();