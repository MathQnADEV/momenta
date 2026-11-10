const config = window.PHOTOBOOTH_SETTINGS || {
    templates: [],
    storeUrl: '/photobooth/settings/templates',
    csrfTokenUrl: '/photobooth/settings/csrf-token',
};

const form = document.getElementById('template-form');
const methodInput = document.getElementById('template-method');
const slotsInput = document.getElementById('photo-slots-input');
const editorCanvasWidthInput = document.getElementById('editor-canvas-width');
const editorCanvasHeightInput = document.getElementById('editor-canvas-height');
const nameInput = document.getElementById('template-name');
const descriptionInput = document.getElementById('template-description');
const imageInput = document.getElementById('template-image');
const sortOrderInput = document.getElementById('template-sort-order');
const activeInput = document.getElementById('template-is-active');
const columnsInput = document.getElementById('grid-columns');
const rowsInput = document.getElementById('grid-rows');
const stage = document.getElementById('template-stage');
const stageImage = document.getElementById('template-stage-image');
const stagePlaceholder = document.getElementById('template-stage-placeholder');
const slotLayer = document.getElementById('template-slot-layer');
const dimensionLabel = document.getElementById('canvas-dimension-label');
const slotCountLabel = document.getElementById('slot-count-label');
const selectedSlotLabel = document.getElementById('selected-slot-label');
const slotXInput = document.getElementById('slot-x');
const slotYInput = document.getElementById('slot-y');
const slotWInput = document.getElementById('slot-w');
const slotHInput = document.getElementById('slot-h');
const removeSlotButton = document.getElementById('btn-remove-slot');
const editorModeLabel = document.getElementById('editor-mode-label');
const editorTitle = document.getElementById('editor-title');
const saveButton = document.getElementById('btn-save-template');
const textSlotsInput = document.getElementById('text-slots-input');
const textSlotCountLabel = document.getElementById('text-slot-count-label');
const textSlotFields = document.getElementById('text-slot-fields');
const textLabelInput = document.getElementById('text-slot-label');
const textPlaceholderInput = document.getElementById('text-slot-placeholder');
const textFontInput = document.getElementById('text-slot-font');
const textColorInput = document.getElementById('text-slot-color');
const textAlignInput = document.getElementById('text-slot-align');
const textRotationInput = document.getElementById('text-slot-rotation');
const textMaxLengthInput = document.getElementById('text-slot-max-length');
const textFonts = config.textFonts || {};
let csrfIsFresh = false;

let canvasWidth = 1200;
let canvasHeight = 1800;
let slots = [];
let selectedIndex = null;
// Area teks diisi pelanggan; hanya satu area (foto atau teks) yang terpilih sekaligus.
let textSlots = [];
let selectedTextIndex = null;
let objectUrl = null;
let pointerSession = null;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function setCanvasSize(width, height, scaleExisting = false) {
    const nextWidth = Math.max(1, Math.round(Number(width) || 1));
    const nextHeight = Math.max(1, Math.round(Number(height) || 1));

    if (scaleExisting && slots.length > 0) {
        const scaleX = nextWidth / canvasWidth;
        const scaleY = nextHeight / canvasHeight;
        slots = slots.map(slot => ({
            x: Math.round(slot.x * scaleX),
            y: Math.round(slot.y * scaleY),
            w: Math.max(1, Math.round(slot.w * scaleX)),
            h: Math.max(1, Math.round(slot.h * scaleY)),
        }));
    }

    if (scaleExisting && textSlots.length > 0) {
        const scaleX = nextWidth / canvasWidth;
        const scaleY = nextHeight / canvasHeight;
        textSlots = textSlots.map(slot => ({
            ...slot,
            x: Math.round(slot.x * scaleX),
            y: Math.round(slot.y * scaleY),
            w: Math.max(1, Math.round(slot.w * scaleX)),
            h: Math.max(1, Math.round(slot.h * scaleY)),
        }));
    }

    canvasWidth = nextWidth;
    canvasHeight = nextHeight;
    editorCanvasWidthInput.value = String(canvasWidth);
    editorCanvasHeightInput.value = String(canvasHeight);
    stage.style.aspectRatio = `${canvasWidth} / ${canvasHeight}`;
    dimensionLabel.textContent = `Canvas ${canvasWidth} × ${canvasHeight} px`;
    renderSlots();
}

