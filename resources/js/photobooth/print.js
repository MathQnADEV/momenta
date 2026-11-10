import { sessionState } from './state.js';
import { renderProcessedPose, findPersonFocus } from './compose.js';

/*
 * Alur cetak fisik: pilih paket → atur kartu/ganci → bayar → cetak lembar 4R.
 * Semua item dari satu paket digambar pada satu lembar 4R 300 DPI dengan garis potong.
 */

const INK = '#2b2725';
const INK_MUTED = '#6f645d';
const CREAM = '#fffdf9';
const CREAM_DEEP = '#f6f1e8';
const ROSE = '#b9636c';
const FONT = '"Outfit", sans-serif';

const printState = {
    stage: 'package',
    packageCode: null,
    cardMode: 'different',
    cardSources: [0, 1],
    cardDesign: 'plain',
    cardData: { name: '', nim: '', prodi: '', title: '', date: '' },
    keychainFront: 0,
    keychainBackMode: 'photo',
    keychainBack: 1,
    keychainQuote: '',
    order: null,
    sheetCanvas: null,
};

let onExit = () => {};
let renderToken = 0;
let renderDebounce = null;
let pollTimer = null;
let finalImageCanvas = null;
let logoPromise = null;
const poseCache = new Map();
const focusCache = new Map();

const priceFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function printConfig() {
    return window.PHOTOBOOTH_CONFIG?.print || {};
}

function mmToPx(mm) {
    return Math.round((mm * (printConfig().dpi || 300)) / 25.4);
}

function currentPackage() {
    return printConfig().packages?.[printState.packageCode] || null;
}

function packageHas(item) {
    return (currentPackage()?.items || []).includes(item);
}

function poseCount() {
    return sessionState.poses.filter(Boolean).length;
}

function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
        if (value === undefined || value === null || value === false) return;
        if (key === 'text') node.textContent = value;
        else if (key === 'class') node.className = value;
        else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
        else node.setAttribute(key, value === true ? '' : value);
    });
    [].concat(children).filter(Boolean).forEach(child => node.append(child));
    return node;
}

function todayLabel() {
    return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Sumber gambar ────────────────────────────────────────────────────────────

function processedPose(index) {
    if (!poseCache.has(index)) poseCache.set(index, renderProcessedPose(index));
    return poseCache.get(index);
}

function personFocus(index) {
    if (!focusCache.has(index)) focusCache.set(index, findPersonFocus(index));
    return focusCache.get(index);
}

function loadLogo() {
    if (!logoPromise) {
        logoPromise = new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = window.PHOTOBOOTH_CONFIG?.logoUrl || '';
        });
    }
    return logoPromise;
}

async function sourceImage(source) {
    if (source === 'final') return finalImageCanvas;
    return processedPose(Number(source));
}

/**
 * Crop "cover" yang menjaga orang tetap di tengah. zoom < 1 memperbesar ke wajah.
 */
