import { sessionState } from './state.js';
import { getLayoutGeometry } from './compose.js';

/*
 * Zoom tampilan pratinjau di langkah Hias.
 * Hanya memperbesar tampilan di layar (CSS transform), hasil foto tidak berubah.
 * Tampilan dipusatkan ke foto yang sedang dipilih, jadi pelanggan cukup
 * memilih Foto 1, 2, ... untuk berpindah ke slot lain saat diperbesar.
 * Semua layer (stiker, coretan, teks, Atur Foto) sudah menghitung posisi
 * dari getBoundingClientRect, jadi tetap akurat walau diperbesar.
 */

const ZOOM_STEPS = [1, 1.5, 2, 3, 4];

const wrapper = document.getElementById('canvas-wrapper');
const zoomLayer = document.getElementById('canvas-zoom');
const valueLabel = document.getElementById('canvas-zoom-value');
let level = 0;

function focusPoint() {
    const canvas = document.getElementById('composite-canvas');
    const W = zoomLayer.clientWidth;
    const H = zoomLayer.clientHeight;
    const fallback = { x: W / 2, y: H / 2 };
    if (!canvas?.width || !canvas.clientWidth || !sessionState.layoutId) return fallback;

    const rect = getLayoutGeometry(sessionState.layoutId).photos[Number(sessionState.selectedPhotoIndex) || 0];
    if (!rect) return fallback;

    const scale = canvas.clientWidth / canvas.width;
    return {
        x: canvas.offsetLeft + (rect.x + rect.w / 2) * scale,
        y: canvas.offsetTop + (rect.y + rect.h / 2) * scale,
    };
}

export function updateCanvasZoom() {
    if (!zoomLayer) return;
    const zoom = ZOOM_STEPS[level];
    const W = zoomLayer.clientWidth;
    const H = zoomLayer.clientHeight;

    let tx = 0;
    let ty = 0;
    if (zoom > 1) {
        const focus = focusPoint();
        // Pusatkan foto terpilih, tapi jangan sampai tepi kanvas masuk ke tengah layar.
        tx = Math.min(0, Math.max(W - W * zoom, W / 2 - focus.x * zoom));
        ty = Math.min(0, Math.max(H - H * zoom, H / 2 - focus.y * zoom));
    }

    zoomLayer.style.transform = zoom > 1 ? `translate(${tx}px, ${ty}px) scale(${zoom})` : '';
    wrapper?.classList.toggle('is-zoomed', zoom > 1);
    if (valueLabel) valueLabel.textContent = `${Math.round(zoom * 100)}%`;
}

export function resetCanvasZoom() {
    level = 0;
    updateCanvasZoom();
}

export function initCanvasZoom() {
    if (!wrapper || !zoomLayer) return;

    wrapper.querySelectorAll('[data-canvas-zoom]').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.canvasZoom;
            if (action === 'in') level = Math.min(ZOOM_STEPS.length - 1, level + 1);
            else if (action === 'out') level = Math.max(0, level - 1);
            else level = 0;
            updateCanvasZoom();
        });
    });

    if ('ResizeObserver' in window) {
        new ResizeObserver(() => updateCanvasZoom()).observe(wrapper);
    }
}
