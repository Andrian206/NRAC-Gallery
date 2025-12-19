// ==========================================
// SUPABASE CONFIGURATION & API
// Toko Ikan Miaw - Complete Backend
// ==========================================

// Configuration
const SUPABASE_URL = 'https://arlgjiovhmeminsbpder.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybGdqaW92aG1lbWluc2JwZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTIwNjcsImV4cCI6MjA4MTE2ODA2N30.WSbx3URMrw9D4JN7HZIvNPGNw0ot9YAg5lHYjySmtfQ';

// Initialize Supabase Client
let supabaseClient;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase connected');
} catch (error) {
    console.error('❌ Supabase failed:', error);
}

// ==========================================
// CONSTANTS
// ==========================================
const STATUS_IKAN = {
    TERSEDIA: 'Tersedia',
    DIPESAN: 'Dipesan',
    TERJUAL: 'Terjual'
};

const TABLE_NAME = 'ikan';
const TABLE_USERS = 'users';

// Default values
const DEFAULT_FOTO = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop';
const DEFAULT_LOKASI = 'Indonesia';

// ==========================================
// SESSION MANAGEMENT (LocalStorage)
// ==========================================
function saveSession(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function getSession() {
    try {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

function clearSession() {
    localStorage.removeItem('currentUser');
    clearKeranjang();
}

function getCurrentUser() {
    return getSession();
}

function isLoggedIn() {
    return getSession() !== null;
}

function isAdmin() {
    const user = getSession();
    return user && user.role === 'admin';
}

// ==========================================
// GENERATE KODE IKAN (NRAC + 6 digit)
// Menggunakan MAX untuk hindari duplikat
// ==========================================
async function generateKodeIkan() {
    try {
        // Ambil semua kode, sort by kode_ikan descending
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('kode_ikan')
            .order('kode_ikan', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            const lastKode = data[0].kode_ikan;
            const lastNumber = parseInt(lastKode.replace('NRAC', '')) || 0;
            const newNumber = lastNumber + 1;
            return 'NRAC' + String(newNumber).padStart(6, '0');
        }

        return 'NRAC000001';
    } catch (error) {
        console.error('Generate kode error:', error);
        // Fallback: use timestamp to avoid duplicate
        const timestamp = Date.now().toString().slice(-6);
        return 'NRAC' + timestamp;
    }
}

// ==========================================
// AUTHENTICATION (Custom - Tabel Users)
// ==========================================
async function signIn(email, password) {
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_USERS)
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();

        if (error || !data) {
            return { success: false, error: 'Email atau password salah' };
        }

        saveSession(data);
        console.log('✅ Login berhasil:', data.email, '| Role:', data.role);
        return { success: true, data: data };
    } catch (error) {
        console.error('SignIn error:', error);
        return { success: false, error: 'Gagal login. Coba lagi.' };
    }
}

async function signUp(email, password, nama) {
    try {
        // Check if email exists
        const { data: existing } = await supabaseClient
            .from(TABLE_USERS)
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return { success: false, error: 'Email sudah terdaftar' };
        }

        // Insert new user
        const { data, error } = await supabaseClient
            .from(TABLE_USERS)
            .insert([{ email, password, nama, role: 'user' }])
            .select()
            .single();

        if (error) throw error;

        // Auto login
        saveSession(data);
        console.log('✅ SignUp berhasil:', data.email);
        return { success: true, data: data };
    } catch (error) {
        console.error('SignUp error:', error);
        return { success: false, error: 'Gagal mendaftar. Coba lagi.' };
    }
}

function signOut() {
    clearSession();
    console.log('✅ Logout berhasil');
    return { success: true };
}

// ==========================================
// IKAN CRUD FUNCTIONS
// ==========================================

// CREATE - Tambah ikan baru
async function createIkan(ikanData) {
    try {
        const kode = await generateKodeIkan();
        
        const insertData = {
            kode_ikan: kode,
            harga: parseInt(ikanData.harga) || 0,
            lokasi: ikanData.lokasi?.trim() || DEFAULT_LOKASI,
            kategori: ikanData.kategori || 'Lainnya',
            deskripsi: ikanData.deskripsi?.trim() || null,
            url_foto: ikanData.url_foto?.trim() || DEFAULT_FOTO,
            status_ikan: STATUS_IKAN.TERSEDIA
        };

        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .insert([insertData])
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Ikan created:', data.kode_ikan);
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ Create error:', error);
        return { success: false, error: error.message };
    }
}

