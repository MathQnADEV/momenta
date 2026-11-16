import { sessionState } from './state.js';
import { getLayoutGeometry, effectivePhotoZoom } from './compose.js';

/*
 * Mengatur posisi foto di dalam slotnya seperti memilih foto profil:
 * geser, zoom (slider, scroll, cubit dua jari), dan putar 360°.
 * Nilai disimpan per foto di photoEdits[i].transform:
 *   { zoom, rotation (derajat), x, y (geser relatif terhadap lebar/tinggi slot) }
 */

const MAX_ZOOM = 4;

const layer = document.getElementById('photo-adjust-layer');
const wrapper = document.getElementById('canvas-wrapper');
const pointers = new Map();
const imageSizes = new Map();
let onChange = () => {};
let onSync = () => {};
let enabled = false;
let gesture = null;

function compositeElement() {
    return document.getElementById('composite-canvas');
}

function selectedIndex() {
    return Number(sessionState.selectedPhotoIndex) || 0;
}

function selectedRect() {
    return getLayoutGeometry(sessionState.layoutId).photos[selectedIndex()] || null;
}

export function selectedTransform() {
    const edit = sessionState.photoEdits?.[selectedIndex()];
    if (!edit) return null;
    edit.transform = { zoom: 1, rotation: 0, x: 0, y: 0, ...(edit.transform || {}) };
    return edit.transform;
}

function loadImageSize(index) {
    const source = sessionState.poses[index];
    if (!source) return Promise.resolve(null);
    const cached = imageSizes.get(index);
    if (cached?.source === source) return cached.promise;

    const promise = new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve(null);
        img.src = source;
    });
    imageSizes.set(index, { source, promise });
    return promise;
}

function normalizeAngle(angle) {
    let value = ((angle + 180) % 360 + 360) % 360 - 180;
    if (value === -180) value = 180;
    return Math.round(value * 10) / 10;
}

/**
 * Batasi zoom/putar, lalu batasi geseran agar foto tidak keluar dari slot.
 */
async function applyTransform(partial) {
    const transform = selectedTransform();
    const rect = selectedRect();
    if (!transform || !rect) return;

    Object.assign(transform, partial);
    transform.zoom = Math.max(1, Math.min(MAX_ZOOM, Number(transform.zoom) || 1));
    transform.rotation = normalizeAngle(Number(transform.rotation) || 0);

    const size = await loadImageSize(selectedIndex());
    if (size) {
        const { base, zoom } = effectivePhotoZoom(rect, size.w, size.h, transform);
        const maxX = Math.max(0, (size.w * base * zoom - rect.w) / 2) / rect.w;
        const maxY = Math.max(0, (size.h * base * zoom - rect.h) / 2) / rect.h;
        transform.x = Math.max(-maxX, Math.min(maxX, Number(transform.x) || 0));
        transform.y = Math.max(-maxY, Math.min(maxY, Number(transform.y) || 0));
    }

    onSync(transform);
    onChange();
}

export function updateSelectedTransform(partial) {
    return applyTransform(partial);
}

export function resetSelectedTransform() {
    return applyTransform({ zoom: 1, rotation: 0, x: 0, y: 0 });
}

export function renderPhotoAdjust() {
    if (!layer) return;
    layer.replaceChildren();

    const canvas = compositeElement();
    const rect = selectedRect();
    if (!enabled || !rect || !canvas?.width || !canvas.clientWidth) return;

    layer.style.left = `${canvas.offsetLeft}px`;
    layer.style.top = `${canvas.offsetTop}px`;
    layer.style.width = `${canvas.clientWidth}px`;
    layer.style.height = `${canvas.clientHeight}px`;
    const scale = canvas.clientWidth / canvas.width;

    const box = document.createElement('div');
    box.className = 'photo-adjust-box';
    box.style.left = `${rect.x * scale}px`;
    box.style.top = `${rect.y * scale}px`;
    box.style.width = `${rect.w * scale}px`;
    box.style.height = `${rect.h * scale}px`;

    const tag = document.createElement('span');
    tag.className = 'photo-adjust-tag';
    tag.textContent = `Foto ${selectedIndex() + 1}`;

    const rotate = document.createElement('i');
    rotate.className = 'photo-adjust-rotate';
    rotate.setAttribute('aria-hidden', 'true');

    box.append(tag, rotate);
    layer.append(box);
    loadImageSize(selectedIndex());
}

