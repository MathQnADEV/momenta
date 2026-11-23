import { sessionState } from './state.js';
import { renderProcessedPose, findPersonFocus } from './compose.js';
import { uploadPhotoStrip } from './upload.js';

/*
 * Alur setelah Preview: pilih paket → (atur cetakan) → bayar → QR soft file + cetak.
 * - Soft File   : hanya QR.
 * - Paket A/B/C : QR + lembar cetak.
 *     Strip : hasil template pelanggan diulang sebanyak yang muat di kertas foto A4 (Epson L120).
 *     Ganci : 2 sisi akrilik di kertas 4R (Canon SELPHY).
 * QR soft file baru ditampilkan setelah pembayaran lunas.
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
    keychainFront: 0,
    keychainBackMode: 'photo',
    keychainBack: 1,
    keychainQuote: '',
    order: null,
    sheets: [],
};

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

function hasPrintItems() {
    return (currentPackage()?.items || []).length > 0;
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

// ── Ganci akrilik ────────────────────────────────────────────────────────────

function keychainSize() {
    const size = printConfig().keychain || {};
    return { W: mmToPx(size.width_mm || 28), H: mmToPx(size.height_mm || 40) };
}

async function renderKeychainPhoto(index) {
    const { W, H } = keychainSize();
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
    const { W, H } = keychainSize();
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
    ctx.fillText(todayLabel(), W / 2, footerY - Math.round(W * 0.03));
    return canvas;
}

// ── Lembar cetak ─────────────────────────────────────────────────────────────

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

function blankSheet(paper) {
    const sheet = el('canvas');
    sheet.width = mmToPx(paper.width_mm);
    sheet.height = mmToPx(paper.height_mm);
    const ctx = sheet.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sheet.width, sheet.height);
    return { sheet, ctx };
}

function drawSheetFooter(ctx, sheet, label, bottomMm) {
    ctx.fillStyle = 'rgba(43, 39, 37, 0.55)';
    ctx.font = `500 24px ${FONT}`;
    ctx.textAlign = 'center';
    const invoice = printState.order?.invoice_number || 'PRATINJAU';
    ctx.fillText(`Momenta · ${label} · ${invoice}`, sheet.width / 2, sheet.height - mmToPx(bottomMm));
}

/**
 * Susunan template di A4: ukuran tiap salinan mengikuti rasio template
 * (sisi terpanjang = long_side_mm), lalu dipilih posisi tegak atau diputar
 * yang menghasilkan salinan terbanyak.
 */
export function planStripLayout(templateW, templateH, config) {
    const paper = config.paper || { width_mm: 210, height_mm: 297 };
    const margin = config.margin_mm ?? 5;
    const gap = config.gap_mm ?? 4;
    const longSide = config.long_side_mm || 150;
    const usableW = paper.width_mm - margin * 2;
    const usableH = paper.height_mm - margin * 2;

    const portrait = templateH >= templateW;
    let itemW = portrait ? (longSide * templateW) / templateH : longSide;
    let itemH = portrait ? longSide : (longSide * templateH) / templateW;

    const fit = (w, h) => ({
        cols: Math.floor((usableW + gap) / (w + gap)),
        rows: Math.floor((usableH + gap) / (h + gap)),
    });

    let best = null;
    [false, true].forEach(rotated => {
        const w = rotated ? itemH : itemW;
        const h = rotated ? itemW : itemH;
        const { cols, rows } = fit(w, h);
        const count = cols * rows;
        if (count > 0 && (!best || count > best.count)) best = { rotated, w, h, cols, rows, count };
    });

    // Template terlalu besar untuk ukuran ini: perkecil agar tetap muat satu.
    if (!best) {
        const scale = Math.min(usableW / itemW, usableH / itemH);
        itemW *= scale;
        itemH *= scale;
        best = { rotated: false, w: itemW, h: itemH, cols: 1, rows: 1, count: 1 };
    }

    return { ...best, paper, margin, gap };
}