function normalizeSlot(slot) {
    const w = clamp(Math.round(Number(slot.w) || 1), 1, canvasWidth);
    const h = clamp(Math.round(Number(slot.h) || 1), 1, canvasHeight);
    const x = clamp(Math.round(Number(slot.x) || 0), 0, Math.max(0, canvasWidth - w));
    const y = clamp(Math.round(Number(slot.y) || 0), 0, Math.max(0, canvasHeight - h));
    return { x, y, w, h };
}

function normalizeTextSlot(slot) {
    const fontKeys = Object.keys(textFonts);
    return {
        ...normalizeSlot(slot),
        label: String(slot.label ?? 'Teks').slice(0, 40),
        placeholder: String(slot.placeholder ?? '').slice(0, 80),
        max_length: clamp(parseInt(slot.max_length, 10) || 30, 1, 120),
        font: fontKeys.includes(slot.font) ? slot.font : (fontKeys[0] || 'sans'),
        color: /^#[0-9a-f]{6}$/i.test(slot.color || '') ? slot.color : '#2b2725',
        align: ['left', 'center', 'right'].includes(slot.align) ? slot.align : 'center',
        rotation: clamp(Number(slot.rotation) || 0, -180, 180),
    };
}

function syncHiddenSlots() {
    slotsInput.value = JSON.stringify(slots.map(normalizeSlot));
    slotCountLabel.textContent = String(slots.length);
    textSlotsInput.value = JSON.stringify(textSlots.map(normalizeTextSlot));
    textSlotCountLabel.textContent = String(textSlots.length);
}

function setSelectedIndex(index) {
    selectedIndex = Number.isInteger(index) && slots[index] ? index : null;
    if (selectedIndex !== null) selectedTextIndex = null;
    renderSlots();
    syncInspector();
}

function setSelectedTextIndex(index) {
    selectedTextIndex = Number.isInteger(index) && textSlots[index] ? index : null;
    if (selectedTextIndex !== null) selectedIndex = null;
    renderSlots();
    syncInspector();
}

function selectedArea() {
    if (selectedTextIndex !== null && textSlots[selectedTextIndex]) return textSlots[selectedTextIndex];
    if (selectedIndex !== null && slots[selectedIndex]) return slots[selectedIndex];
    return null;
}

function syncTextFields() {
    const textSlot = selectedTextIndex === null ? null : textSlots[selectedTextIndex];
    textSlotFields.hidden = !textSlot;
    if (!textSlot) return;

    textLabelInput.value = textSlot.label;
    textPlaceholderInput.value = textSlot.placeholder;
    textFontInput.value = textSlot.font;
    textColorInput.value = textSlot.color;
    textAlignInput.value = textSlot.align;
    textRotationInput.value = String(textSlot.rotation);
    textMaxLengthInput.value = String(textSlot.max_length);
}

function syncInspector() {
    const slot = selectedArea();
    const disabled = !slot;

    [slotXInput, slotYInput, slotWInput, slotHInput, removeSlotButton].forEach(element => {
        if (element) element.disabled = disabled;
    });
    syncTextFields();

    if (!slot) {
        selectedSlotLabel.textContent = 'Belum ada';
        [slotXInput, slotYInput, slotWInput, slotHInput].forEach(input => {
            if (input) input.value = '';
        });
        return;
    }

    selectedSlotLabel.textContent = selectedTextIndex !== null
        ? `Teks ${selectedTextIndex + 1}`
        : `Area ${selectedIndex + 1}`;
    slotXInput.value = String(slot.x);
    slotYInput.value = String(slot.y);
    slotWInput.value = String(slot.w);
    slotHInput.value = String(slot.h);
}

function applySlotStyle(element, slot) {
    element.style.left = `${(slot.x / canvasWidth) * 100}%`;
    element.style.top = `${(slot.y / canvasHeight) * 100}%`;
    element.style.width = `${(slot.w / canvasWidth) * 100}%`;
    element.style.height = `${(slot.h / canvasHeight) * 100}%`;
}

function renderSlots() {
    slotLayer.innerHTML = '';

    slots = slots.map(normalizeSlot);

    slots.forEach((slot, index) => {
        const element = document.createElement('button');
        element.type = 'button';
        element.className = `template-photo-slot${index === selectedIndex ? ' is-selected' : ''}`;
        element.dataset.slotIndex = String(index);
        applySlotStyle(element, slot);
        element.innerHTML = `<span>${index + 1}</span><i class="template-slot-resize" aria-hidden="true"></i>`;
        slotLayer.appendChild(element);
    });

    textSlots = textSlots.map(normalizeTextSlot);

    textSlots.forEach((slot, index) => {
        const element = document.createElement('button');
        element.type = 'button';
        element.className = `template-text-slot${index === selectedTextIndex ? ' is-selected' : ''}`;
        element.dataset.textIndex = String(index);
        applySlotStyle(element, slot);
        applyTextPreviewStyle(element, slot);

        const preview = document.createElement('span');
        preview.className = 'template-text-preview';
        preview.textContent = slot.placeholder || slot.label;
        element.append(preview);
        element.insertAdjacentHTML('beforeend', '<i class="template-slot-resize" aria-hidden="true"></i>');
        slotLayer.appendChild(element);
    });

    syncHiddenSlots();
    syncInspector();
}

