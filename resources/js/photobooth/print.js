import { sessionState } from './state.js';
import { composePhotoStrip, findPersonFocus, getLayoutPhotoBounds, renderProcessedPose } from './compose.js';
import { uploadPhotoStrip } from './upload.js';
import { showDialog } from './dialog.js';
import { areaAround, clearPaper, findFreeArea, isFree, markUsed, usedAreas } from './paper-slots.js';

/*
 * Alur setelah Preview: pilih paket → (atur cetakan) → bayar → QR soft file + cetak.
 * - Soft File   : hanya QR.
 * - Paket A/B/C : QR + lembar cetak.
 *     Foto  : hasil frame (photostrip / photo card) di kertas foto A4 (Epson L120),
 *             ukurannya dari tabel baris x kolom di config.
 *     Ganci : 2 sisi akrilik di separuh kertas 4R (Canon SELPHY).
 * Kertas dipakai berkali-kali: posisi yang sudah tercetak diingat (paper-slots.js).
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
    keychainFront: 'final',
    keychainBackMode: 'quote',
    keychainBack: 'final',
    keychainQuote: '',
    order: null,
    sheets: [],
    // Posisi cetak pilihan operator (null = otomatis di tempat kosong pertama).
    placement: { strip: null, keychain: null },
    // Lembar yang sudah dicetak untuk pesanan ini (posisinya sudah ditandai terpakai).
    printed: new Set(),
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

/**
 * Tipe akrilik ganci: layout 1 foto (1x1) memakai akrilik kotak, layout lain
 * (strip/grid) memakai akrilik persegi panjang. Ukuran sisipan dari config.
 */
function keychainType() {
    const grid = layoutGrid();
    const key = grid.rows === 1 && grid.cols === 1 ? 'card' : 'strip';
    const types = printConfig().keychain?.types || {};
    return { key, ...(types[key] || { name: 'Persegi panjang', print_mm: [23, 53] }) };
}

function keychainSize() {
    const [w, h] = keychainType().print_mm;
    return { W: mmToPx(w), H: mmToPx(h) };
}

function keychainCanvas() {
    const { W, H } = keychainSize();
    const canvas = el('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    return { canvas, ctx, W, H };
}

/**
 * Muatkan frame utuh ke sisipan ganci. Frame melebar diputar 90° agar
 * memenuhi akrilik yang tegak.
 */
function drawFrameInto(ctx, source, W, H) {
    const rotate = source.width > source.height && H > W;
    if (!rotate) {
        drawContain(ctx, source, 0, 0, W, H);
        return;
    }
    ctx.save();
    ctx.translate(W, 0);
    ctx.rotate(Math.PI / 2);
    drawContain(ctx, source, 0, 0, H, W);
    ctx.restore();
}

/** Hasil frame lengkap (foto + frame + stiker), sama seperti soft file. */
function renderKeychainFramed() {
    const { canvas, ctx, W, H } = keychainCanvas();
    drawFrameInto(ctx, finalImageCanvas, W, H);
    return canvas;
}

/** Satu foto saja, dipotong mengikuti posisi orang. */
async function renderKeychainPhoto(index) {
    const { canvas, ctx, W, H } = keychainCanvas();
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H);

    const img = await processedPose(index);
    const focus = await personFocus(index);
    const zoom = focus ? Math.max(0.35, Math.min(1, focus.height * 0.7)) : 1;
    drawFocusedCover(ctx, img, 0, 0, W, H, focus, zoom);
    return canvas;
}

/**
 * Kutipan bergaya frame: frame yang sama dengan foto pelanggan, tetapi area
 * foto diganti panel kutipan.
 */