async function renderStripSheet() {
    const config = printConfig().strip || {};
    const plan = planStripLayout(finalImageCanvas.width, finalImageCanvas.height, config);
    const { sheet, ctx } = blankSheet(plan.paper);

    const w = mmToPx(plan.w);
    const h = mmToPx(plan.h);
    const gap = mmToPx(plan.gap);
    const gridW = plan.cols * w + (plan.cols - 1) * gap;
    const gridH = plan.rows * h + (plan.rows - 1) * gap;
    const startX = Math.round((sheet.width - gridW) / 2);
    const startY = Math.round((sheet.height - gridH) / 2);

    for (let row = 0; row < plan.rows; row += 1) {
        for (let col = 0; col < plan.cols; col += 1) {
            const x = startX + col * (w + gap);
            const y = startY + row * (h + gap);
            ctx.save();
            if (plan.rotated) {
                ctx.translate(x, y + h);
                ctx.rotate(-Math.PI / 2);
                ctx.drawImage(finalImageCanvas, 0, 0, h, w);
            } else {
                ctx.drawImage(finalImageCanvas, x, y, w, h);
            }
            ctx.restore();
            drawCropMarks(ctx, { x, y, w, h });
        }
    }

    drawSheetFooter(ctx, sheet, `Strip ${plan.count}×`, Math.max(1.5, plan.margin / 2 - 0.5));
    return { key: 'strip', label: 'Strip (A4)', paper: plan.paper, canvas: sheet, copies: plan.count };
}

