import { sessionState } from './state.js';
import { effectiveTextSlots } from './compose.js';

/*
 * Kotak teks yang bisa digeser dan diubah ukurannya oleh pelanggan di atas
 * kanvas hias. Posisi disimpan dalam piksel kanvas template (bukan layar),
 * sehingga hasilnya sama di laptop, tablet, maupun kiosk 1080 × 1920.
 */

const MIN_WIDTH = 40;
const MIN_HEIGHT = 20;
const SNAP_DEGREES = 4;

/**
 * Sudut dari pusat kotak ke pointer, 0° = tegak. Menempel ke kelipatan 90°
 * bila cukup dekat agar teks mudah diluruskan kembali.
 */
export function pointerAngle(centerX, centerY, clientX, clientY) {
    let angle = (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI + 90;
    if (angle > 180) angle -= 360;
    const nearest = Math.round(angle / 90) * 90;
    if (Math.abs(angle - nearest) <= SNAP_DEGREES) angle = nearest === -180 ? 180 : nearest;
    return Math.round(angle * 10) / 10;
}

const layer = document.getElementById('text-layer');
const wrapper = document.getElementById('canvas-wrapper');
let onChange = () => {};
let pointerSession = null;
let enabled = false;

function compositeElement() {
    return document.getElementById('composite-canvas');
}

function templateTextSlots() {
    const frame = window.PHOTOBOOTH_CONFIG?.frames?.[sessionState.frameId];
    return Array.isArray(frame?.texts) ? frame.texts : [];
}

function setOverride(index, values) {
    sessionState.textOverrides = {
        ...sessionState.textOverrides,
        [index]: { ...(sessionState.textOverrides?.[index] || {}), ...values },
    };
}

function placeBox(box, slot, scale) {
    box.style.left = `${slot.x * scale}px`;
    box.style.top = `${slot.y * scale}px`;
    box.style.width = `${slot.w * scale}px`;
    box.style.height = `${slot.h * scale}px`;
    box.style.transform = `rotate(${Number(slot.rotation) || 0}deg)`;
}

export function renderTextBoxes() {
    if (!layer) return;
    layer.replaceChildren();

    const canvas = compositeElement();
    if (!enabled || !canvas?.width || !canvas.clientWidth) return;

    // Layer mengikuti area kanvas yang terlihat di dalam wrapper.
    layer.style.left = `${canvas.offsetLeft}px`;
    layer.style.top = `${canvas.offsetTop}px`;
    layer.style.width = `${canvas.clientWidth}px`;
    layer.style.height = `${canvas.clientHeight}px`;
    const scale = canvas.clientWidth / canvas.width;

    effectiveTextSlots(templateTextSlots()).forEach((slot, index) => {
        const box = document.createElement('div');
        const filled = String(sessionState.textValues?.[index] ?? '').trim() !== '';
        box.className = `text-box${filled ? '' : ' is-empty'}`;
        box.dataset.textIndex = String(index);
        placeBox(box, slot, scale);

        const tag = document.createElement('span');
        tag.className = 'text-box-tag';
        tag.textContent = slot.label || `Teks ${index + 1}`;

        const handle = document.createElement('i');
        handle.className = 'text-box-resize';
        handle.setAttribute('aria-hidden', 'true');

        const rotate = document.createElement('i');
        rotate.className = 'text-box-rotate';
        rotate.setAttribute('aria-hidden', 'true');

        box.append(tag, handle, rotate);
        layer.append(box);
    });
}

export function setTextLayerEnabled(value) {
    enabled = Boolean(value);
    layer?.classList.toggle('is-active', enabled);
    renderTextBoxes();
}

export function resetTextPositions() {
    sessionState.textOverrides = {};
    renderTextBoxes();
    onChange();
}

export function initTextLayer(options = {}) {
    onChange = options.onChange || (() => {});
    if (!layer) return;

    layer.addEventListener('pointerdown', event => {
        const box = event.target.closest('.text-box');
        const canvas = compositeElement();
        if (!box || !canvas) return;

        event.preventDefault();
        const index = Number(box.dataset.textIndex);
        const slot = effectiveTextSlots(templateTextSlots())[index];
        if (!slot) return;

        const boxRect = box.getBoundingClientRect();
        let mode = 'move';
        if (event.target.closest('.text-box-resize')) mode = 'resize';
        if (event.target.closest('.text-box-rotate')) mode = 'rotate';

        pointerSession = {
            pointerId: event.pointerId,
            index,
            box,
            mode,
            centerX: boxRect.left + boxRect.width / 2,
            centerY: boxRect.top + boxRect.height / 2,
            startX: event.clientX,
            startY: event.clientY,
            slot,
            // Piksel layar → piksel kanvas, termasuk saat tampilan kiosk diperkecil.
            ratio: canvas.width / canvas.getBoundingClientRect().width,
            scale: canvas.clientWidth / canvas.width,
            canvasW: canvas.width,
            canvasH: canvas.height,
        };
        box.classList.add('is-dragging');
        box.setPointerCapture(event.pointerId);
    });

    layer.addEventListener('pointermove', event => {
        if (!pointerSession || pointerSession.pointerId !== event.pointerId) return;
        event.preventDefault();

        const { slot, ratio, canvasW, canvasH } = pointerSession;
        const dx = (event.clientX - pointerSession.startX) * ratio;
        const dy = (event.clientY - pointerSession.startY) * ratio;
        let next;

        if (pointerSession.mode === 'rotate') {
            next = {
                rotation: pointerAngle(pointerSession.centerX, pointerSession.centerY, event.clientX, event.clientY),
            };
        } else if (pointerSession.mode === 'move') {
            next = {
                x: Math.round(Math.max(0, Math.min(canvasW - slot.w, slot.x + dx))),
                y: Math.round(Math.max(0, Math.min(canvasH - slot.h, slot.y + dy))),
            };
        } else {
            next = {
                w: Math.round(Math.max(MIN_WIDTH, Math.min(canvasW - slot.x, slot.w + dx))),
                h: Math.round(Math.max(MIN_HEIGHT, Math.min(canvasH - slot.y, slot.h + dy))),
            };
        }

        setOverride(pointerSession.index, next);
        placeBox(pointerSession.box, { ...slot, ...next }, pointerSession.scale);
        onChange();
    });

    const stop = event => {
        if (!pointerSession || pointerSession.pointerId !== event.pointerId) return;
        pointerSession.box.classList.remove('is-dragging');
        pointerSession = null;
        onChange();
    };
    layer.addEventListener('pointerup', stop);
    layer.addEventListener('pointercancel', stop);

    if (wrapper && 'ResizeObserver' in window) {
        new ResizeObserver(() => {
            if (enabled && !pointerSession) renderTextBoxes();
        }).observe(wrapper);
    }
}