function drawFocusedCover(ctx, img, x, y, w, h, focus, zoom = 1) {
    const ratio = w / h;
    let sh = img.height * Math.min(1, zoom);
    let sw = sh * ratio;
    if (sw > img.width) {
        sw = img.width;
        sh = sw / ratio;
    }

    const cx = (focus?.x ?? 0.5) * img.width;
    const cy = (focus?.y ?? 0.42) * img.height;
    // Wajah diletakkan sedikit di atas tengah area foto.
    const sx = Math.max(0, Math.min(img.width - sw, cx - sw / 2));
    const sy = Math.max(0, Math.min(img.height - sh, cy - sh * 0.42));

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawContain(ctx, img, x, y, w, h) {
    const scale = Math.min(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function wrapLines(ctx, text, maxWidth, maxLines) {
    const words = String(text).trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';

    words.forEach(word => {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx.measureText(candidate).width <= maxWidth || !line) {
            line = candidate;
        } else {
            lines.push(line);
            line = word;
        }
    });
    if (line) lines.push(line);

    if (lines.length > maxLines) {
        const kept = lines.slice(0, maxLines);
        let last = kept[maxLines - 1];
        while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
        kept[maxLines - 1] = `${last}…`;
        return kept;
    }
    return lines;
}

// ── Gambar item ──────────────────────────────────────────────────────────────

async function renderPhotocard(source) {
    const size = printConfig().photocard || { width_mm: 54, height_mm: 86 };
    const W = mmToPx(size.width_mm);
    const H = mmToPx(size.height_mm);
    const canvas = el('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H);

    const pad = Math.round(W * 0.05);
    const withData = printState.cardDesign === 'data';
    const photo = { x: pad, y: pad, w: W - pad * 2, h: Math.round(H * (withData ? 0.6 : 0.7)) };

    const img = await sourceImage(source);
    if (img) {
        if (source === 'final') {
            ctx.fillStyle = CREAM_DEEP;
            ctx.fillRect(photo.x, photo.y, photo.w, photo.h);
            drawContain(ctx, img, photo.x, photo.y, photo.w, photo.h);
        } else {
            drawFocusedCover(ctx, img, photo.x, photo.y, photo.w, photo.h, await personFocus(Number(source)));
        }
    }

    const footerTop = photo.y + photo.h;
    const footerH = H - pad - footerTop;
    const logo = await loadLogo();
    const date = printState.cardData.date.trim() || todayLabel();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    if (!withData) {
        if (logo) {
            const logoH = footerH * 0.68;
            const logoW = Math.min(W * 0.7, logoH * (logo.width / logo.height));
            const drawH = logoW * (logo.height / logo.width);
            ctx.drawImage(logo, (W - logoW) / 2, footerTop + footerH * 0.04, logoW, drawH);
        }
        ctx.fillStyle = INK_MUTED;
        ctx.font = `500 ${Math.round(W * 0.034)}px ${FONT}`;
        ctx.fillText(date, W / 2, H - pad - Math.round(W * 0.01));
        return canvas;
    }

    const { name, nim, prodi, title } = printState.cardData;
    const maxWidth = W - pad * 2;
    let y = footerTop + Math.round(W * 0.085);

    if (name.trim()) {
        ctx.fillStyle = INK;
        ctx.font = `700 ${Math.round(W * 0.056)}px ${FONT}`;
        ctx.fillText(wrapLines(ctx, name, maxWidth, 1)[0], W / 2, y);
        y += Math.round(W * 0.06);
    }

    const idLine = [nim.trim(), prodi.trim()].filter(Boolean).join(' · ');
    if (idLine) {
        ctx.fillStyle = INK_MUTED;
        ctx.font = `500 ${Math.round(W * 0.036)}px ${FONT}`;
        ctx.fillText(wrapLines(ctx, idLine, maxWidth, 1)[0], W / 2, y);
        y += Math.round(W * 0.055);
    }

    if (title.trim()) {
        ctx.fillStyle = INK;
        ctx.font = `italic 400 ${Math.round(W * 0.033)}px ${FONT}`;
        wrapLines(ctx, `“${title.trim()}”`, maxWidth, 2).forEach(line => {
            ctx.fillText(line, W / 2, y);
            y += Math.round(W * 0.045);
        });
    }

    const bottom = H - pad;
    ctx.fillStyle = ROSE;
    ctx.font = `600 ${Math.round(W * 0.03)}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(date, pad, bottom - Math.round(W * 0.012));

    if (logo) {
        const logoW = W * 0.3;
        const logoH = logoW * (logo.height / logo.width);
        ctx.drawImage(logo, W - pad - logoW, bottom - logoH, logoW, logoH);
    }
    return canvas;
}

async function renderKeychainPhoto(index) {
    const size = printConfig().keychain || { width_mm: 28, height_mm: 40 };
    const W = mmToPx(size.width_mm);
    const H = mmToPx(size.height_mm);
    const canvas = el('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H);

    const img = await processedPose(index);
    const focus = await personFocus(index);
    // Close-up: tinggi crop sekitar 70% tinggi orang agar wajah memenuhi sisipan.
    const zoom = focus ? Math.max(0.35, Math.min(1, focus.height * 0.7)) : 1;
    drawFocusedCover(ctx, img, 0, 0, W, H, focus, zoom);
    return canvas;
}

async function renderKeychainQuote() {
    const size = printConfig().keychain || { width_mm: 28, height_mm: 40 };
    const W = mmToPx(size.width_mm);
    const H = mmToPx(size.height_mm);
    const canvas = el('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = CREAM_DEEP;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(185, 99, 108, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    const pad = Math.round(W * 0.12);
    const maxWidth = W - pad * 2;
    const quote = printState.keychainQuote.trim() || 'Setiap momen layak dikenang.';

    ctx.fillStyle = ROSE;
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.round(W * 0.2)}px Georgia, serif`;
    ctx.fillText('“', W / 2, pad + Math.round(W * 0.14));

    let fontSize = Math.round(W * 0.095);
    let lines;
    do {
        ctx.font = `600 ${fontSize}px ${FONT}`;
        lines = wrapLines(ctx, quote, maxWidth, 7);
        fontSize -= 1;
    } while (lines.length * fontSize * 1.3 > H * 0.52 && fontSize > 14);

    const lineH = Math.round(fontSize * 1.3);
    let y = Math.round(H * 0.44 - ((lines.length - 1) * lineH) / 2);
    ctx.fillStyle = INK;
    lines.forEach(line => {
        ctx.fillText(line, W / 2, y);
        y += lineH;
    });

    // Logo dan tanggal disusun dari tepi bawah agar tidak terpotong.
    const logo = await loadLogo();
    let footerY = H - Math.round(pad * 0.55);
    if (logo) {
        const logoW = W * 0.4;
        const logoH = logoW * (logo.height / logo.width);
        footerY -= logoH;
        ctx.drawImage(logo, (W - logoW) / 2, footerY, logoW, logoH);
    }

    ctx.fillStyle = INK_MUTED;
    ctx.font = `500 ${Math.round(W * 0.052)}px ${FONT}`;
    ctx.fillText(printState.cardData.date.trim() || todayLabel(), W / 2, footerY - Math.round(W * 0.03));
    return canvas;
}

// ── Lembar 4R ────────────────────────────────────────────────────────────────

function drawCropMarks(ctx, rect) {
    const offset = mmToPx(1);
    const length = mmToPx(3.5);
    const { x, y, w, h } = rect;

    ctx.save();
    ctx.strokeStyle = 'rgba(43, 39, 37, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    [[x, y, -1, -1], [x + w, y, 1, -1], [x, y + h, -1, 1], [x + w, y + h, 1, 1]].forEach(([cx, cy, dx, dy]) => {
        ctx.moveTo(cx + dx * offset, cy);
        ctx.lineTo(cx + dx * (offset + length), cy);
        ctx.moveTo(cx, cy + dy * offset);
        ctx.lineTo(cx, cy + dy * (offset + length));
    });
    ctx.stroke();
    ctx.restore();
}

async function buildItems() {
    const items = [];

    if (packageHas('photocard')) {
        const total = (currentPackage().items || []).filter(item => item === 'photocard').length;
        const first = await renderPhotocard(printState.cardSources[0]);
        items.push({ kind: 'card', canvas: first });

        for (let i = 1; i < total; i++) {
            const duplicate = printState.cardMode === 'duplicate';
            items.push({
                kind: 'card',
                canvas: duplicate ? first : await renderPhotocard(printState.cardSources[i] ?? 0),
            });
        }
    }

    if (packageHas('keychain')) {
        items.push({ kind: 'keychain', canvas: await renderKeychainPhoto(printState.keychainFront) });
        items.push({
            kind: 'keychain',
            canvas: printState.keychainBackMode === 'quote'
                ? await renderKeychainQuote()
                : await renderKeychainPhoto(printState.keychainBack),
        });
    }

    return items;
}

async function renderSheet() {
    const paper = printConfig().paper || { width_mm: 100, height_mm: 148 };
    const SW = mmToPx(paper.width_mm);
    const SH = mmToPx(paper.height_mm);
    const gap = mmToPx(6);
    const sheet = el('canvas');
    sheet.width = SW;
    sheet.height = SH;
    const ctx = sheet.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, SW, SH);

    const items = await buildItems();
    const cards = items.filter(item => item.kind === 'card');
    const keychains = items.filter(item => item.kind === 'keychain');

    // Kartu tegak diputar 90° agar dua kartu 54×86 mm muat bertumpuk di kertas 100 mm.
    const rows = cards.map(card => ({ type: 'card', w: card.canvas.height, h: card.canvas.width, card }));
    if (keychains.length) {
        const kw = keychains[0].canvas.width;
        rows.push({ type: 'keychains', w: kw * keychains.length + gap * (keychains.length - 1), h: keychains[0].canvas.height });
    }

    const totalH = rows.reduce((sum, row) => sum + row.h, 0) + gap * Math.max(0, rows.length - 1);
    let y = Math.round((SH - totalH) / 2);

    rows.forEach(row => {
        const x = Math.round((SW - row.w) / 2);
        if (row.type === 'card') {
            ctx.save();
            ctx.translate(x, y + row.h);
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(row.card.canvas, 0, 0);
            ctx.restore();
            drawCropMarks(ctx, { x, y, w: row.w, h: row.h });
        } else {
            let kx = x;
            keychains.forEach(item => {
                ctx.drawImage(item.canvas, kx, y);
                drawCropMarks(ctx, { x: kx, y, w: item.canvas.width, h: item.canvas.height });
                kx += item.canvas.width + gap;
            });
        }
        y += row.h + gap;
    });

    ctx.fillStyle = 'rgba(43, 39, 37, 0.55)';
    ctx.font = `500 22px ${FONT}`;
    ctx.textAlign = 'center';
    const invoice = printState.order?.invoice_number || 'PRATINJAU';
    ctx.fillText(`Momenta · Paket ${printState.packageCode} · ${invoice}`, SW / 2, SH - mmToPx(3));

    return sheet;
}

