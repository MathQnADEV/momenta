let currentPage = 1;
let lastPage = 1;

const galleryGrid = document.getElementById('gallery-grid');
const galleryLoading = document.getElementById('gallery-loading');
const galleryEmpty = document.getElementById('gallery-empty');
const galleryPagination = document.getElementById('gallery-pagination');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const paginationPages = document.getElementById('pagination-pages');

// Modal Elements
const galleryModal = document.getElementById('gallery-modal');
const modalImg = document.getElementById('modal-img');
const modalQr = document.getElementById('modal-qr');
const modalClose = document.getElementById('modal-close');
const modalOverlay = document.getElementById('modal-overlay');

async function fetchPhotos(page = 1) {
    showLoading(true);
    const unitId = window.PHOTOBOOTH_CONFIG.psdUnitId;

    try {
        const response = await fetch(`/api/photos?psd_unit_id=${unitId}&page=${page}`, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error('Gagal memuat galeri');

        const result = await response.json();
        renderGallery(result.data);

        currentPage = result.current_page;
        lastPage = result.last_page;

        updatePaginationUI();
    } catch (e) {
        console.error(e);
        galleryGrid.innerHTML = `<p class="gallery-error">⚠️ Gagal memuat galeri. Silakan coba lagi.</p>`;
    } finally {
        showLoading(false);
    }
}

function renderGallery(photos) {
    // Hapus item lama
    galleryGrid.querySelectorAll('.gallery-item').forEach(el => el.remove());

    if (!photos || photos.length === 0) {
        galleryEmpty.style.display = 'flex';
        galleryPagination.style.display = 'none';
        return;
    }

    galleryEmpty.style.display = 'none';
    galleryPagination.style.display = 'flex';

    photos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${photo.thumbnail_url}" alt="Foto" class="gallery-img">
            <div class="gallery-item-overlay">
                <span class="gallery-date">${photo.created_at}</span>
                <span class="gallery-expiry">Hilang dalam ±${Math.max(1, photo.remaining_minutes ?? 60)} menit</span>
                <span class="gallery-zoom-icon">🔍</span>
            </div>
        `;
        item.addEventListener('click', () => openModal(photo));
        galleryGrid.appendChild(item);
    });
}

function openModal(photo) {
    modalImg.src = photo.thumbnail_url;
    modalQr.innerHTML = '';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(photo.public_url)}`;
    modalQr.innerHTML = `<img src="${qrUrl}" alt="QR Code" class="modal-qr-img">`;
    galleryModal.style.display = 'flex';
}

function closeModal() {
    galleryModal.style.display = 'none';
    modalImg.src = '';
    modalQr.innerHTML = '';
}

function showLoading(isLoading) {
    if (isLoading) {
        galleryLoading.style.display = 'flex';
        galleryEmpty.style.display = 'none';
    } else {
        galleryLoading.style.display = 'none';
    }
}

function updatePaginationUI() {
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= lastPage;

    // Render tombol nomor halaman
    paginationPages.innerHTML = '';

    if (lastPage <= 1) {
        // Hanya 1 halaman — sembunyikan pagination
        galleryPagination.style.display = 'none';
        return;
    }

    for (let i = 1; i <= lastPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-page-num' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.addEventListener('click', () => {
            if (i !== currentPage) fetchPhotos(i);
        });
        paginationPages.appendChild(btn);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchPhotos(1);

    btnPrev.addEventListener('click', () => {
        if (currentPage > 1) fetchPhotos(currentPage - 1);
    });

    btnNext.addEventListener('click', () => {
        if (currentPage < lastPage) fetchPhotos(currentPage + 1);
    });

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // Buang foto kedaluwarsa dari layar tanpa menunggu pengguna memuat ulang halaman.
    window.setInterval(() => fetchPhotos(currentPage), 60_000);
});