function applyTextPreviewStyle(element, slot) {
    const font = textFonts[slot.font] || {};
    element.style.transform = `rotate(${slot.rotation}deg)`;
    element.style.color = slot.color;
    element.style.textAlign = slot.align;
    element.style.fontFamily = `"${font.family || 'Outfit'}", ${font.fallback || 'sans-serif'}`;
    element.style.fontWeight = String(font.weight || 600);
}

function selectSlotInPlace(index) {
    selectedIndex = slots[index] ? index : null;
    selectedTextIndex = null;
    highlightSelection();
    syncInspector();
}

function selectTextInPlace(index) {
    selectedTextIndex = textSlots[index] ? index : null;
    selectedIndex = null;
    highlightSelection();
    syncInspector();
}

function highlightSelection() {
    slotLayer.querySelectorAll('.template-photo-slot').forEach(element => {
        element.classList.toggle('is-selected', Number(element.dataset.slotIndex) === selectedIndex);
    });
    slotLayer.querySelectorAll('.template-text-slot').forEach(element => {
        element.classList.toggle('is-selected', Number(element.dataset.textIndex) === selectedTextIndex);
    });
}

function generateGrid() {
    const columns = clamp(parseInt(columnsInput.value, 10) || 1, 1, 6);
    const rows = clamp(parseInt(rowsInput.value, 10) || 1, 1, 8);
    columnsInput.value = String(columns);
    rowsInput.value = String(rows);

    const marginX = Math.round(canvasWidth * 0.06);
    const marginY = Math.round(canvasHeight * 0.06);
    const gapX = Math.max(4, Math.round(canvasWidth * 0.018));
    const gapY = Math.max(4, Math.round(canvasHeight * 0.018));
    const availableWidth = canvasWidth - (marginX * 2) - (gapX * (columns - 1));
    const availableHeight = canvasHeight - (marginY * 2) - (gapY * (rows - 1));
    const cellWidth = Math.max(1, Math.floor(availableWidth / columns));
    const cellHeight = Math.max(1, Math.floor(availableHeight / rows));

    slots = [];
    for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
            slots.push({
                x: marginX + column * (cellWidth + gapX),
                y: marginY + row * (cellHeight + gapY),
                w: cellWidth,
                h: cellHeight,
            });
        }
    }

    selectedIndex = slots.length > 0 ? 0 : null;
    selectedTextIndex = null;
    renderSlots();
}

function addSlot() {
    if (slots.length >= 48) {
        alert('Maksimum 48 area foto dalam satu template.');
        return;
    }

    const width = Math.max(40, Math.round(canvasWidth * 0.34));
    const height = Math.max(40, Math.round(canvasHeight * 0.22));
    const offset = slots.length * Math.round(Math.min(canvasWidth, canvasHeight) * 0.025);
    slots.push(normalizeSlot({
        x: Math.round((canvasWidth - width) / 2) + offset,
        y: Math.round((canvasHeight - height) / 2) + offset,
        w: width,
        h: height,
    }));
    setSelectedIndex(slots.length - 1);
}

function addTextSlot() {
    if (textSlots.length >= 12) {
        alert('Maksimum 12 area teks dalam satu template.');
        return;
    }

    const width = Math.max(40, Math.round(canvasWidth * 0.42));
    const height = Math.max(24, Math.round(canvasHeight * 0.06));
    const offset = textSlots.length * Math.round(Math.min(canvasWidth, canvasHeight) * 0.03);
    textSlots.push(normalizeTextSlot({
        x: Math.round((canvasWidth - width) / 2) + offset,
        y: Math.round(canvasHeight * 0.78) + offset,
        w: width,
        h: height,
        label: textSlots.length ? `Teks ${textSlots.length + 1}` : 'Nama',
        placeholder: 'Nama kamu',
    }));
    setSelectedTextIndex(textSlots.length - 1);
}