function paintPreview(target, sheet) {
    if (!target || !sheet) return;
    target.width = sheet.width;
    target.height = sheet.height;
    target.getContext('2d').drawImage(sheet, 0, 0);
}

function scheduleSheetRender() {
    if (renderDebounce) clearTimeout(renderDebounce);
    const status = document.getElementById('print-preview-status');
    if (status) status.hidden = false;

    renderDebounce = setTimeout(async () => {
        const token = ++renderToken;
        try {
            const sheet = await renderSheet();
            if (token !== renderToken) return;
            printState.sheetCanvas = sheet;
            paintPreview(document.getElementById('print-sheet-preview'), sheet);
        } catch (error) {
            console.error('Gagal membuat lembar cetak:', error);
        } finally {
            if (token === renderToken && status) status.hidden = true;
        }
    }, 120);
}

// ── Tampilan ─────────────────────────────────────────────────────────────────

function setStage(stage) {
    printState.stage = stage;
    document.querySelectorAll('[data-print-stage]').forEach(panel => {
        panel.hidden = panel.dataset.printStage !== stage;
    });
}

function renderPackages() {
    const list = document.getElementById('print-package-list');
    if (!list) return;
    list.replaceChildren();

    Object.entries(printConfig().packages || {}).forEach(([code, pkg]) => {
        list.append(el('button', {
            type: 'button',
            class: 'print-package-card',
            onclick: () => choosePackage(code),
        }, [
            el('span', { class: 'print-package-code', text: `Pilihan ${code}` }),
            el('strong', { class: 'print-package-name', text: pkg.name }),
            el('ul', { class: 'print-package-features' }, (pkg.features || []).map(text => el('li', { text }))),
            el('span', { class: 'print-package-price', text: priceFormatter.format(pkg.price) }),
        ]));
    });
}

