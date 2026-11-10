import { sessionState } from "./state.js";
import { removePhotoBackground } from "./background-removal.js";

const CANVAS = { w: 1200, h: 1800 };

function makeGridLayout({
    canvasW = 1200,
    canvasH = 1800,
    cols,
    rows,
    left,
    top,
    width,
    height,
    gap,
    brandY,
    itemRatio = 1,
}) {
    const cellWidth = (width - gap * (cols - 1)) / cols;
    const cellHeight = (height - gap * (rows - 1)) / rows;
    const photos = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = left + col * (cellWidth + gap);
            const y = top + row * (cellHeight + gap);
            photos.push({ x, y, w: cellWidth, h: cellHeight * itemRatio });
        }
    }

    return {
        canvas: { w: canvasW, h: canvasH },
        photos,
        brand: { y: brandY },
    };
}

function makeMosaic4Layout() {
    return {
        canvas: { w: 1200, h: 1800 },
        photos: [
            { x: 90, y: 120, w: 1010, h: 620 },
            { x: 90, y: 790, w: 325, h: 850 },
            { x: 457, y: 790, w: 325, h: 850 },
            { x: 824, y: 790, w: 276, h: 850 },
        ],
        brand: { y: 1690 },
    };
}

export const LAYOUTS = {
    single: makeGridLayout({
        canvasW: 1200,
        canvasH: 1600,
        cols: 1,
        rows: 1,
        left: 100,
        top: 100,
        width: 1000,
        height: 1333,
        gap: 0,
        brandY: 1500,
    }),
    "split-2-h": makeGridLayout({
        canvasW: 1600,
        canvasH: 1200,
        cols: 2,
        rows: 1,
        left: 100,
        top: 100,
        width: 1400,
        height: 933,
        gap: 32,
        brandY: 1110,
    }),
    "split-2-v": makeGridLayout({
        canvasW: 600,
        canvasH: 1600,
        cols: 1,
        rows: 2,
        left: 50,
        top: 60,
        width: 500,
        height: 1333,
        gap: 24,
        brandY: 1490,
    }),
    "strip-3": makeGridLayout({
        canvasW: 800,
        canvasH: 2000,
        cols: 1,
        rows: 3,
        left: 60,
        top: 80,
        width: 680,
        height: 1720,
        gap: 32,
        brandY: 1870,
    }),
    "strip-3-h": makeGridLayout({
        canvasW: 1800,
        canvasH: 800,
        cols: 3,
        rows: 1,
        left: 60,
        top: 60,
        width: 1680,
        height: 560,
        gap: 24,
        brandY: 715,
    }),
    "strip-4": makeGridLayout({
        canvasW: 700,
        canvasH: 2000,
        cols: 1,
        rows: 4,
        left: 60,
        top: 80,
        width: 580,
        height: 1750,
        gap: 24,
        brandY: 1880,
    }),
    "strip-4-h": makeGridLayout({
        canvasW: 1800,
        canvasH: 600,
        cols: 4,
        rows: 1,
        left: 50,
        top: 50,
        width: 1700,
        height: 425,
        gap: 20,
        brandY: 535,
    }),
    "grid-4": makeGridLayout({
        canvasW: 1200,
        canvasH: 1500,
        cols: 2,
        rows: 2,
        left: 80,
        top: 80,
        width: 1040,
        height: 1250,
        gap: 24,
        brandY: 1410,
    }),
    "grid-4-tight": makeGridLayout({
        canvasW: 1200,
        canvasH: 1500,
        cols: 2,
        rows: 2,
        left: 60,
        top: 60,
        width: 1080,
        height: 1300,
        gap: 10,
        brandY: 1425,
    }),
    "grid-6": makeGridLayout({
        canvasW: 1500,
        canvasH: 1200,
        cols: 3,
        rows: 2,
        left: 80,
        top: 80,
        width: 1340,
        height: 933,
        gap: 24,
        brandY: 1100,
    }),
    "grid-6-tight": makeGridLayout({
        canvasW: 1500,
        canvasH: 1200,
        cols: 3,
        rows: 2,
        left: 60,
        top: 60,
        width: 1380,
        height: 980,
        gap: 10,
        brandY: 1115,
    }),
    "grid-9": makeGridLayout({
        canvasW: 1200,
        canvasH: 1400,
        cols: 3,
        rows: 3,
        left: 80,
        top: 80,
        width: 1040,
        height: 1140,
        gap: 16,
        brandY: 1315,
    }),
    "grid-9-tight": makeGridLayout({
        canvasW: 1200,
        canvasH: 1400,
        cols: 3,
        rows: 3,
        left: 60,
        top: 60,
        width: 1080,
        height: 1200,
        gap: 8,
        brandY: 1320,
    }),
    "mosaic-4": makeMosaic4Layout(),
    "frame-green-7": {
        canvas: { w: 735, h: 919 },
        photos: [
            { x: 167, y: 143, w: 179, h: 140 },
            { x: 389, y: 143, w: 179, h: 139 },
            { x: 167, y: 294, w: 179, h: 139 },
            { x: 389, y: 294, w: 178, h: 141 },
            { x: 167, y: 445, w: 179, h: 291 },
            { x: 389, y: 445, w: 179, h: 140 },
            { x: 389, y: 595, w: 179, h: 141 },
        ],
        brand: { y: 880 },
    },
    "frame-memories-4": {
        canvas: { w: 736, h: 1308 },
        photos: [
            { x: 206, y: 60, w: 357, h: 246 },
            { x: 207, y: 319, w: 356, h: 246 },
            { x: 207, y: 578, w: 356, h: 260 },
            { x: 207, y: 852, w: 357, h: 237 },
        ],
        brand: { y: 1260 },
    },
    "frame-red-3": {
        canvas: { w: 450, h: 1176 },
        photos: [
            { x: 32, y: 23, w: 386, h: 300 },
            { x: 32, y: 350, w: 386, h: 300 },
            { x: 32, y: 679, w: 386, h: 301 },
        ],
        brand: { y: 1135 },
    },
    "frame-red2-3": {
        canvas: { w: 510, h: 1093 },
        photos: [
            { x: 93, y: 92, w: 324, h: 250 },
            { x: 93, y: 365, w: 325, h: 252 },
            { x: 92, y: 641, w: 326, h: 253 },
        ],
        brand: { y: 1049 },
    },
    "frame-song-4": {
        canvas: { w: 1200, h: 3600 },
        photos: [
            { x: 49, y: 115, w: 1095, h: 709 },
            { x: 49, y: 863, w: 1095, h: 709 },
            { x: 49, y: 1610, w: 1095, h: 709 },
            { x: 49, y: 2356, w: 1095, h: 709 },
        ],
        brand: { y: 3552 },
    },
};