export function setPhotoAdjustEnabled(value) {
    enabled = Boolean(value);
    layer?.classList.toggle('is-active', enabled);
    pointers.clear();
    gesture = null;
    renderPhotoAdjust();
}

function pointerPair() {
    const [a, b] = [...pointers.values()];
    return {
        distance: Math.hypot(b.x - a.x, b.y - a.y) || 1,
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    };
}

function startGesture(event) {
    const box = layer.querySelector('.photo-adjust-box');
    const canvas = compositeElement();
    const rect = selectedRect();
    const transform = selectedTransform();
    if (!box || !canvas || !rect || !transform) return;

    const boxRect = box.getBoundingClientRect();
    const centerX = boxRect.left + boxRect.width / 2;
    const centerY = boxRect.top + boxRect.height / 2;
    const start = { ...transform };
    // Piksel layar → piksel kanvas, termasuk saat tampilan kiosk diperkecil.
    const ratio = canvas.width / canvas.getBoundingClientRect().width;

    if (pointers.size >= 2) {
        gesture = { mode: 'pinch', start, ...pointerPair() };
    } else if (event.target.closest('.photo-adjust-rotate')) {
        gesture = {
            mode: 'rotate',
            start,
            centerX,
            centerY,
            angle: (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI,
        };
    } else {
        gesture = { mode: 'pan', start, startX: event.clientX, startY: event.clientY, ratio, rect };
    }
}

export function initPhotoAdjust(options = {}) {
    onChange = options.onChange || (() => {});
    onSync = options.onSync || (() => {});
    if (!layer) return;

    layer.addEventListener('pointerdown', event => {
        if (!event.target.closest('.photo-adjust-box')) return;
        event.preventDefault();
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        event.target.closest('.photo-adjust-box').setPointerCapture(event.pointerId);
        startGesture(event);
    });

    layer.addEventListener('pointermove', event => {
        if (!gesture || !pointers.has(event.pointerId)) return;
        event.preventDefault();
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const { start } = gesture;

        if (gesture.mode === 'pinch' && pointers.size >= 2) {
            const now = pointerPair();
            applyTransform({
                zoom: start.zoom * (now.distance / gesture.distance),
                rotation: start.rotation + (now.angle - gesture.angle),
            });
        } else if (gesture.mode === 'rotate') {
            const angle = (Math.atan2(event.clientY - gesture.centerY, event.clientX - gesture.centerX) * 180) / Math.PI;
            applyTransform({ rotation: start.rotation + (angle - gesture.angle) });
        } else if (gesture.mode === 'pan') {
            const dx = (event.clientX - gesture.startX) * gesture.ratio;
            const dy = (event.clientY - gesture.startY) * gesture.ratio;
            applyTransform({ x: start.x + dx / gesture.rect.w, y: start.y + dy / gesture.rect.h });
        }
    });

    const stop = event => {
        pointers.delete(event.pointerId);
        gesture = null;
        // Sisa satu jari setelah cubit: lanjutkan sebagai geser dari posisi sekarang.
        if (pointers.size === 1) {
            const [pointerId, point] = [...pointers.entries()][0];
            startGesture({ pointerId, clientX: point.x, clientY: point.y, target: layer.querySelector('.photo-adjust-box') });
        }
    };
    layer.addEventListener('pointerup', stop);
    layer.addEventListener('pointercancel', stop);

    layer.addEventListener('wheel', event => {
        if (!enabled || !event.target.closest('.photo-adjust-box')) return;
        event.preventDefault();
        const transform = selectedTransform();
        if (!transform) return;
        applyTransform({ zoom: transform.zoom * (1 - event.deltaY * 0.0015) });
    }, { passive: false });

    if (wrapper && 'ResizeObserver' in window) {
        new ResizeObserver(() => {
            if (enabled && !gesture) renderPhotoAdjust();
        }).observe(wrapper);
    }
}