function segmented(options, current, onChange) {
    return el('div', { class: 'print-segmented' }, options.map(([value, label]) => el('button', {
        type: 'button',
        class: `print-segment${value === current ? ' selected' : ''}`,
        onclick: () => onChange(value),
    }, [label])));
}

function sourcePicker(current, onChange, { allowFinal = false } = {}) {
    const options = sessionState.poses
        .map((pose, index) => (pose ? { value: index, label: `Foto ${index + 1}`, image: pose } : null))
        .filter(Boolean);
    if (allowFinal && finalImageCanvas) {
        options.push({ value: 'final', label: 'Hasil Lengkap', image: finalImageCanvas.toDataURL('image/jpeg', 0.6) });
    }

    return el('div', { class: 'print-source-grid' }, options.map(option => el('button', {
        type: 'button',
        class: `print-source${String(option.value) === String(current) ? ' selected' : ''}`,
        onclick: () => onChange(option.value),
    }, [
        el('span', { class: 'print-source-thumb', style: `background-image:url('${option.image}')` }),
        el('span', { text: option.label }),
    ])));
}

function textField(label, key, placeholder, target, maxlength = 80) {
    return el('label', { class: 'print-field' }, [
        el('span', { text: label }),
        el('input', {
            type: 'text',
            value: target[key],
            placeholder,
            maxlength: String(maxlength),
            oninput: event => {
                target[key] = event.target.value;
                scheduleSheetRender();
            },
        }),
    ]);
}

