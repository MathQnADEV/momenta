/*
 * Kertas foto yang dipakai berkali-kali.
 * Setiap cetakan hanya mengisi satu bagian kertas; bagian yang sudah tercetak
 * diingat per perangkat (localStorage) agar cetakan berikutnya ditempatkan di
 * bagian yang masih kosong. Operator bisa memindah posisi atau mulai kertas baru.
 * Semua ukuran dalam milimeter.
 */

const PREFIX = 'momenta-paper-';
const STEP_MM = 5;

function storageKey(paperKey) {
    return `${PREFIX}${paperKey}`;
}

export function usedAreas(paperKey) {
    try {
        const raw = window.localStorage.getItem(storageKey(paperKey));
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveUsedAreas(paperKey, areas) {
    try {
        window.localStorage.setItem(storageKey(paperKey), JSON.stringify(areas));
    } catch {
        // Penyimpanan diblokir: posisi tetap bisa dipilih manual.
    }
}

export function clearPaper(paperKey) {
    saveUsedAreas(paperKey, []);
}

export function markUsed(paperKey, area) {
    saveUsedAreas(paperKey, [...usedAreas(paperKey), area]);
}

function overlaps(a, b, gap) {
    return a.x < b.x + b.w + gap
        && b.x < a.x + a.w + gap
        && a.y < b.y + b.h + gap
        && b.y < a.y + a.h + gap;
}

/** Area bebas: di dalam tepi aman kertas dan tidak menimpa cetakan sebelumnya. */
export function isFree(paperKey, area, { paper, margin, gap }) {
    const inside = area.x >= margin - 0.01
        && area.y >= margin - 0.01
        && area.x + area.w <= paper.width_mm - margin + 0.01
        && area.y + area.h <= paper.height_mm - margin + 0.01;
    return inside && !usedAreas(paperKey).some(used => overlaps(area, used, gap));
}

/** Tempat kosong pertama dari kiri atas, atau null bila kertas sudah penuh. */
export function findFreeArea(paperKey, w, h, layout) {
    const { paper, margin } = layout;
    for (let y = margin; y + h <= paper.height_mm - margin + 0.01; y += STEP_MM) {
        for (let x = margin; x + w <= paper.width_mm - margin + 0.01; x += STEP_MM) {
            const area = { x, y, w, h };
            if (isFree(paperKey, area, layout)) return area;
        }
    }
    return null;
}

/** Posisi pilihan operator: area berpusat di titik ketuk, dirapikan ke kisi 5 mm. */
export function areaAround(point, w, h, { paper, margin }) {
    const snap = value => Math.round(value / STEP_MM) * STEP_MM;
    const x = Math.min(paper.width_mm - margin - w, Math.max(margin, snap(point.x - w / 2)));
    const y = Math.min(paper.height_mm - margin - h, Math.max(margin, snap(point.y - h / 2)));
    return { x, y, w, h };
}