async function renderKeychainQuote() {
    // composePhotoStrip menyimpan hasilnya ke sessionState; kembalikan setelahnya.
    const previous = sessionState.compositeCanvas;
    let frame;
    try {
        frame = await composePhotoStrip(sessionState.poses.map(() => null), sessionState.bgStyle);
    } finally {
        sessionState.compositeCanvas = previous;
    }

    const ctx = frame.getContext('2d');
    const bounds = getLayoutPhotoBounds(sessionState.layoutId);
    const sx = frame.width / bounds.canvasW;
    const sy = frame.height / bounds.canvasH;
    const box = { x: bounds.x * sx, y: bounds.y * sy, w: bounds.w * sx, h: bounds.h * sy };

    ctx.fillStyle = CREAM_DEEP;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = 'rgba(185, 99, 108, 0.55)';
    ctx.lineWidth = Math.max(2, box.w * 0.012);
    const inset = box.w * 0.05;
    ctx.strokeRect(box.x + inset, box.y + inset, box.w - inset * 2, box.h - inset * 2);

    const pad = box.w * 0.14;
    const maxWidth = box.w - pad * 2;
    const quote = printState.keychainQuote.trim() || 'Setiap momen layak dikenang.';
    const centerX = box.x + box.w / 2;

    ctx.textAlign = 'center';
    let fontSize = Math.round(Math.min(box.w * 0.11, box.h * 0.08));
    let lines;
    do {
        ctx.font = `600 ${fontSize}px ${FONT}`;
        lines = wrapLines(ctx, quote, maxWidth, 8);
        fontSize -= 1;
    } while (lines.length * fontSize * 1.3 > box.h * 0.5 && fontSize > 10);

    const lineH = fontSize * 1.3;
    const quoteMarkSize = fontSize * 2.2;
    let y = box.y + box.h * 0.45 - ((lines.length - 1) * lineH) / 2;

    ctx.fillStyle = ROSE;
    ctx.font = `700 ${quoteMarkSize}px Georgia, serif`;
    ctx.fillText('“', centerX, y - lineH * 0.6);

    ctx.fillStyle = INK;
    ctx.font = `600 ${fontSize}px ${FONT}`;
    lines.forEach(line => {
        ctx.fillText(line, centerX, y + lineH * 0.6);
        y += lineH;
    });

    ctx.fillStyle = INK_MUTED;
    ctx.font = `500 ${Math.round(fontSize * 0.6)}px ${FONT}`;
    ctx.fillText(todayLabel(), centerX, box.y + box.h - inset - pad * 0.4);

    const { canvas, ctx: out, W, H } = keychainCanvas();
    drawFrameInto(out, frame, W, H);
    return canvas;
}

