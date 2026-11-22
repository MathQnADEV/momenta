import { sessionState } from './state.js';
import { composePhotoStrip, getLayoutGeometry } from './compose.js';
import { calculateCrop, isCaptureInProgress } from './camera.js';

/*
 * Pratinjau template di langkah Foto.
 * - Foto yang sudah diambil langsung tampil di slotnya (hasil compose asli).
 * - Slot yang sedang diisi menampilkan kamera live, dipotong sama persis
 *   seperti hasil jepretan (potong tengah sesuai rasio slot).
 * - Kotak kamera besar diberi garis panduan area yang masuk ke slot.
 */

const template = document.getElementById('capture-template');
const canvas = document.getElementById('capture-template-canvas');
const live = document.getElementById('capture-template-live');
const overlay = document.getElementById('capture-template-overlay');
const slotsLayer = document.getElementById('capture-template-slots');
const targetLabel = document.getElementById('capture-target-label');
const hint = document.getElementById('capture-preview-hint');
const cameraVideo = document.getElementById('camera-video');
const viewport = cameraVideo?.closest('.camera-viewport');
const guide = document.getElementById('capture-guide');

let onRetake = () => {};
let activeIndex = null;
let renderToken = 0;

function layoutConfig() {
    return window.PHOTOBOOTH_CONFIG?.layouts?.[sessionState.layoutId] || null;
}

function frameConfig() {
    const frameId = sessionState.frameId;
    return frameId && frameId !== 'none' ? window.PHOTOBOOTH_CONFIG?.frames?.[frameId] || null : null;
}

/** Slot yang sedang/akan diisi: slot aktif saat jepret, atau slot kosong pertama. */
function targetIndex() {
    if (activeIndex !== null) return activeIndex;
    const index = sessionState.poses.findIndex(pose => !pose);
    return index === -1 ? null : index;
}

function percentRect(rect, geometry) {
    return {
        left: `${(rect.x / geometry.canvas.w) * 100}%`,
        top: `${(rect.y / geometry.canvas.h) * 100}%`,
        width: `${(rect.w / geometry.canvas.w) * 100}%`,
        height: `${(rect.h / geometry.canvas.h) * 100}%`,
    };
}

function syncLiveStream() {
    if (!live || !cameraVideo) return;
    const stream = cameraVideo.srcObject;
    if (live.srcObject !== stream) live.srcObject = stream || null;
    if (stream) live.play?.().catch(() => {});
}

/** Garis panduan di kotak kamera: area video yang masuk ke slot target. */
export function updateCaptureGuide() {
    if (!guide || !viewport || !cameraVideo) return;

    const index = targetIndex();
    const geometry = layoutConfig() ? getLayoutGeometry(sessionState.layoutId) : null;
    const rect = index === null ? null : geometry?.photos[index];
    const videoW = cameraVideo.videoWidth;
    const videoH = cameraVideo.videoHeight;
    const boxW = viewport.clientWidth;
    const boxH = viewport.clientHeight;

    if (!rect || !videoW || !videoH || !boxW || !boxH) {
        guide.hidden = true;
        return;
    }

    // Video memakai object-fit: cover di kotak kamera.
    const scale = Math.max(boxW / videoW, boxH / videoH);
    const offsetX = (boxW - videoW * scale) / 2;
    const offsetY = (boxH - videoH * scale) / 2;
    const crop = calculateCrop(videoW, videoH, rect.w / rect.h);

    const left = Math.max(0, offsetX + crop.sourceX * scale);
    const top = Math.max(0, offsetY + crop.sourceY * scale);
    const right = Math.min(boxW, offsetX + (crop.sourceX + crop.sourceWidth) * scale);
    const bottom = Math.min(boxH, offsetY + (crop.sourceY + crop.sourceHeight) * scale);

    guide.hidden = false;
    guide.style.left = `${left}px`;
    guide.style.top = `${top}px`;
    guide.style.width = `${right - left}px`;
    guide.style.height = `${bottom - top}px`;
}