function removeSelectedSlot() {
    if (selectedTextIndex !== null && textSlots[selectedTextIndex]) {
        textSlots.splice(selectedTextIndex, 1);
        selectedTextIndex = textSlots.length ? Math.min(selectedTextIndex, textSlots.length - 1) : null;
        renderSlots();
        return;
    }

    if (selectedIndex === null || !slots[selectedIndex]) return;
    slots.splice(selectedIndex, 1);
    selectedIndex = slots.length ? Math.min(selectedIndex, slots.length - 1) : null;
    renderSlots();
}

function showStageImage(url) {
    stageImage.src = url;
    stageImage.hidden = false;
    stagePlaceholder.hidden = true;
}

function clearStageImage() {
    stageImage.removeAttribute('src');
    stageImage.hidden = true;
    stagePlaceholder.hidden = false;
}

function releaseObjectUrl() {
    if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
    }
}

function resetEditor() {
    releaseObjectUrl();
    form.reset();
    form.action = config.storeUrl;
    methodInput.value = 'POST';
    imageInput.required = true;
    activeInput.checked = true;
    sortOrderInput.value = '100';
    columnsInput.value = '2';
    rowsInput.value = '2';
    editorModeLabel.textContent = 'TEMPLATE BARU';
    editorTitle.textContent = 'Buat Template';
    saveButton.textContent = 'Simpan Template';
    document.querySelectorAll('.template-list-card').forEach(card => card.classList.remove('is-editing'));
    clearStageImage();
    slots = [];
    selectedIndex = null;
    textSlots = [];
    selectedTextIndex = null;
    setCanvasSize(1200, 1800);
    generateGrid();
    nameInput.focus();
}

function loadTemplate(template) {
    releaseObjectUrl();
    form.action = template.updateUrl;
    methodInput.value = 'PUT';
    imageInput.required = false;
    imageInput.value = '';
    nameInput.value = template.name || '';
    descriptionInput.value = template.description || '';
    sortOrderInput.value = String(template.sortOrder ?? 100);
    activeInput.checked = Boolean(template.isActive);
    columnsInput.value = String(template.gridColumns || 1);
    rowsInput.value = String(template.gridRows || 1);
    editorModeLabel.textContent = 'EDIT TEMPLATE';
    editorTitle.textContent = template.name || 'Edit Template';
    saveButton.textContent = 'Simpan Perubahan';
    slots = Array.isArray(template.slots)
        ? template.slots.map(slot => ({ ...slot }))
        : [];
    selectedIndex = slots.length ? 0 : null;
    textSlots = Array.isArray(template.textSlots)
        ? template.textSlots.map(slot => ({ ...slot }))
        : [];
    selectedTextIndex = null;
    setCanvasSize(template.canvasWidth || 1200, template.canvasHeight || 1800);
    showStageImage(template.imageUrl);

    document.querySelectorAll('.template-list-card').forEach(card => {
        card.classList.toggle('is-editing', Number(card.dataset.templateCard) === Number(template.id));
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function stagePoint(event) {
    const rect = stage.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * (canvasWidth / rect.width),
        y: (event.clientY - rect.top) * (canvasHeight / rect.height),
    };
}

slotLayer.addEventListener('pointerdown', event => {
    const slotElement = event.target.closest('.template-photo-slot, .template-text-slot');
    if (!slotElement) return;

    event.preventDefault();
    const isText = slotElement.classList.contains('template-text-slot');
    const index = Number(isText ? slotElement.dataset.textIndex : slotElement.dataset.slotIndex);
    const list = isText ? textSlots : slots;
    if (!list[index]) return;

    if (isText) selectTextInPlace(index);
    else selectSlotInPlace(index);

    const point = stagePoint(event);
    pointerSession = {
        pointerId: event.pointerId,
        isText,
        index,
        mode: event.target.closest('.template-slot-resize') ? 'resize' : 'move',
        startX: point.x,
        startY: point.y,
        slot: { ...list[index] },
        element: slotElement,
    };
    slotElement.setPointerCapture(event.pointerId);
});

slotLayer.addEventListener('pointermove', event => {
    if (!pointerSession || pointerSession.pointerId !== event.pointerId) return;
    event.preventDefault();

    const point = stagePoint(event);
    const dx = point.x - pointerSession.startX;
    const dy = point.y - pointerSession.startY;
    const base = pointerSession.slot;
    const next = pointerSession.mode === 'move'
        ? { ...base, x: base.x + dx, y: base.y + dy }
        : { ...base, w: base.w + dx, h: base.h + dy };

    if (pointerSession.isText) {
        textSlots[pointerSession.index] = normalizeTextSlot(next);
        applySlotStyle(pointerSession.element, textSlots[pointerSession.index]);
    } else {
        slots[pointerSession.index] = normalizeSlot(next);
        applySlotStyle(pointerSession.element, slots[pointerSession.index]);
    }

    syncHiddenSlots();
    syncInspector();
});

function stopPointerSession(event) {
    if (!pointerSession || pointerSession.pointerId !== event.pointerId) return;
    pointerSession = null;
    renderSlots();
}

slotLayer.addEventListener('pointerup', stopPointerSession);
slotLayer.addEventListener('pointercancel', stopPointerSession);

[slotXInput, slotYInput, slotWInput, slotHInput].forEach(input => {
    input.addEventListener('input', () => {
        const geometry = {
            x: slotXInput.value,
            y: slotYInput.value,
            w: slotWInput.value,
            h: slotHInput.value,
        };

        if (selectedTextIndex !== null && textSlots[selectedTextIndex]) {
            textSlots[selectedTextIndex] = normalizeTextSlot({ ...textSlots[selectedTextIndex], ...geometry });
            renderSlots();
            return;
        }

        if (selectedIndex === null || !slots[selectedIndex]) return;
        slots[selectedIndex] = normalizeSlot(geometry);
        renderSlots();
    });
});

[
    [textLabelInput, 'label'],
    [textPlaceholderInput, 'placeholder'],
    [textFontInput, 'font'],
    [textColorInput, 'color'],
    [textAlignInput, 'align'],
    [textRotationInput, 'rotation'],
    [textMaxLengthInput, 'max_length'],
].forEach(([input, key]) => {
    input?.addEventListener('input', () => {
        if (selectedTextIndex === null || !textSlots[selectedTextIndex]) return;
        textSlots[selectedTextIndex] = normalizeTextSlot({ ...textSlots[selectedTextIndex], [key]: input.value });

        // Elemen di kanvas diperbarui langsung agar fokus input inspektur tidak hilang.
        const element = slotLayer.querySelector(`.template-text-slot[data-text-index="${selectedTextIndex}"]`);
        const slot = textSlots[selectedTextIndex];
        if (element) {
            applyTextPreviewStyle(element, slot);
            element.querySelector('.template-text-preview').textContent = slot.placeholder || slot.label;
        }
        syncHiddenSlots();
    });
});

imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file) return;

    releaseObjectUrl();
    objectUrl = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
        const hadSlots = slots.length > 0;
        setCanvasSize(probe.naturalWidth, probe.naturalHeight, hadSlots);
        showStageImage(objectUrl);
        if (!hadSlots) generateGrid();
    };
    probe.onerror = () => {
        alert('Gambar template tidak dapat dibaca. Gunakan PNG, JPG, atau WebP yang valid.');
        imageInput.value = '';
        releaseObjectUrl();
    };
    probe.src = objectUrl;
});