function resolveLayout(layoutId) {
    const layoutConfig = window.PHOTOBOOTH_CONFIG?.layouts?.[layoutId];
    const frameId = layoutConfig?.default_frame;
    const frameConfig = frameId
        ? window.PHOTOBOOTH_CONFIG?.frames?.[frameId]
        : null;

    if (Array.isArray(frameConfig?.photos) && frameConfig?.canvas) {
        return {
            canvas: {
                w: Number(frameConfig.canvas.w),
                h: Number(frameConfig.canvas.h),
            },
            photos: frameConfig.photos.map((rect) => ({
                x: Number(rect.x),
                y: Number(rect.y),
                w: Number(rect.w),
                h: Number(rect.h),
            })),
            brand: { y: Math.round(Number(frameConfig.canvas.h) * 0.96) },
        };
    }

    return LAYOUTS[layoutId] || LAYOUTS["strip-4"];
}

export function getLayoutPhotoAspectRatio(layoutId, poseIndex = 0) {
    const layout = resolveLayout(layoutId);
    const rect = layout.photos[poseIndex] || layout.photos[0];

    return rect ? rect.w / rect.h : 3 / 4;
}

export function getLayoutPhotoBounds(layoutId) {
    const layout = resolveLayout(layoutId);
    const minX = Math.min(...layout.photos.map((rect) => rect.x));
    const minY = Math.min(...layout.photos.map((rect) => rect.y));
    const maxX = Math.max(...layout.photos.map((rect) => rect.x + rect.w));
    const maxY = Math.max(...layout.photos.map((rect) => rect.y + rect.h));

    return {
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY,
        canvasW: layout.canvas.w,
        canvasH: layout.canvas.h,
    };
}

// Geometry used by automatic decorations. Keep this in the same source as the
// compositor so sticker placement always follows the actual selected layout.
export function getLayoutGeometry(layoutId) {
    const layout = resolveLayout(layoutId);

    return {
        canvas: { ...layout.canvas },
        photos: layout.photos.map((rect) => ({ ...rect })),
        brand: { ...layout.brand },
    };
}