function renderSlots(geometry) {
    const target = targetIndex();
    const capturing = isCaptureInProgress();
    slotsLayer.replaceChildren();

    geometry.photos.forEach((rect, index) => {
        const captured = Boolean(sessionState.poses[index]);
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = 'capture-slot';
        slot.dataset.pose = String(index);
        slot.classList.toggle('is-target', index === target);
        slot.classList.toggle('is-captured', captured);
        slot.disabled = capturing || !captured;
        slot.setAttribute('aria-label', captured ? `Ulang Foto ${index + 1}` : `Slot Foto ${index + 1}`);
        Object.assign(slot.style, percentRect(rect, geometry));

        const number = document.createElement('span');
        number.className = 'capture-slot-num';
        number.textContent = String(index + 1);

        const retake = document.createElement('span');
        retake.className = 'capture-slot-retake';
        retake.textContent = 'Ulang';

        slot.append(number, retake);
        slotsLayer.append(slot);
    });

    const rect = target === null ? null : geometry.photos[target];
    if (live) {
        live.hidden = !rect;
        if (rect) Object.assign(live.style, percentRect(rect, geometry));
    }

    if (targetLabel) {
        const total = geometry.photos.length;
        const done = sessionState.poses.filter(Boolean).length;
        targetLabel.textContent = target === null
            ? `Semua ${total} foto terisi`
            : `Foto ${target + 1} dari ${total}`;
        targetLabel.classList.toggle('is-done', target === null);
        if (hint) hint.hidden = done === 0;
    }
}

/** Gambar ulang pratinjau (latar + foto yang sudah ada + bingkai template). */
export async function renderCapturePreview() {
    if (!template || !canvas || !layoutConfig()) return;

    const token = ++renderToken;
    const geometry = getLayoutGeometry(sessionState.layoutId);
    template.style.aspectRatio = `${geometry.canvas.w} / ${geometry.canvas.h}`;

    const frame = frameConfig();
    if (overlay) {
        const overlayUrl = frame && frame.type !== 'background' && frame.overlay ? `/${frame.overlay}` : '';
        overlay.hidden = !overlayUrl;
        if (overlayUrl && overlay.getAttribute('src') !== overlayUrl) overlay.src = overlayUrl;
    }

    renderSlots(geometry);
    syncLiveStream();
    updateCaptureGuide();

    // composePhotoStrip menyimpan hasilnya ke sessionState; kembalikan setelah selesai
    // agar pratinjau ini tidak mengganggu langkah berikutnya.
    const previous = sessionState.compositeCanvas;
    try {
        const composed = await composePhotoStrip(sessionState.poses, sessionState.bgStyle);
        if (token !== renderToken) return;
        canvas.width = composed.width;
        canvas.height = composed.height;
        canvas.getContext('2d').drawImage(composed, 0, 0);
    } catch (error) {
        console.error('Gagal menggambar pratinjau template:', error);
    } finally {
        sessionState.compositeCanvas = previous;
    }
}

export function initCapturePreview(options = {}) {
    onRetake = options.onRetake || (() => {});

    slotsLayer?.addEventListener('click', event => {
        const slot = event.target.closest('.capture-slot');
        if (!slot || slot.disabled) return;
        onRetake(Number(slot.dataset.pose));
    });

    document.addEventListener('photobooth:capture-target', event => {
        activeIndex = event.detail.index;
        if (sessionState.step === 'capture') renderCapturePreview();
    });
    document.addEventListener('photobooth:pose-captured', () => {
        activeIndex = null;
        if (sessionState.step === 'capture') renderCapturePreview();
    });
    document.addEventListener('photobooth:capture-idle', () => {
        activeIndex = null;
        if (sessionState.step === 'capture') renderCapturePreview();
    });
    document.addEventListener('photobooth:camera-ready', () => {
        syncLiveStream();
        updateCaptureGuide();
    });

    cameraVideo?.addEventListener('loadedmetadata', updateCaptureGuide);
    if (viewport && 'ResizeObserver' in window) {
        new ResizeObserver(updateCaptureGuide).observe(viewport);
    }
}