document.getElementById('btn-generate-grid')?.addEventListener('click', generateGrid);
document.getElementById('btn-add-slot')?.addEventListener('click', addSlot);
document.getElementById('btn-add-text-slot')?.addEventListener('click', addTextSlot);
document.getElementById('btn-new-template')?.addEventListener('click', resetEditor);
document.getElementById('btn-reset-editor')?.addEventListener('click', resetEditor);
removeSlotButton?.addEventListener('click', removeSelectedSlot);

document.querySelectorAll('[data-edit-template]').forEach(button => {
    button.addEventListener('click', () => {
        const template = config.templates.find(item => Number(item.id) === Number(button.dataset.editTemplate));
        if (template) loadTemplate(template);
    });
});

form.addEventListener('submit', async event => {
    syncHiddenSlots();
    if (slots.length < 1) {
        event.preventDefault();
        alert('Buat minimal satu area foto sebelum menyimpan template.');
        return;
    }

    if (methodInput.value === 'POST' && !imageInput.files?.length) {
        event.preventDefault();
        alert('Pilih gambar template terlebih dahulu.');
        return;
    }

    if (csrfIsFresh) return;

    event.preventDefault();
    saveButton.disabled = true;

    try {
        const response = await fetch(config.csrfTokenUrl, {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const { token } = await response.json();
        if (!token) throw new Error('Token CSRF kosong');

        form.querySelector('input[name="_token"]').value = token;
        csrfIsFresh = true;
        form.requestSubmit(saveButton);
    } catch (error) {
        saveButton.disabled = false;
        alert('Sesi pengaturan tidak dapat diperbarui. Muat ulang halaman lalu coba lagi.');
    }
});

resetEditor();
