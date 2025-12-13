async function ambilDataIkan() {
    // Panggil Supabase
    const { data, error } = await supabase
        .from('ikan')
        .select('*')
        .eq('status_ikan', 'Tersedia')

    if (error) {
        console.log("Ada error:", error)
    } else {
        console.log("Data berhasil didapat:", data) // Cek di Console Browser nanti
        tampilkanKeLayar(data)
    }
}

// 3. FUNGSI NAMPILIN KE LAYAR (DOM Manipulation)
function tampilkanKeLayar(listIkan) {
    const wadah = document.getElementById('tempat-ikan')
    wadah.innerHTML = '' // Bersihkan tulisan "loading"

    // Looping data (mirip foreach di bahasa lain)
    listIkan.forEach(ikan => {
        // Bikin HTML Card untuk setiap ikan
        const elemenIkan = `
            <div class="card">
                <img src="${ikan.url_foto}" alt="${ikan.nama}">
                <h3>${ikan.nama}</h3>
                <p class="harga">Rp. ${ikan.harga.toLocaleString()}</p>
                <p>${ikan.lokasi}</p>
                <button onclick="lihatDetail(${ikan.id})">Lihat Detail</button>
            </div>
        `
        wadah.innerHTML += elemenIkan
    })
}

ambilDataIkan() 