// READ - Ambil semua ikan
async function getAllIkan(statusFilter = null) {
    try {
        let query = supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .order('created_at', { ascending: false });

        if (statusFilter) {
            query = query.eq('status_ikan', statusFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log(`✅ Fetched ${data?.length || 0} ikan`);
        return data || [];
    } catch (error) {
        console.error('❌ Get all ikan error:', error);
        return [];
    }
}

// READ - Ambil ikan by ID
async function getIkanById(id) {
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Get ikan by ID error:', error);
        return null;
    }
}

// READ - Ambil ikan by Kode
async function getIkanByKode(kode) {
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .eq('kode_ikan', kode)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Get ikan by kode error:', error);
        return null;
    }
}

// UPDATE - Update ikan
async function updateIkan(id, updateData) {
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Ikan updated:', data);
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ Update ikan error:', error);
        return { success: false, error: error.message };
    }
}

// UPDATE - Update status ikan
async function updateStatusIkan(id, status) {
    return await updateIkan(id, { status_ikan: status });
}

// DELETE - Hapus ikan
async function deleteIkan(id) {
    try {
        const { error } = await supabaseClient
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log('✅ Ikan deleted:', id);
        return { success: true };
    } catch (error) {
        console.error('❌ Delete ikan error:', error);
        return { success: false, error: error.message };
    }
}

// SEARCH - Cari ikan
async function searchIkan(query) {
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .eq('status_ikan', STATUS_IKAN.TERSEDIA)
            .or(`kode_ikan.ilike.%${query}%,lokasi.ilike.%${query}%,kategori.ilike.%${query}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Search ikan error:', error);
        return [];
    }
}

// ==========================================
// KERANJANG FUNCTIONS (Local Storage)
// ==========================================
function getKeranjang() {
    try {
        const keranjang = localStorage.getItem('keranjang');
        return keranjang ? JSON.parse(keranjang) : [];
    } catch {
        return [];
    }
}

function addToKeranjang(ikanId) {
    const keranjang = getKeranjang();
    const id = parseInt(ikanId);
    
    if (!keranjang.includes(id)) {
        keranjang.push(id);
        localStorage.setItem('keranjang', JSON.stringify(keranjang));
        return { success: true, message: 'Berhasil ditambahkan ke keranjang' };
    }
    return { success: false, message: 'Ikan sudah ada di keranjang' };
}

function removeFromKeranjang(ikanId) {
    let keranjang = getKeranjang();
    const id = parseInt(ikanId);
    keranjang = keranjang.filter(item => item !== id);
    localStorage.setItem('keranjang', JSON.stringify(keranjang));
    return { success: true };
}

function clearKeranjang() {
    localStorage.removeItem('keranjang');
}

function getKeranjangCount() {
    return getKeranjang().length;
}

async function getKeranjangItems() {
    const keranjang = getKeranjang();
    if (keranjang.length === 0) return [];

    try {
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .in('id', keranjang)
            .eq('status_ikan', STATUS_IKAN.TERSEDIA);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Get keranjang items error:', error);
        return [];
    }
}

// ==========================================
// CHECKOUT / PURCHASE FUNCTIONS
// ==========================================
async function processCheckout(ikanIds) {
    try {
        for (const id of ikanIds) {
            await updateStatusIkan(id, STATUS_IKAN.DIPESAN);
        }
        clearKeranjang();
        return { success: true, message: 'Checkout berhasil!' };
    } catch (error) {
        console.error('❌ Checkout error:', error);
        return { success: false, error: error.message };
    }
}

async function confirmPurchase(ikanIds) {
    try {
        for (const id of ikanIds) {
            await updateStatusIkan(id, STATUS_IKAN.TERJUAL);
        }
        return { success: true, message: 'Pembelian dikonfirmasi!' };
    } catch (error) {
        console.error('❌ Confirm purchase error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function formatRupiah(number) {
    if (!number && number !== 0) return 'Rp. 0';
    return 'Rp. ' + parseInt(number).toLocaleString('id-ID');
}

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Debug function
async function testConnection() {
    console.log('🔄 Testing Supabase connection...');
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .limit(1);
        
        if (error) throw error;
        console.log('✅ Connection successful! Data:', data);
        return true;
    } catch (error) {
        console.error('❌ Connection failed:', error);
        return false;
    }
}