function renderControls() {
    const box = document.getElementById('print-controls');
    if (!box) return;
    box.replaceChildren();
    const rerender = () => {
        renderControls();
        scheduleSheetRender();
    };

    if (packageHas('photocard')) {
        const cardTotal = currentPackage().items.filter(item => item === 'photocard').length;
        const group = el('section', { class: 'print-group' }, [el('h3', { text: 'Photocard' })]);

        if (cardTotal > 1) {
            group.append(segmented(
                [['different', 'Dua Pose Berbeda'], ['duplicate', 'Satu Pose Rangkap']],
                printState.cardMode,
                value => { printState.cardMode = value; rerender(); },
            ));
        }

        const visibleCards = cardTotal > 1 && printState.cardMode === 'different' ? cardTotal : 1;
        for (let i = 0; i < visibleCards; i++) {
            group.append(el('p', { class: 'print-label', text: visibleCards > 1 ? `Kartu ${i + 1}` : 'Foto kartu' }));
            group.append(sourcePicker(printState.cardSources[i], value => {
                printState.cardSources[i] = value;
                rerender();
            }, { allowFinal: true }));
        }

        group.append(el('p', { class: 'print-label', text: 'Desain kartu' }));
        group.append(segmented(
            [['plain', 'Polos'], ['data', 'Dengan Data']],
            printState.cardDesign,
            value => { printState.cardDesign = value; rerender(); },
        ));

        if (printState.cardDesign === 'data') {
            group.append(el('p', { class: 'print-hint', text: 'Semua isian opsional. Kosongkan yang tidak perlu.' }));
            group.append(el('div', { class: 'print-fields' }, [
                textField('Nama', 'name', 'Nama lengkap', printState.cardData, 40),
                textField('NIM', 'nim', 'Nomor induk', printState.cardData, 20),
                textField('Program Studi', 'prodi', 'Contoh: Teknik Informatika', printState.cardData, 40),
                textField('Judul / Keterangan', 'title', 'Judul tugas akhir atau acara', printState.cardData, 110),
                textField('Tanggal', 'date', todayLabel(), printState.cardData, 30),
            ]));
        }
        box.append(group);
    }

    if (packageHas('keychain')) {
        const group = el('section', { class: 'print-group' }, [el('h3', { text: 'Gantungan Kunci (2 Sisi)' })]);
        group.append(el('p', { class: 'print-label', text: 'Sisi depan' }));
        group.append(sourcePicker(printState.keychainFront, value => {
            printState.keychainFront = value;
            rerender();
        }));

        group.append(el('p', { class: 'print-label', text: 'Sisi belakang' }));
        group.append(segmented(
            [['photo', 'Foto'], ['quote', 'Kutipan']],
            printState.keychainBackMode,
            value => { printState.keychainBackMode = value; rerender(); },
        ));

        if (printState.keychainBackMode === 'photo') {
            group.append(sourcePicker(printState.keychainBack, value => {
                printState.keychainBack = value;
                rerender();
            }));
        } else {
            group.append(el('label', { class: 'print-field' }, [
                el('span', { text: 'Kutipan (maks. 90 karakter)' }),
                el('textarea', {
                    rows: '2',
                    maxlength: '90',
                    placeholder: 'Setiap momen layak dikenang.',
                    oninput: event => {
                        printState.keychainQuote = event.target.value;
                        scheduleSheetRender();
                    },
                }, [printState.keychainQuote]),
            ]));
        }
        box.append(group);
    }
}