export async function composePhotoStrip(poses, bgStyle) {
    const layoutId = sessionState.layoutId || "strip-4";
    const frameId = sessionState.frameId || "none";
    const frameConfig =
        frameId !== "none" && window.PHOTOBOOTH_CONFIG?.frames?.[frameId]
            ? window.PHOTOBOOTH_CONFIG.frames[frameId]
            : null;
    const isBackgroundFrame = frameConfig && frameConfig.type === "background";
    const isTemplateFrame = frameConfig && frameConfig.type === "template";
    const configuredPhotos = Array.isArray(frameConfig?.photos)
        ? frameConfig.photos.map((rect) => ({
              x: Number(rect.x),
              y: Number(rect.y),
              w: Number(rect.w),
              h: Number(rect.h),
          }))
        : null;
    const configuredCanvas = frameConfig?.canvas
        ? { w: Number(frameConfig.canvas.w), h: Number(frameConfig.canvas.h) }
        : null;

    const layout =
        configuredPhotos && configuredCanvas
            ? {
                  canvas: configuredCanvas,
                  photos: configuredPhotos,
                  brand: { y: Math.round(configuredCanvas.h * 0.96) },
              }
            : LAYOUTS[layoutId] || LAYOUTS["strip-4"];

    const canvas = document.createElement("canvas");
    canvas.width = layout.canvas.w;
    canvas.height = layout.canvas.h;
    const ctx = canvas.getContext("2d");

    // ── 1. Draw Background ────────────────────────────────────────────────────
    const bg = bgStyle ||
        sessionState.bgStyle || {
            type: "solid",
            color: "#ffffff",
            textColor: "#475569",
        };

    if (isTemplateFrame) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (isBackgroundFrame) {
        // Draw frame image as the full background
        try {
            const frameImg = await loadImage(`/${frameConfig.overlay}`);
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
        } catch (e) {
            console.error("Failed to load background frame:", e);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } else {
        if (bg.type === "solid") {
            ctx.fillStyle = bg.color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (bg.type === "gradient") {
            const grad = ctx.createLinearGradient(
                0,
                0,
                bg.horizontal ? canvas.width : 0,
                bg.horizontal ? 0 : canvas.height,
            );
            grad.addColorStop(0, bg.from);
            grad.addColorStop(1, bg.to);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (bg.type === "pattern") {
            ctx.fillStyle = bg.base || "#f8f8f8";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawPattern(ctx, bg.pattern, canvas.width, canvas.height, bg.color);
        }
    }

    // ── 2. Draw Photos ────────────────────────────────────────────────────────
    const borderColor =
        isBackgroundFrame || isTemplateFrame
            ? "transparent"
            : sessionState.frameColor ||
              bg.borderColor ||
              "rgba(255,255,255,0.9)";
    // Force square corners for all background types per user request
    let borderRadius = 0;

    for (let i = 0; i < layout.photos.length; i++) {
        if (!poses[i]) continue;
        const rect = layout.photos[i];
        const img = await loadImage(poses[i]);

        const edit = sessionState.photoEdits?.[i] || {};
        const photoBackground = edit.background || { type: "none" };
        const hasPhotoBackground = photoBackground.type && photoBackground.type !== "none";

        if (photoBackground.type === "color") {
            ctx.save();
            ctx.fillStyle = photoBackground.value || "#ffffff";
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.restore();
        } else if (photoBackground.type === "image" && photoBackground.url) {
            try {
                const backgroundImage = await loadImage(photoBackground.url);
                ctx.save();
                ctx.beginPath();
                ctx.rect(rect.x, rect.y, rect.w, rect.h);
                ctx.clip();
                drawCoverImage(ctx, backgroundImage, rect.x, rect.y, rect.w, rect.h);
                ctx.restore();
            } catch (error) {
                console.error("Failed to load photo background:", error);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            }
        }

        let photoSource = img;
        if (hasPhotoBackground) {
            try {
                photoSource = await removePhotoBackground(poses[i]);
            } catch (error) {
                // Fallback aman: foto tetap tampil walaupun model gagal dimuat.
                console.error("Failed to remove photo background:", error);
                window.__PHOTOBOOTH_BACKGROUND_REMOVAL_ERROR__ = error?.message || String(error);
                photoSource = img;
            }
        }

        // Background pengganti memenuhi slot, sedangkan orang hasil segmentasi
        // digambar di atasnya tanpa mengecilkan foto.
        ctx.save();
        if (borderRadius > 0) {
            roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, borderRadius);
            ctx.clip();
        } else {
            ctx.beginPath();
            ctx.rect(rect.x, rect.y, rect.w, rect.h);
            ctx.clip();
        }

        ctx.filter = resolvePhotoFilter(edit.filter, edit.filterCss);
        drawCoverImage(ctx, photoSource, rect.x, rect.y, rect.w, rect.h);
        ctx.filter = "none";
        ctx.restore();

        // Draw border only for non-background frames
        if (
            !isBackgroundFrame &&
            !isTemplateFrame &&
            borderColor !== "transparent"
        ) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 12;
            ctx.shadowColor = borderColor;
            ctx.shadowBlur = 18;
            if (borderRadius > 0) {
                ctx.beginPath();
                roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, borderRadius);
                ctx.stroke();
            } else {
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
            }
            ctx.shadowBlur = 0;
        }
    }

    // ── 3. Draw Overlay Frame (for overlay-type only) ─────────────────────────
    if (frameConfig && frameConfig.type !== "background") {
        try {
            const overlayImg = await loadImage(`/${frameConfig.overlay}`);
            ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
        } catch (e) {
            console.error("Failed to load frame overlay:", e);
        }
    }

    // ── 4. Watermark / Branding (skip if frame has its own branding) ──────────
    if (!isBackgroundFrame && !isTemplateFrame) {
        const textColor = bg.textColor || "#475569";
        const brandY = layout.brand.y;

        // Dynamic font size based on canvas width
        const titleSize = Math.max(16, Math.round(canvas.width * 0.026));
        const subSize = Math.max(11, Math.round(canvas.width * 0.018));
        const gapY = Math.round(titleSize * 1.15);

        ctx.font = `bold ${titleSize}px "Outfit", sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.85;
        ctx.fillText("Momenta", canvas.width / 2, brandY);

        ctx.font = `${subSize}px "Outfit", sans-serif`;
        ctx.globalAlpha = 0.6;
        ctx.fillText(
            getCurrentDateFormatted(),
            canvas.width / 2,
            brandY + gapY,
        );
        ctx.globalAlpha = 1.0;
    }

    sessionState.compositeCanvas = canvas;
    return canvas;
}

/**
 * Satu pose dengan background pengganti dan filter yang sama seperti di hasil
 * strip, dalam ukuran asli kamera. Dipakai untuk photocard dan ganci.
 */
export async function renderProcessedPose(index) {
    const source = sessionState.poses[index];
    if (!source) throw new Error(`Foto ${index + 1} belum diambil.`);

    const img = await loadImage(source);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");

    const edit = sessionState.photoEdits?.[index] || {};
    const photoBackground = edit.background || { type: "none" };
    let photoSource = img;

    if (photoBackground.type === "color" || (photoBackground.type === "image" && photoBackground.url)) {
        try {
            if (photoBackground.type === "color") {
                ctx.fillStyle = photoBackground.value || "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                drawCoverImage(ctx, await loadImage(photoBackground.url), 0, 0, canvas.width, canvas.height);
            }
            photoSource = await removePhotoBackground(source);
        } catch (error) {
            console.error("Failed to prepare pose background:", error);
            photoSource = img;
        }
    }

    ctx.filter = resolvePhotoFilter(edit.filter, edit.filterCss);
    ctx.drawImage(photoSource, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";

    return canvas;
}

/**
 * Perkiraan posisi wajah (relatif 0–1) dari mask orang hasil segmentasi.
 * Mengembalikan null bila model tidak tersedia, sehingga pemanggil memakai crop tengah.
 */
export async function findPersonFocus(index) {
    const source = sessionState.poses[index];
    if (!source) return null;

    try {
        const foreground = await removePhotoBackground(source);
        const scale = Math.min(1, 200 / foreground.width);
        const w = Math.max(1, Math.round(foreground.width * scale));
        const h = Math.max(1, Math.round(foreground.height * scale));
        const probe = document.createElement("canvas");
        probe.width = w;
        probe.height = h;
        const probeCtx = probe.getContext("2d", { willReadFrequently: true });
        probeCtx.drawImage(foreground, 0, 0, w, h);
        const alpha = probeCtx.getImageData(0, 0, w, h).data;

        let minX = w, minY = h, maxX = -1, maxY = -1;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (alpha[(y * w + x) * 4 + 3] > 96) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        if (maxX < 0) return null;

        const boxH = maxY - minY + 1;
        return {
            x: (minX + maxX + 1) / 2 / w,
            // Wajah berada di bagian atas siluet orang.
            y: (minY + boxH * 0.3) / h,
            height: boxH / h,
        };
    } catch (error) {
        console.error("Failed to locate person:", error);
        return null;
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────


function resolvePhotoFilter(filterId, explicitCss) {
    if (explicitCss && explicitCss !== "none") return explicitCss;

    const filters = {
        none: "none",
        bw: "grayscale(1) contrast(1.06)",
        warm: "sepia(.18) saturate(1.22) hue-rotate(-8deg) brightness(1.04)",
        cold: "saturate(.92) hue-rotate(12deg) contrast(1.04)",
        vintage: "sepia(.42) contrast(.94) saturate(.82) brightness(1.04)",
        vivid: "saturate(1.45) contrast(1.08)",
        soft: "brightness(1.08) contrast(.88) saturate(.92)",
        sepia: "sepia(.78) contrast(1.02)",
    };

    return filters[filterId] || "none";
}

function drawPattern(ctx, type, w, h, color = "#cccccc") {
    ctx.globalAlpha = 1.0;

    if (type === "dots") {
        const spacing = 48;
        for (let x = spacing / 2; x < w; x += spacing) {
            for (let y = spacing / 2; y < h; y += spacing) {
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.22;
                ctx.fill();
            }
        }
    } else if (type === "grid") {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        const spacing = 70;
        for (let x = 0; x < w; x += spacing) {
            ctx.globalAlpha = 0.18;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += spacing) {
            ctx.globalAlpha = 0.18;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    } else if (type === "diagonal") {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.22;
        const spacing = 55;
        for (let i = -h; i < w + h; i += spacing) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + h, h);
            ctx.stroke();
        }

        // ── New rich patterns ──────────────────────────────────────────────────────
    } else if (type === "herringbone") {
        // Zigzag diagonal lines - classic, gender-neutral
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.18;
        const sz = 48;
        for (let row = -2; row < Math.ceil(h / sz) + 2; row++) {
            for (let col = -2; col < Math.ceil(w / sz) + 2; col++) {
                const bx = col * sz * 2;
                const by = row * sz;
                // Left half of V
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + sz, by + sz);
                ctx.stroke();
                // Right half of V
                ctx.beginPath();
                ctx.moveTo(bx + sz, by + sz);
                ctx.lineTo(bx + sz * 2, by);
                ctx.stroke();
            }
        }
    } else if (type === "honeycomb") {
        // Hexagonal honeycomb — geometric & modern
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.18;
        const r = 36; // hex radius
        const hexH = r * Math.sqrt(3);
        for (let row = -1; row < h / hexH + 2; row++) {
            for (let col = -1; col < w / (r * 1.5) + 2; col++) {
                const cx = col * r * 3;
                const cy = row * hexH + (col % 2 === 0 ? 0 : hexH / 2);
                ctx.beginPath();
                for (let s = 0; s < 6; s++) {
                    const angle = (Math.PI / 3) * s - Math.PI / 6;
                    const px = cx + r * Math.cos(angle);
                    const py = cy + r * Math.sin(angle);
                    s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }
    } else if (type === "chevron") {
        // Bold chevron stripes - trendy & energetic
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.2;
        const cw = 80;
        const ch = 40;
        for (let row = -2; row < h / ch + 2; row++) {
            for (let col = -2; col < w / cw + 2; col++) {
                const bx = col * cw;
                const by = row * ch * 2;
                ctx.beginPath();
                ctx.moveTo(bx, by + ch);
                ctx.lineTo(bx + cw / 2, by);
                ctx.lineTo(bx + cw, by + ch);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(bx, by + ch * 2);
                ctx.lineTo(bx + cw / 2, by + ch);
                ctx.lineTo(bx + cw, by + ch * 2);
                ctx.stroke();
            }
        }
    } else if (type === "crosshatch") {
        // Fine crosshatch — classic editorial feel
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.14;
        const sp = 30;
        for (let i = -h; i < w + h; i += sp) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + h, h);
            ctx.stroke();
        }
        for (let i = w + h; i > -h; i -= sp) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i - h, h);
            ctx.stroke();
        }
    } else if (type === "confetti") {
        // Scattered small shapes — fun, playful, gender-neutral
        const shapes = ["circle", "rect", "diamond"];
        const seededRng = (seed) => {
            let s = seed;
            return () => {
                s = (s * 1664525 + 1013904223) & 0xffffffff;
                return (s >>> 0) / 0xffffffff;
            };
        };
        const rng = seededRng(42);
        const cols2 = [color, adjustAlpha(color, 0.6), adjustAlpha(color, 0.4)];
        for (let i = 0; i < 220; i++) {
            const x = rng() * w;
            const y = rng() * h;
            const sz2 = 6 + rng() * 14;
            const shape = shapes[Math.floor(rng() * shapes.length)];
            const col2 = cols2[Math.floor(rng() * cols2.length)];
            ctx.globalAlpha = 0.15 + rng() * 0.2;
            ctx.fillStyle = col2;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rng() * Math.PI * 2);
            ctx.beginPath();
            if (shape === "circle") {
                ctx.arc(0, 0, sz2 / 2, 0, Math.PI * 2);
            } else if (shape === "rect") {
                ctx.rect(-sz2 / 2, -sz2 / 4, sz2, sz2 / 2);
            } else {
                ctx.moveTo(0, -sz2 / 2);
                ctx.lineTo(sz2 / 2, 0);
                ctx.lineTo(0, sz2 / 2);
                ctx.lineTo(-sz2 / 2, 0);
                ctx.closePath();
            }
            ctx.fill();
            ctx.restore();
        }
    } else if (type === "bokeh") {
        // Soft blurred circles — dreamy, photogenic
        const seededRng2 = (seed) => {
            let s = seed;
            return () => {
                s = (s * 1664525 + 1013904223) & 0xffffffff;
                return (s >>> 0) / 0xffffffff;
            };
        };
        const rng2 = seededRng2(99);
        for (let i = 0; i < 55; i++) {
            const x = rng2() * w;
            const y = rng2() * h;
            const r2 = 20 + rng2() * 70;
            const alpha = 0.04 + rng2() * 0.1;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r2);
            grad.addColorStop(0, color);
            grad.addColorStop(1, "transparent");
            ctx.globalAlpha = alpha;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r2, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === "wave") {
        // Flowing horizontal waves — calm, elegant
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.18;
        const waveSpacing = 60;
        const amplitude = 18;
        const freq = (2 * Math.PI) / 200;
        for (let row = 0; row < h + waveSpacing; row += waveSpacing) {
            ctx.beginPath();
            for (let x = 0; x <= w; x += 4) {
                const y = row + Math.sin(x * freq) * amplitude;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    } else if (type === "stars") {
        // Subtle star/asterisk pattern — celestial, sophisticated
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.18;
        const sp2 = 70;
        for (let x = sp2 / 2; x < w + sp2; x += sp2) {
            for (let y = sp2 / 2; y < h + sp2; y += sp2) {
                const r3 = 14;
                for (let k = 0; k < 4; k++) {
                    const angle = (Math.PI / 4) * k;
                    ctx.beginPath();
                    ctx.moveTo(
                        x - Math.cos(angle) * r3,
                        y - Math.sin(angle) * r3,
                    );
                    ctx.lineTo(
                        x + Math.cos(angle) * r3,
                        y + Math.sin(angle) * r3,
                    );
                    ctx.stroke();
                }
            }
        }
    } else if (type === "plaid") {
        // Tartan/plaid — preppy, classic, gender-neutral
        ctx.globalAlpha = 0.12;
        const plaidSz = 80;
        const thickW = 10;
        ctx.fillStyle = color;
        // Thick horizontal bands
        for (let y = 0; y < h; y += plaidSz) {
            ctx.fillRect(0, y, w, thickW);
        }
        // Thick vertical bands
        for (let x = 0; x < w; x += plaidSz) {
            ctx.fillRect(x, 0, thickW, h);
        }
        // Thin crossing lines
        ctx.globalAlpha = 0.06;
        for (let y = plaidSz / 2; y < h; y += plaidSz) {
            ctx.fillRect(0, y, w, 3);
        }
        for (let x = plaidSz / 2; x < w; x += plaidSz) {
            ctx.fillRect(x, 0, 3, h);
        }
    }

    ctx.globalAlpha = 1.0;
}

function adjustAlpha(hexColor, alpha) {
    // Returns same hex color (alpha is applied via globalAlpha, this just returns original)
    return hexColor;
}

function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawCoverImage(ctx, img, x, y, w, h) {
    const imgRatio = img.width / img.height;
    const destRatio = w / h;
    let sx, sy, sw, sh;

    if (imgRatio > destRatio) {
        sh = img.height;
        sw = img.height * destRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
    } else {
        sw = img.width;
        sh = img.width / destRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function getCurrentDateFormatted() {
    const date = new Date();
    const dayNames = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jum'at",
        "Sabtu",
    ];
    const dateText = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return `${dayNames[date.getDay()]} • ${dateText}`;
}
