// Data Storage (menggunakan localStorage untuk simulasi database)
let currentUser = null;
let products = JSON.parse(localStorage.getItem('products')) || [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];

// Demo Users
const users = {
    admin: { username: 'admin', password: 'admin123', role: 'admin', name: 'Miaw' },
    user: { username: 'user', password: 'user123', role: 'user', name: 'Rio' }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if user already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showPage(currentUser.role);
    }
});

// Login Function
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (users[username] && users[username].password === password) {
        currentUser = users[username];
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showPage(currentUser.role);
    } else {
        alert('Username atau password salah!');
    }
});

// Show Page Based on Role
function showPage(role) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    if (role === 'admin') {
        document.getElementById('adminPage').classList.add('active');
        document.getElementById('adminName').textContent = currentUser.name;
        loadAdminData();
    } else {
        document.getElementById('userPage').classList.add('active');
        document.getElementById('userName').textContent = currentUser.name;
        loadUserProducts();
        updateCartCount();
    }
}

// Logout Function
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('loginForm').reset();
}

// ========== ADMIN FUNCTIONS ==========

// Get Location (Auto-detect)
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                document.getElementById('productLocation').value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            },
            () => {
                document.getElementById('productLocation').value = 'Lokasi tidak terdeteksi';
            }
        );
    } else {
        document.getElementById('productLocation').value = 'Geolocation tidak didukung';
    }
}

// Load Admin Data
function loadAdminData() {
    // Set seller name automatically
    document.getElementById('sellerName').value = currentUser.name;
    
    // Get location
    getLocation();
    
    // Display products
    displayAdminProducts();
    
    // Display orders
    displayOrders();
}

// Add Product Form
document.getElementById('addProductForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const location = document.getElementById('productLocation').value;
    const seller = document.getElementById('sellerName').value;
    const imageFile = document.getElementById('productImage').files[0];
    
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const product = {
                id: Date.now(),
                name: name,
                price: parseInt(price),
                location: location,
                seller: seller,
                image: e.target.result,
                dateAdded: new Date().toLocaleString('id-ID')
            };
            
            products.push(product);
            localStorage.setItem('products', JSON.stringify(products));
            
            alert('Produk berhasil ditambahkan!');
            document.getElementById('addProductForm').reset();
            document.getElementById('sellerName').value = currentUser.name;
            getLocation();
            displayAdminProducts();
        };
        reader.readAsDataURL(imageFile);
    }
});

// Display Admin Products
function displayAdminProducts() {
    const container = document.getElementById('adminProductList');
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666;">Belum ada produk</p>';
        return;
    }
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-price">Rp ${product.price.toLocaleString('id-ID')}</p>
                <p>📍 ${product.location}</p>
                <p>👤 ${product.seller}</p>
                <p style="font-size:12px; color:#999;">Ditambahkan: ${product.dateAdded}</p>
                <button class="delete-btn" onclick="deleteProduct(${product.id})">Hapus Produk</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Delete Product
function deleteProduct(id) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        displayAdminProducts();
    }
}

// Display Orders
function displayOrders() {
    const container = document.getElementById('orderList');
    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666;">Belum ada pesanan</p>';
        return;
    }
    
    orders.forEach((order, index) => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-item';
        
        let itemsList = '';
        order.items.forEach(item => {
            itemsList += `<li>${item.name} - Rp ${item.price.toLocaleString('id-ID')}</li>`;
        });
        
        orderDiv.innerHTML = `
            <h4>Pesanan #${order.id}</h4>
            <p><strong>Pembeli:</strong> ${order.customerName}</p>
            <p><strong>Tanggal:</strong> ${order.date}</p>
            <p><strong>Produk:</strong></p>
            <ul>${itemsList}</ul>
            <p><strong>Total:</strong> Rp ${order.total.toLocaleString('id-ID')}</p>
            <div>
                <strong>Status:</strong>
                <select onchange="updateOrderStatus(${index}, this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Diproses</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Selesai</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Dibatalkan</option>
                </select>
                <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
            </div>
        `;
        container.appendChild(orderDiv);
    });
}

// Update Order Status
function updateOrderStatus(index, status) {
    orders[index].status = status;
    localStorage.setItem('orders', JSON.stringify(orders));
    displayOrders();
    alert('Status pesanan berhasil diupdate!');
}

// Get Status Text
function getStatusText(status) {
    const statusMap = {
        pending: 'Menunggu',
        processing: 'Diproses',
        completed: 'Selesai',
        cancelled: 'Dibatalkan'
    };
    return statusMap[status] || status;
}

// ========== USER FUNCTIONS ==========

// Load User Products
function loadUserProducts() {
    const container = document.getElementById('userProductList');
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666;">Belum ada produk tersedia</p>';
        return;
    }
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-price">Rp ${product.price.toLocaleString('id-ID')}</p>
                <p>📍 ${product.location}</p>
                <p>👤 Seller: ${product.seller}</p>
                <button onclick="addToCart(${product.id})">Tambah ke Keranjang</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        // Check if product already in cart
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            alert('Produk sudah ada di keranjang!');
            return;
        }
        
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            seller: product.seller
        });
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        alert('Produk ditambahkan ke keranjang!');
    }
}

// Update Cart Count
function updateCartCount() {
    document.getElementById('cartCount').textContent = cart.length;
}

// Show Cart
function showCart() {
    const modal = document.getElementById('cartModal');
    const container = document.getElementById('cartItems');
    container.innerHTML = '';
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666;">Keranjang kosong</p>';
        document.getElementById('totalPrice').textContent = '0';
    } else {
        let total = 0;
        cart.forEach((item, index) => {
            total += item.price;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>Rp ${item.price.toLocaleString('id-ID')}</p>
                    <p style="font-size:12px; color:#666;">Seller: ${item.seller}</p>
                </div>
                <button onclick="removeFromCart(${index})">Hapus</button>
            `;
            container.appendChild(itemDiv);
        });
        document.getElementById('totalPrice').textContent = total.toLocaleString('id-ID');
    }
    
    modal.classList.add('active');
}

// Close Cart
function closeCart() {
    document.getElementById('cartModal').classList.remove('active');
}

// Remove from Cart
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showCart();
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        alert('Keranjang kosong!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    
    const order = {
        id: Date.now(),
        customerName: currentUser.name,
        items: [...cart],
        total: total,
        date: new Date().toLocaleString('id-ID'),
        status: 'pending'
    };
    
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    closeCart();
    alert('Pesanan berhasil! Menunggu konfirmasi admin.');
}
