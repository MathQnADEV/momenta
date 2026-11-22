import { sessionState } from './state.js';
import { getLayoutGeometry } from './compose.js';

/*
 * Zoom tampilan pratinjau di langkah Hias.
 * Hanya memperbesar tampilan di layar (CSS transform), hasil foto tidak berubah.
 * - Tombol − / + : zoom bertahap dan berpusat ke foto yang dipilih.
 * - Cubit dua jari : zoom di titik cubit, geser dua jari untuk berpindah.
 * - Scroll mouse (laptop) : zoom di posisi kursor.
 * Gestur yang dimulai di kotak Atur Foto, stiker, atau teks tetap milik
 * elemen itu (misalnya cubit di kotak Atur Foto = zoom foto, bukan tampilan).
 * Semua layer menghitung posisi dari getBoundingClientRect, jadi tetap akurat.
 */

const ZOOM_STEPS = [1, 1.5, 2, 3, 4];
const MAX_ZOOM = 4;
const OWNED_TARGETS = '.photo-adjust-box, .active-sticker, .text-box, .canvas-zoom-controls';

const wrapper = document.getElementById('canvas-wrapper');
const zoomLayer = document.getElementById('canvas-zoom');
const valueLabel = document.getElementById('canvas-zoom-value');
const pointers = new Map();
let view = { zoom: 1, tx: 0, ty: 0 };
let pinch = null;

function clampView(next) {
    const W = zoomLayer.clientWidth;
    const H = zoomLayer.clientHeight;
    const zoom = Math.min(MAX_ZOOM, Math.max(1, next.zoom));
    return {
        zoom,
        tx: Math.min(0, Math.max(W - W * zoom, next.tx)),
        ty: Math.min(0, Math.max(H - H * zoom, next.ty)),
    };
}

function applyView(next) {
    view = clampView(next);
    zoomLayer.style.transform = view.zoom > 1
        ? `translate(${view.tx}px, ${view.ty}px) scale(${view.zoom})`
        : '';
    wrapper.classList.toggle('is-zoomed', view.zoom > 1);
    if (valueLabel) valueLabel.textContent = `${Math.round(view.zoom * 100)}%`;
}

/** Titik tengah foto terpilih dalam koordinat lapisan zoom (sebelum diperbesar). */
function selectedPhotoCenter() {
    const canvas = document.getElementById('composite-canvas');
    const fallback = { x: zoomLayer.clientWidth / 2, y: zoomLayer.clientHeight / 2 };
    if (!canvas?.width || !canvas.clientWidth || !sessionState.layoutId) return fallback;

    const rect = getLayoutGeometry(sessionState.layoutId).photos[Number(sessionState.selectedPhotoIndex) || 0];
    if (!rect) return fallback;

    const scale = canvas.clientWidth / canvas.width;
    return {
        x: canvas.offsetLeft + (rect.x + rect.w / 2) * scale,
        y: canvas.offsetTop + (rect.y + rect.h / 2) * scale,
    };
}

function zoomToSelected(zoom) {
    const focus = selectedPhotoCenter();
    applyView({
        zoom,
        tx: zoomLayer.clientWidth / 2 - focus.x * zoom,
        ty: zoomLayer.clientHeight / 2 - focus.y * zoom,
    });
}

/** Posisi layar → koordinat wrapper tanpa skala kiosk. */
function localPoint(clientX, clientY) {
    const box = wrapper.getBoundingClientRect();
    const ratio = wrapper.clientWidth / box.width || 1;
    return { x: (clientX - box.left) * ratio, y: (clientY - box.top) * ratio };
}

/** Zoom di sekitar satu titik layar (titik itu tetap di tempatnya). */
function zoomAround(point, zoom, from = view) {
    const contentX = (point.x - from.tx) / from.zoom;
    const contentY = (point.y - from.ty) / from.zoom;
    applyView({ zoom, tx: point.x - contentX * zoom, ty: point.y - contentY * zoom });
}

function pointerPair() {
    const [a, b] = [...pointers.values()];
    const pa = localPoint(a.x, a.y);
    const pb = localPoint(b.x, b.y);
    return {
        distance: Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1,
        mid: { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 },
    };
}

export function updateCanvasZoom() {
    if (!zoomLayer) return;
    if (view.zoom > 1) zoomToSelected(view.zoom);
    else applyView(view);
}

export function resetCanvasZoom() {
    if (!zoomLayer) return;
    applyView({ zoom: 1, tx: 0, ty: 0 });
}

export function initCanvasZoom() {
    if (!wrapper || !zoomLayer) return;

    wrapper.querySelectorAll('[data-canvas-zoom]').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.canvasZoom;
            if (action === 'reset') {
                resetCanvasZoom();
                return;
            }
            const next = action === 'in'
                ? ZOOM_STEPS.find(step => step > view.zoom + 0.01) ?? MAX_ZOOM
                : [...ZOOM_STEPS].reverse().find(step => step < view.zoom - 0.01) ?? 1;
            zoomToSelected(next);
        });
    });

    // Gestur dua jari. Didengar saat fase capture agar tetap terbaca walau
    // jari mendarat di atas layer lain (kanvas coretan, layer stiker kosong).
    wrapper.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse') return;
        if (event.target.closest(OWNED_TARGETS)) return;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 2) {
            pinch = { start: { ...view }, ...pointerPair() };
            wrapper.classList.add('is-pinching');
            event.preventDefault();
        }
    }, true);

    wrapper.addEventListener('pointermove', event => {
        if (!pointers.has(event.pointerId)) return;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (!pinch || pointers.size < 2) return;

        event.preventDefault();
        event.stopPropagation();
        const now = pointerPair();
        const zoom = pinch.start.zoom * (now.distance / pinch.distance);
        // Titik konten di bawah titik tengah awal mengikuti titik tengah sekarang
        // (zoom sekaligus geser dua jari).
        const contentX = (pinch.mid.x - pinch.start.tx) / pinch.start.zoom;
        const contentY = (pinch.mid.y - pinch.start.ty) / pinch.start.zoom;
        applyView({ zoom, tx: now.mid.x - contentX * zoom, ty: now.mid.y - contentY * zoom });
    }, true);

    const release = event => {
        pointers.delete(event.pointerId);
        if (pointers.size < 2) {
            pinch = null;
            wrapper.classList.remove('is-pinching');
        }
    };
    wrapper.addEventListener('pointerup', release, true);
    wrapper.addEventListener('pointercancel', release, true);

    wrapper.addEventListener('wheel', event => {
        if (event.target.closest(OWNED_TARGETS)) return;
        event.preventDefault();
        zoomAround(localPoint(event.clientX, event.clientY), view.zoom * (1 - event.deltaY * 0.0015));
    }, { passive: false });

    if ('ResizeObserver' in window) {
        new ResizeObserver(() => applyView(view)).observe(wrapper);
    }
}