function choosePackage(code) {
    printState.packageCode = code;
    printState.order = null;
    const lastPose = Math.max(0, poseCount() - 1);
    printState.cardSources = [0, Math.min(1, lastPose)];
    printState.keychainFront = 0;
    printState.keychainBack = Math.min(1, lastPose);
    if (poseCount() < 2) printState.cardMode = 'duplicate';

    const title = document.getElementById('print-design-title');
    if (title) title.textContent = `${currentPackage().name} — ${priceFormatter.format(currentPackage().price)}`;

    renderControls();
    setStage('design');
    scheduleSheetRender();
}

// ── Pembayaran ───────────────────────────────────────────────────────────────

async function apiRequest(url, method = 'GET', body = null) {
    const response = await fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': window.PHOTOBOOTH_CONFIG.csrfToken,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`Server merespon ${response.status}`);
    return response.json();
}

function renderPaymentPanel() {
    const order = printState.order;
    if (!order) return;
    const simulation = order.payment_driver === 'simulation';

    document.getElementById('print-invoice').textContent = order.invoice_number;
    document.getElementById('print-package-summary').textContent = `Paket ${order.package_code} — ${order.package_name}`;
    document.getElementById('print-amount').textContent = priceFormatter.format(order.amount);
    document.getElementById('print-simulation-note').hidden = !simulation;
    document.getElementById('btn-simulate-payment').hidden = !simulation;
    document.getElementById('print-payment-status').textContent = order.status === 'paid'
        ? 'Pembayaran diterima.'
        : simulation ? 'Menunggu konfirmasi operator.' : 'Menunggu pembayaran...';
}

async function goToPayment() {
    const button = document.getElementById('btn-print-to-payment');
    button.disabled = true;
    button.textContent = 'Membuat tagihan...';

    try {
        printState.order = await apiRequest(window.PHOTOBOOTH_CONFIG.printOrdersUrl, 'POST', {
            package_code: printState.packageCode,
            photo_slug: sessionState.photoSlug,
        });
        renderPaymentPanel();
        setStage('payment');
        if (printState.order.payment_driver !== 'simulation') startPolling();
    } catch (error) {
        console.error('Gagal membuat pesanan cetak:', error);
        alert('Gagal membuat tagihan. Periksa koneksi lalu coba lagi.');
    } finally {
        button.disabled = false;
        button.textContent = 'Lanjut ke Pembayaran';
    }
}

function startPolling() {
    stopPolling();
    pollTimer = setInterval(async () => {
        try {
            const order = await apiRequest(`${window.PHOTOBOOTH_CONFIG.printOrdersUrl}/${printState.order.invoice_number}`);
            printState.order = order;
            renderPaymentPanel();
            if (order.status === 'paid') await onPaid();
        } catch (error) {
            console.error('Gagal memeriksa status pembayaran:', error);
        }
    }, 3000);
}