async function renderKeychainSheet() {
    const paper = printConfig().keychain?.paper || { width_mm: 100, height_mm: 148 };
    const { sheet, ctx } = blankSheet(paper);
    const front = await renderKeychainPhoto(printState.keychainFront);
    const back = printState.keychainBackMode === 'quote'
        ? await renderKeychainQuote()
        : await renderKeychainPhoto(printState.keychainBack);

    const gap = mmToPx(6);
    const totalW = front.width + back.width + gap;
    let x = Math.round((sheet.width - totalW) / 2);
    const y = Math.round((sheet.height - front.height) / 2);

    [front, back].forEach(item => {
        ctx.drawImage(item, x, y);
        drawCropMarks(ctx, { x, y, w: item.width, h: item.height });
        x += item.width + gap;
    });

    ctx.fillStyle = INK_MUTED;
    ctx.font = `600 30px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('Depan', Math.round((sheet.width - totalW) / 2) + front.width / 2, y - mmToPx(5));
    ctx.fillText('Belakang', Math.round((sheet.width - totalW) / 2) + front.width + gap + back.width / 2, y - mmToPx(5));

    drawSheetFooter(ctx, sheet, 'Ganci', 3);
    return { key: 'keychain', label: 'Ganci (4R)', paper, canvas: sheet };
}

async function renderSheets() {
    const sheets = [];
    if (packageHas('strip') && finalImageCanvas) sheets.push(await renderStripSheet());
    if (packageHas('keychain')) sheets.push(await renderKeychainSheet());
    return sheets;
}

function paintCanvas(target, source) {
    target.width = source.width;
    target.height = source.height;
    target.getContext('2d').drawImage(source, 0, 0);
}

function renderSheetPreviews(container, sheets) {
    if (!container) return;
    container.replaceChildren(...sheets.map(sheet => {
        const canvas = el('canvas', { 'aria-label': `Pratinjau ${sheet.label}` });
        paintCanvas(canvas, sheet.canvas);
        const caption = sheet.copies ? `${sheet.label} · ${sheet.copies} salinan` : sheet.label;
        return el('figure', { class: 'print-sheet-figure' }, [canvas, el('figcaption', { text: caption })]);
    }));
}

function scheduleSheetRender() {
    if (renderDebounce) clearTimeout(renderDebounce);
    const status = document.getElementById('print-preview-status');
    if (status) status.hidden = false;

    renderDebounce = setTimeout(async () => {
        const token = ++renderToken;
        try {
            const sheets = await renderSheets();
            if (token !== renderToken) return;
            printState.sheets = sheets;
            renderSheetPreviews(document.getElementById('print-sheet-previews'), sheets);
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
            class: `print-package-card${(pkg.items || []).length ? '' : ' print-package-card--basic'}`,
            onclick: () => choosePackage(code),
        }, [
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

function sourcePicker(current, onChange) {
    const options = sessionState.poses
        .map((pose, index) => (pose ? { value: index, label: `Foto ${index + 1}`, image: pose } : null))
        .filter(Boolean);

    return el('div', { class: 'print-source-grid' }, options.map(option => el('button', {
        type: 'button',
        class: `print-source${String(option.value) === String(current) ? ' selected' : ''}`,
        onclick: () => onChange(option.value),
    }, [
        el('span', { class: 'print-source-thumb', style: `background-image:url('${option.image}')` }),
        el('span', { text: option.label }),
    ])));
}

function renderControls() {
    const box = document.getElementById('print-controls');
    if (!box) return;
    box.replaceChildren();
    const rerender = () => {
        renderControls();
        scheduleSheetRender();
    };

    if (packageHas('strip')) {
        const config = printConfig().strip || {};
        box.append(el('section', { class: 'print-group' }, [
            el('h3', { text: 'Cetak Strip' }),
            el('p', {
                class: 'print-hint',
                text: `Hasil template kamu dicetak di kertas foto ${config.paper?.name || 'A4'}, diulang sebanyak yang muat, lalu dipotong mengikuti garis sudut.`,
            }),
        ]));
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
    printState.sheets = [];
    const lastPose = Math.max(0, poseCount() - 1);
    printState.keychainFront = 0;
    printState.keychainBack = Math.min(1, lastPose);

    // Soft File saja: tidak ada yang perlu diatur, langsung bayar.
    if (!hasPrintItems()) {
        goToPayment();
        return;
    }

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
    if (!response.ok) {
        const error = new Error(`Server merespon ${response.status}`);
        error.status = response.status;
        error.payload = await response.json().catch(() => null);
        throw error;
    }
    return response.json();
}

/** Pesanan butuh foto yang sudah terunggah; tunggu atau ulangi unggahan bila perlu. */
async function ensureUploaded() {
    if (sessionState.uploadStatus === 'success' && sessionState.photoSlug) return true;
    if (sessionState.uploadStatus === 'uploading' && sessionState.uploadPromise) {
        await sessionState.uploadPromise;
    }
    if (sessionState.uploadStatus !== 'success') {
        sessionState.uploadPromise = uploadPhotoStrip();
        await sessionState.uploadPromise;
    }
    return sessionState.uploadStatus === 'success' && Boolean(sessionState.photoSlug);
}

function renderPaymentPanel() {
    const order = printState.order;
    if (!order) return;
    const simulation = order.payment_driver === 'simulation';
    const qrisStatic = order.payment_driver === 'qris_static';

    document.getElementById('print-invoice').textContent = order.invoice_number;
    document.getElementById('print-package-summary').textContent = `${order.package_name} — ${(currentPackage()?.features || []).join(' · ')}`;
    document.getElementById('print-amount').textContent = priceFormatter.format(order.amount);
    document.getElementById('print-simulation-note').hidden = !simulation;
    document.getElementById('btn-simulate-payment').hidden = !simulation;
    document.getElementById('print-qris').hidden = !qrisStatic;
    document.getElementById('print-pin-form').hidden = !qrisStatic || order.status === 'paid';
    document.getElementById('print-payment-status').textContent = order.status === 'paid'
        ? 'Pembayaran diterima.'
        : simulation || qrisStatic ? 'Menunggu konfirmasi operator.' : 'Menunggu pembayaran...';
}

async function goToPayment() {
    const button = document.getElementById('btn-print-to-payment');
    const packageCards = document.querySelectorAll('.print-package-card');
    if (button) {
        button.disabled = true;
        button.textContent = 'Membuat tagihan...';
    }
    packageCards.forEach(card => { card.disabled = true; });

    try {
        if (!(await ensureUploaded())) {
            alert('Foto belum berhasil diunggah. Periksa koneksi internet lalu coba lagi.');
            return;
        }
        printState.order = await apiRequest(window.PHOTOBOOTH_CONFIG.printOrdersUrl, 'POST', {
            package_code: printState.packageCode,
            photo_slug: sessionState.photoSlug,
        });
        resetPinForm();
        renderPaymentPanel();
        setStage('payment');
        // Simulasi dan QRIS statis dikonfirmasi manual; driver otomatis (DOKU) dicek berkala.
        if (!['simulation', 'qris_static'].includes(printState.order.payment_driver)) startPolling();
    } catch (error) {
        console.error('Gagal membuat pesanan:', error);
        alert('Gagal membuat tagihan. Periksa koneksi lalu coba lagi.');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = 'Lanjut ke Pembayaran';
        }
        packageCards.forEach(card => { card.disabled = false; });
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

function renderDoneSheets() {
    const container = document.getElementById('print-done-sheets');
    if (!container) return;
    container.hidden = printState.sheets.length === 0;
    container.replaceChildren(...printState.sheets.map(sheet => {
        const canvas = el('canvas', { 'aria-label': `Lembar ${sheet.label}` });
        paintCanvas(canvas, sheet.canvas);
        const printer = sheet.key === 'strip' ? 'Epson L120 · kertas foto A4' : 'Canon SELPHY · kertas 4R';
        return el('article', { class: 'print-done-sheet' }, [
            canvas,
            el('div', { class: 'print-done-sheet-info' }, [
                el('strong', { text: sheet.label }),
                el('span', { text: `${printer} · skala 100%` }),
                el('button', { type: 'button', class: 'btn-primary', onclick: () => printSheet(sheet) }, [`Cetak ${sheet.label}`]),
                el('button', { type: 'button', class: 'btn-secondary', onclick: () => downloadSheet(sheet) }, ['Unduh']),
            ]),
        ]);
    }));
}

async function onPaid() {
    stopPolling();
    // Lembar dibuat ulang agar nomor invoice tercetak di tepi kertas.
    printState.sheets = hasPrintItems() ? await renderSheets() : [];
    renderDoneSheets();
    document.querySelector('[data-print-stage="done"]')?.classList.toggle('has-sheets', printState.sheets.length > 0);
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

function resetPinForm() {
    const input = document.getElementById('print-operator-pin');
    const error = document.getElementById('print-pin-error');
    if (input) input.value = '';
    if (error) error.hidden = true;
}

async function confirmPaymentWithPin(event) {
    event.preventDefault();
    const input = document.getElementById('print-operator-pin');
    const error = document.getElementById('print-pin-error');
    const button = document.getElementById('btn-confirm-payment');
    const pin = input.value.trim();

    if (!pin) {
        error.textContent = 'Masukkan PIN operator.';
        error.hidden = false;
        input.focus();
        return;
    }

    button.disabled = true;
    error.hidden = true;
    try {
        printState.order = await apiRequest(
            `${window.PHOTOBOOTH_CONFIG.printOrdersUrl}/${printState.order.invoice_number}/confirm-payment`,
            'POST',
            { pin },
        );
        renderPaymentPanel();
        if (printState.order.status === 'paid') await onPaid();
    } catch (failure) {
        error.textContent = failure.status === 429
            ? 'Terlalu banyak percobaan. Tunggu 1 menit lalu coba lagi.'
            : failure.payload?.errors?.pin?.[0] || 'Konfirmasi gagal. Periksa koneksi lalu coba lagi.';
        error.hidden = false;
        input.value = '';
        input.focus();
    } finally {
        button.disabled = false;
    }
}

// ── Cetak & unduh ────────────────────────────────────────────────────────────

function sheetBlob(sheet) {
    return new Promise(resolve => sheet.canvas.toBlob(resolve, 'image/jpeg', 0.95));
}

async function printSheet(sheet) {
    const { paper } = sheet;
    const url = URL.createObjectURL(await sheetBlob(sheet));
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

async function downloadSheet(sheet) {
    const url = URL.createObjectURL(await sheetBlob(sheet));
    const name = `momenta-${printState.order?.invoice_number || 'lembar'}-${sheet.key}.jpg`;
    const link = el('a', { href: url, download: name });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function openPaymentFlow() {
    stopPolling();
    poseCache.clear();
    focusCache.clear();
    printState.order = null;
    printState.sheets = [];

    // Hasil template lengkap (dengan stiker/coretan) untuk lembar strip.
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
        // Foto tetap tersimpan di server, tapi QR tidak ditampilkan.
        if (!window.confirm('Selesai tanpa membeli? QR soft file tidak akan ditampilkan.')) return;
        stopPolling();
        window.location.assign(window.PHOTOBOOTH_CONFIG?.homeUrl || '/photobooth');
    });
    document.getElementById('btn-print-back-package')?.addEventListener('click', () => setStage('package'));
    document.getElementById('btn-print-to-payment')?.addEventListener('click', goToPayment);
    document.getElementById('btn-payment-back')?.addEventListener('click', () => {
        stopPolling();
        setStage(hasPrintItems() ? 'design' : 'package');
    });
    document.getElementById('btn-simulate-payment')?.addEventListener('click', simulatePayment);
    document.getElementById('print-pin-form')?.addEventListener('submit', confirmPaymentWithPin);
});
