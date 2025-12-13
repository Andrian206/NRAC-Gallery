function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(angka);
}

function showLoading(elementId) {
    document.getElementById(elementId).innerHTML = '<div class="spinner">Loading...</div>';
}