function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
}

async function onPaid() {
    stopPolling();
    // Lembar dibuat ulang agar nomor invoice tercetak di tepi kertas.
    printState.sheetCanvas = await renderSheet();
    paintPreview(document.getElementById('print-final-preview'), printState.sheetCanvas);
    setStage('done');
}

async function simulatePayment() {
    const button = document.getElementById('btn-simulate-payment');
    button.disabled = true;
    try {
        printState.order = await apiRequest(
            `${window.PHOTOBOOTH_CONFIG.printOrdersUrl}/${printState.order.invoice_number}/simulate-payment`,
            'POST',
        );
        renderPaymentPanel();
        if (printState.order.status === 'paid') await onPaid();
    } catch (error) {
        console.error('Gagal mengonfirmasi pembayaran:', error);
        alert('Konfirmasi pembayaran gagal. Silakan coba lagi.');
    } finally {
        button.disabled = false;
    }
}

// ── Cetak & unduh ────────────────────────────────────────────────────────────

function sheetBlob() {
    return new Promise(resolve => printState.sheetCanvas.toBlob(resolve, 'image/jpeg', 0.95));
}

async function printSheet() {
    if (!printState.sheetCanvas) return;
    const paper = printConfig().paper || { width_mm: 100, height_mm: 148 };
    const url = URL.createObjectURL(await sheetBlob());
    const frame = el('iframe', { class: 'print-frame', title: 'Lembar cetak' });
    document.body.append(frame);

    const doc = frame.contentDocument;
    doc.open();
    doc.write(`<!doctype html><html><head><title>Momenta ${printState.order?.invoice_number || ''}</title><style>
        @page { size: ${paper.width_mm}mm ${paper.height_mm}mm; margin: 0; }
        html, body { margin: 0; padding: 0; }
        img { display: block; width: ${paper.width_mm}mm; height: ${paper.height_mm}mm; }
    </style></head><body><img alt=""></body></html>`);
    doc.close();

    const img = doc.querySelector('img');
    img.onload = () => {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        setTimeout(() => {
            frame.remove();
            URL.revokeObjectURL(url);
        }, 60000);
    };
    img.src = url;
}

async function downloadSheet() {
    if (!printState.sheetCanvas) return;
    const url = URL.createObjectURL(await sheetBlob());
    const link = el('a', { href: url, download: `momenta-${printState.order?.invoice_number || 'lembar'}-4R.jpg` });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function openPrintFlow(options = {}) {
    onExit = options.onExit || (() => {});
    stopPolling();
    poseCache.clear();
    focusCache.clear();
    printState.order = null;
    printState.sheetCanvas = null;

    const finalCanvas = document.getElementById('final-canvas');
    finalImageCanvas = null;
    if (finalCanvas?.width) {
        finalImageCanvas = el('canvas');
        finalImageCanvas.width = finalCanvas.width;
        finalImageCanvas.height = finalCanvas.height;
        finalImageCanvas.getContext('2d').drawImage(finalCanvas, 0, 0);
    }

    renderPackages();
    setStage('package');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-print-exit')?.addEventListener('click', () => {
        stopPolling();
        onExit();
    });
    document.getElementById('btn-print-back-package')?.addEventListener('click', () => setStage('package'));
    document.getElementById('btn-print-to-payment')?.addEventListener('click', goToPayment);
    document.getElementById('btn-payment-back')?.addEventListener('click', () => {
        stopPolling();
        setStage('design');
    });
    document.getElementById('btn-simulate-payment')?.addEventListener('click', simulatePayment);
    document.getElementById('btn-print-sheet')?.addEventListener('click', printSheet);
    document.getElementById('btn-download-sheet')?.addEventListener('click', downloadSheet);
});