async function renderKeychainSide(choice) {
    if (choice === 'quote') return renderKeychainQuote();
    if (choice === 'final' && finalImageCanvas) return renderKeychainFramed();
    return renderKeychainPhoto(Number(choice) || 0);
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

const USED_FILL = 'rgba(148, 163, 184, 0.35)';
const TARGET_STROKE = 'rgba(185, 99, 108, 0.95)';

function drawContain(ctx, img, x, y, w, h) {
    const scale = Math.min(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** Jumlah baris × kolom layout yang dipilih (dari grid CSS layout). */
function layoutGrid() {
    const css = window.PHOTOBOOTH_CONFIG?.layouts?.[sessionState.layoutId]?.css_grid || '';
    const count = property => {
        const value = (css.match(new RegExp(`${property}\\s*:\\s*([^;]+)`)) || [])[1] || '1fr';
        const repeat = value.match(/repeat\(\s*(\d+)/);
        return repeat ? Number(repeat[1]) : value.trim().split(/\s+/).length;
    };
    return { rows: count('grid-template-rows'), cols: count('grid-template-columns') };
}

/**
 * Ukuran cetak hasil frame (mm) dari tabel "kolom x baris" di config.
 * Arah tegak/melebar mengikuti bentuk frame.
 */
export function stripItemSize(grid, frameW, frameH, config) {
    const sizes = config.item_sizes || {};
    const entry = sizes[`${grid.cols}x${grid.rows}`]
        || sizes[`${grid.rows}x${grid.cols}`]
        || config.item_size_default
        || { size: [100, 100], type: 'Photo card' };
    const long = Math.max(...entry.size);
    const short = Math.min(...entry.size);
    const portrait = frameH > frameW;
    return { w: portrait ? short : long, h: portrait ? long : short, type: entry.type };
}

function stripLayout() {
    const config = printConfig().strip || {};
    return {
        paper: config.paper || { width_mm: 210, height_mm: 297 },
        margin: config.margin_mm ?? 5,
        gap: config.gap_mm ?? 6,
    };
}

/** Kertas 4R ganci dibagi dua: atas dan bawah, masing-masing untuk satu pesanan. */
function keychainHalves() {
    const paper = printConfig().keychain?.paper || { width_mm: 100, height_mm: 148 };
    const half = paper.height_mm / 2;
    return {
        paper,
        layout: { paper, margin: 0, gap: 0 },
        areas: [
            { x: 0, y: 0, w: paper.width_mm, h: half },
            { x: 0, y: half, w: paper.width_mm, h: half },
        ],
    };
}

function rectPx(area) {
    return { x: mmToPx(area.x), y: mmToPx(area.y), w: mmToPx(area.w), h: mmToPx(area.h) };
}

/** Posisi cetak: pilihan operator bila masih bebas, kalau tidak tempat kosong pertama. */
function resolveStripArea(size) {
    const layout = stripLayout();
    const chosen = printState.placement.strip;
    // Sudah dicetak: tetap di posisi itu (untuk Cetak Ulang).
    if (chosen && printState.printed.has('strip')) return chosen;
    if (chosen && chosen.w === size.w && chosen.h === size.h && isFree('strip', chosen, layout)) return chosen;
    return findFreeArea('strip', size.w, size.h, layout);
}

function resolveKeychainSlot() {
    const { areas, layout } = keychainHalves();
    const chosen = printState.placement.keychain;
    if (chosen !== null && printState.printed.has('keychain')) return { index: chosen, area: areas[chosen] };
    if (chosen !== null && isFree('keychain', areas[chosen], layout)) return { index: chosen, area: areas[chosen] };
    const index = areas.findIndex(area => isFree('keychain', area, layout));
    return index === -1 ? null : { index, area: areas[index] };
}

async function renderStripSheet() {
    const layout = stripLayout();
    const size = stripItemSize(layoutGrid(), finalImageCanvas.width, finalImageCanvas.height, printConfig());
    const area = resolveStripArea(size);
    const { sheet, ctx } = blankSheet(layout.paper);

    if (area) {
        const r = rectPx(area);
        ctx.imageSmoothingQuality = 'high';
        drawContain(ctx, finalImageCanvas, r.x, r.y, r.w, r.h);
        drawCropMarks(ctx, r);
    }

    const cm = mm => (mm / 10).toLocaleString('id-ID');
    return {
        key: 'strip',
        label: `${size.type} (A4)`,
        paper: layout.paper,
        canvas: sheet,
        area,
        size,
        sizeLabel: `${cm(size.w)} × ${cm(size.h)} cm`,
    };
}

async function renderKeychainSheet() {
    const { paper } = keychainHalves();
    const slot = resolveKeychainSlot();
    const { sheet, ctx } = blankSheet(paper);
    const front = await renderKeychainSide(printState.keychainFront);
    const back = await renderKeychainSide(
        printState.keychainBackMode === 'quote' ? 'quote' : printState.keychainBack,
    );

    if (slot) {
        const half = rectPx(slot.area);
        const gap = mmToPx(6);
        const totalW = front.width + back.width + gap;
        let x = Math.round(half.x + (half.w - totalW) / 2);
        const y = Math.round(half.y + (half.h - front.height) / 2 + mmToPx(2));

        ctx.fillStyle = INK_MUTED;
        ctx.font = `600 26px ${FONT}`;
        ctx.textAlign = 'center';
        [[front, 'Depan'], [back, 'Belakang']].forEach(([item, label]) => {
            ctx.drawImage(item, x, y);
            drawCropMarks(ctx, { x, y, w: item.width, h: item.height });
            ctx.fillText(label, x + item.width / 2, y - mmToPx(4.5));
            x += item.width + gap;
        });
    }

    const cm = px => ((px * 2.54) / (printConfig().dpi || 300)).toFixed(1);
    return {
        key: 'keychain',
        label: `Ganci ${keychainType().name} (4R)`,
        paper,
        canvas: sheet,
        area: slot?.area || null,
        halfLabel: slot ? (slot.index === 0 ? 'bagian atas' : 'bagian bawah') : null,
        sizeLabel: `${cm(front.width)} × ${cm(front.height)} cm per sisi`,
    };
}

async function renderSheets() {
    const sheets = [];
    if (packageHas('strip') && finalImageCanvas) sheets.push(await renderStripSheet());
    if (packageHas('keychain')) sheets.push(await renderKeychainSheet());
    return sheets;
}

/** Pratinjau = hasil cetak + bagian terpakai (abu-abu) + posisi sekarang (garis putus). */
function previewCanvas(sheet) {
    const canvas = el('canvas', { 'aria-label': `Pratinjau ${sheet.label}` });
    canvas.width = sheet.canvas.width;
    canvas.height = sheet.canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sheet.canvas, 0, 0);

    ctx.fillStyle = USED_FILL;
    usedAreas(sheet.key).forEach(area => {
        const r = rectPx(area);
        ctx.fillRect(r.x, r.y, r.w, r.h);
    });

    if (sheet.area) {
        const r = rectPx(sheet.area);
        ctx.strokeStyle = TARGET_STROKE;
        ctx.lineWidth = 8;
        ctx.setLineDash([24, 14]);
        ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
    return canvas;
}

/** Titik ketuk di kanvas (object-fit: contain) → milimeter di kertas. */
function pointOnPaper(event, canvas, paper) {
    const box = canvas.getBoundingClientRect();
    const scale = Math.min(box.width / canvas.width, box.height / canvas.height);
    const offsetX = (box.width - canvas.width * scale) / 2;
    const offsetY = (box.height - canvas.height * scale) / 2;
    const px = (event.clientX - box.left - offsetX) / scale;
    const py = (event.clientY - box.top - offsetY) / scale;
    return { x: (px / canvas.width) * paper.width_mm, y: (py / canvas.height) * paper.height_mm };
}

async function choosePosition(sheet, point) {
    if (sheet.key === 'strip') {
        const layout = stripLayout();
        const area = areaAround(point, sheet.size.w, sheet.size.h, layout);
        if (!isFree('strip', area, layout)) {
            showDialog({ title: 'Bagian ini sudah terpakai', message: 'Ketuk bagian kertas yang masih putih.', tone: 'warning' });
            return;
        }
        printState.placement.strip = area;
    } else {
        const { areas, layout } = keychainHalves();
        const index = point.y < areas[1].y ? 0 : 1;
        if (!isFree('keychain', areas[index], layout)) {
            showDialog({ title: 'Bagian ini sudah terpakai', message: 'Pakai bagian kertas yang lain atau mulai kertas baru.', tone: 'warning' });
            return;
        }
        printState.placement.keychain = index;
    }
    await refreshSheets();
}

async function startNewPaper(sheet) {
    const ok = await showDialog({
        title: 'Pakai kertas baru?',
        message: `Semua bagian ${sheet.key === 'strip' ? 'kertas A4' : 'kertas 4R ganci'} dianggap kosong lagi. Pastikan kertas baru sudah dimasukkan ke printer.`,
        confirmText: 'Ya, Kertas Baru',
        cancelText: 'Batal',
    });
    if (!ok) return;
    clearPaper(sheet.key);
    printState.placement[sheet.key] = null;
    await refreshSheets();
}

function sheetStatus(sheet) {
    if (!sheet.area) return 'Kertas penuh. Masukkan kertas baru lalu tekan Kertas Baru.';
    if (printState.printed.has(sheet.key)) return 'Sudah dicetak';
    if (sheet.key === 'keychain') return `Dicetak di ${sheet.halfLabel} kertas. Ketuk bagian lain untuk memindah.`;
    return 'Ketuk kertas untuk memindah posisi cetak.';
}

/** Kartu lembar: pratinjau yang bisa diketuk, status, tombol Kertas Baru (+ cetak/unduh). */
function sheetFigure(sheet, actions = []) {
    const locked = printState.printed.has(sheet.key);
    const canvas = previewCanvas(sheet);
    if (!locked) {
        canvas.classList.add('is-interactive');
        canvas.addEventListener('click', event => choosePosition(sheet, pointOnPaper(event, canvas, sheet.paper)));
    }

    return el('figure', { class: `print-sheet-figure${sheet.area ? '' : ' is-full'}` }, [
        canvas,
        el('figcaption', {}, [
            el('strong', { text: `${sheet.label} · ${sheet.sizeLabel}` }),
            el('span', { class: 'print-sheet-status', text: sheetStatus(sheet) }),
        ]),
        el('div', { class: 'print-sheet-actions' }, [
            ...actions,
            locked ? null : el('button', {
                type: 'button',
                class: 'print-new-paper',
                onclick: () => startNewPaper(sheet),
            }, ['Kertas Baru']),
        ]),
    ]);
}

function renderSheetPreviews(container, sheets) {
    if (!container) return;
    container.replaceChildren(...sheets.map(sheet => sheetFigure(sheet)));
}

async function refreshSheets() {
    printState.sheets = await renderSheets();
    if (printState.stage === 'done') renderDoneSheets();
    else renderSheetPreviews(document.getElementById('print-sheet-previews'), printState.sheets);
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
    // Pilihan utama: hasil frame lengkap yang sama dengan soft file.
    if (finalImageCanvas) {
        options.unshift({ value: 'final', label: 'Dengan Frame', image: finalImageCanvas.toDataURL('image/jpeg', 0.6) });
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
            el('h3', { text: 'Cetak Foto' }),
            el('p', {
                class: 'print-hint',
                text: `Hasil frame kamu dicetak di kertas foto ${config.paper?.name || 'A4'} sesuai ukuran layout. Kertas yang sama dipakai bergantian; bagian abu-abu sudah terpakai.`,
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
            [['photo', 'Foto'], ['quote', 'Kutipan Bergaya Frame']],
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
    printState.keychainFront = 'final';
    printState.keychainBackMode = 'quote';
    printState.keychainBack = 'final';
    printState.placement = { strip: null, keychain: null };
    printState.printed = new Set();

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
            showDialog({ title: 'Ada kendala', message: 'Foto belum berhasil diunggah. Periksa koneksi internet lalu coba lagi.', tone: 'warning' });
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
        showDialog({ title: 'Ada kendala', message: 'Gagal membuat tagihan. Periksa koneksi lalu coba lagi.', tone: 'warning' });
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
        const printer = sheet.key === 'strip' ? 'Epson L120 · A4' : 'Canon SELPHY · 4R';
        return sheetFigure(sheet, [
            el('span', { class: 'print-sheet-printer', text: `${printer} · skala 100%` }),
            el('button', {
                type: 'button',
                class: 'btn-primary',
                disabled: !sheet.area,
                onclick: () => printSheet(sheet),
            }, [printState.printed.has(sheet.key) ? 'Cetak Ulang' : 'Cetak']),
            el('button', { type: 'button', class: 'btn-secondary', onclick: () => downloadSheet(sheet) }, ['Unduh']),
        ]);
    }));
}

async function onPaid() {
    stopPolling();
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
        showDialog({ title: 'Ada kendala', message: 'Konfirmasi pembayaran gagal. Silakan coba lagi.', tone: 'warning' });
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
    if (!sheet.area) return;
    const { paper } = sheet;
    // Bagian kertas ini ditandai terpakai sekali saja; Cetak Ulang memakai posisi yang sama.
    if (!printState.printed.has(sheet.key)) {
        markUsed(sheet.key, sheet.area);
        printState.printed.add(sheet.key);
        if (sheet.key === 'strip') printState.placement.strip = sheet.area;
        else printState.placement.keychain = sheet.area.y > 0 ? 1 : 0;
        renderDoneSheets();
    }
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
    printState.placement = { strip: null, keychain: null };
    printState.printed = new Set();

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
    document.getElementById('btn-print-exit')?.addEventListener('click', async () => {
        // Foto tetap tersimpan di server, tapi QR tidak ditampilkan.
        const leave = await showDialog({
            title: 'Selesai tanpa membeli?',
            message: 'Foto tetap tersimpan, tetapi QR untuk mengunduh soft file tidak akan ditampilkan.',
            confirmText: 'Ya, Selesai',
            cancelText: 'Pilih Paket',
            tone: 'warning',
        });
        if (!leave) return;
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
