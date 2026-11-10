import { sessionState } from "./state.js";
import { getLayoutGeometry } from "./compose.js";

const stickerLayer = document.getElementById("sticker-layer");
const clearStickersButton = document.getElementById("btn-clear-stickers");
const canvasWrapper = document.getElementById("canvas-wrapper");
const stickerModeToggle = document.getElementById("sticker-mode-toggle");
const stickerAutoPanel = document.getElementById("sticker-auto-panel");
const stickerManualPanel = document.getElementById("sticker-manual-panel");
const stickerThemeGrid = document.getElementById("sticker-theme-grid");

let lastRenderW = 0;
let lastRenderH = 0;
let controlsBound = false;
let stickerResizeObserver = null;

function positionStickerLayer() {
    const canvas = sessionState.compositeCanvas;
    const wrapper = canvasWrapper;
    if (!canvas || !wrapper) return;

    const wrapperW = wrapper.clientWidth;
    const wrapperH = wrapper.clientHeight;
    const imgRatio = canvas.width / canvas.height;
    const wrapperRatio = wrapperW / wrapperH;

    let renderW, renderH, renderX, renderY;

    if (imgRatio > wrapperRatio) {
        // Image is wider than wrapper (letterboxed top/bottom)
        renderW = wrapperW;
        renderH = wrapperW / imgRatio;
        renderX = 0;
        renderY = (wrapperH - renderH) / 2;
    } else {
        // Image is taller than wrapper (pillarboxed left/right)
        renderH = wrapperH;
        renderW = wrapperH * imgRatio;
        renderY = 0;
        renderX = (wrapperW - renderW) / 2;
    }

    // Scale existing stickers if width/height changed and we have a previous size
    if (
        lastRenderW > 0 &&
        lastRenderH > 0 &&
        (lastRenderW !== renderW || lastRenderH !== renderH)
    ) {
        const scaleX = renderW / lastRenderW;
        const scaleY = renderH / lastRenderH;

        sessionState.stickers.forEach((sticker) => {
            sticker.x = sticker.x * scaleX;
            sticker.y = sticker.y * scaleY;
            sticker.width = sticker.width * scaleX;
            sticker.height = sticker.height * scaleY;

            sticker.element.style.left = `${sticker.x}px`;
            sticker.element.style.top = `${sticker.y}px`;
            sticker.element.style.width = `${sticker.width}px`;
            sticker.element.style.height = `${sticker.height}px`;

            // Adjust font size of the span element inside
            const span = sticker.element.querySelector(".sticker-render-emoji");
            if (span) {
                const currentFontSize =
                    parseFloat(span.style.fontSize) ||
                    (sticker.kind === "text" ? 18 : 40);
                span.style.fontSize = `${currentFontSize * scaleY}px`;
            }
        });
    }

    stickerLayer.style.left = `${renderX}px`;
    stickerLayer.style.top = `${renderY}px`;
    stickerLayer.style.width = `${renderW}px`;
    stickerLayer.style.height = `${renderH}px`;

    lastRenderW = renderW;
    lastRenderH = renderH;
}

let activeSticker = null;
let dragStart = { x: 0, y: 0 };
let stickerStart = { x: 0, y: 0 };
let currentStickerMode = "auto";
let currentAutoTheme = null;

export function initStickers() {
    // Position the sticker layer first to match the composite canvas
    positionStickerLayer();

    // Reset workspace
    stickerLayer.innerHTML = "";
    sessionState.stickers = [];
    activeSticker = null;
    currentStickerMode = sessionState.stickerMode || "auto";
    currentAutoTheme =
        sessionState.stickerTheme ||
        window.PHOTOBOOTH_CONFIG?.stickerAutoThemes?.[0]?.id ||
        null;

    if (!controlsBound) {
        controlsBound = true;
        bindStickerModeToggle();
        bindAutoThemes();
        bindManualStickerPalette();
        bindManualStickerCategories();
        clearStickersButton?.addEventListener("click", clearAllStickers);

        if (canvasWrapper) {
            stickerResizeObserver = new ResizeObserver(() => {
                positionStickerLayer();
                if (currentStickerMode === "auto" && currentAutoTheme) {
                    applyAutoTheme(currentAutoTheme);
                }
            });
            stickerResizeObserver.observe(canvasWrapper);
        }
    }

    syncStickerPanels();

    if (currentStickerMode === "auto") {
        applyAutoTheme(currentAutoTheme);
    }
}

function bindStickerModeToggle() {
    if (!stickerModeToggle) return;

    stickerModeToggle
        .querySelectorAll("[data-sticker-mode]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                currentStickerMode = button.dataset.stickerMode || "manual";
                sessionState.stickerMode = currentStickerMode;
                clearAllStickers();
                syncStickerPanels();
                if (currentStickerMode === "auto" && currentAutoTheme) {
                    applyAutoTheme(currentAutoTheme);
                }
            });
        });
}

function bindAutoThemes() {
    if (!stickerThemeGrid) return;

    stickerThemeGrid.querySelectorAll("[data-auto-theme]").forEach((button) => {
        button.addEventListener("click", () => {
            currentAutoTheme = button.dataset.autoTheme || currentAutoTheme;
            sessionState.stickerTheme = currentAutoTheme;
            stickerThemeGrid
                .querySelectorAll("[data-auto-theme]")
                .forEach((item) => item.classList.remove("selected"));
            button.classList.add("selected");
            if (currentStickerMode === "auto") {
                applyAutoTheme(currentAutoTheme);
            }
        });
    });

    const selectedThemeButton = stickerThemeGrid.querySelector(
        "[data-auto-theme].selected",
    );
    if (selectedThemeButton) {
        currentAutoTheme =
            selectedThemeButton.dataset.autoTheme || currentAutoTheme;
        sessionState.stickerTheme = currentAutoTheme;
    }
}

function bindManualStickerPalette() {
    const stickerPalette = document.querySelectorAll(
        "#sticker-grid .sticker-item[data-sticker-value]",
    );

    stickerPalette.forEach((item) => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);

        newItem.addEventListener("click", () => {
            if (currentStickerMode !== "manual") {
                return;
            }
            const stickerId = newItem.getAttribute("data-sticker-id");
            const stickerKind =
                newItem.getAttribute("data-sticker-kind") || "emoji";
            const stickerValue =
                newItem.getAttribute("data-sticker-value") ||
                newItem.querySelector(".sticker-emoji").textContent.trim();
            addStickerToWorkspace(stickerId, stickerKind, stickerValue);
        });
    });
}

function bindManualStickerCategories() {
    const categoryBar = document.getElementById("manual-sticker-categories");
    const stickerGrid = document.getElementById("sticker-grid");
    if (!categoryBar || !stickerGrid) return;

    const applyFilter = (category) => {
        stickerGrid.querySelectorAll(".sticker-item[data-sticker-category]").forEach((item) => {
            const visible =
                category === "all" || item.dataset.stickerCategory === category;
            item.hidden = !visible;
        });
        stickerGrid.scrollTop = 0;
    };

    categoryBar
        .querySelectorAll("[data-sticker-category-filter]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                categoryBar
                    .querySelectorAll("[data-sticker-category-filter]")
                    .forEach((chip) => chip.classList.remove("selected"));
                button.classList.add("selected");
                applyFilter(button.dataset.stickerCategoryFilter || "all");
            });
        });

    applyFilter(
        categoryBar.querySelector(".selected")?.dataset.stickerCategoryFilter ||
            "all",
    );
}

function syncStickerPanels() {
    if (!stickerModeToggle) return;

    stickerModeToggle
        .querySelectorAll("[data-sticker-mode]")
        .forEach((button) => {
            button.classList.toggle(
                "selected",
                button.dataset.stickerMode === currentStickerMode,
            );
        });

    if (stickerAutoPanel) {
        stickerAutoPanel.style.display =
            currentStickerMode === "auto" ? "flex" : "none";
    }

    if (stickerManualPanel) {
        stickerManualPanel.style.display =
            currentStickerMode === "manual" ? "flex" : "none";
    }

    sessionState.stickerMode = currentStickerMode;
}

function updateStickerDOMTransform(stickerState) {
    stickerState.element.style.transform = `rotate(${stickerState.rotation}deg) scale(${stickerState.scale})`;
}

function addStickerToWorkspace(id, kind, value) {
    const stickerEl = document.createElement("div");
    stickerEl.className = "active-sticker";
    stickerEl.setAttribute("data-id", id);
    stickerEl.setAttribute("data-kind", kind);
    stickerEl.style.setProperty(
        "--sticker-accent",
        kind === "text" ? "#fb7185" : "#38bdf8",
    );

    const isTextSticker = kind === "text";
    const fontSize = isTextSticker ? "13px" : "45px";
    stickerEl.innerHTML = isTextSticker
        ? `
        <span class="sticker-render-emoji sticker-render-text" style="font-size: ${fontSize}; line-height: 1;">${value}</span>
        <button class="sticker-btn-delete">×</button>
        <button class="sticker-btn-resize">⤾</button>
    `
        : `
        <span class="sticker-render-emoji" style="font-size: ${fontSize}; line-height: 1;">${value}</span>
        <button class="sticker-btn-delete">×</button>
        <button class="sticker-btn-resize">⤾</button>
    `;

    // Initial position: center of the stickerLayer
    const layerW = stickerLayer.clientWidth;
    const layerH = stickerLayer.clientHeight;

    const initialWidth = isTextSticker
        ? Math.min(Math.max(110, value.length * 10), 190)
        : 60;
    const initialHeight = isTextSticker ? 60 : 60;
    const initialX = (layerW - initialWidth) / 2;
    const initialY = (layerH - initialHeight) / 2;

    stickerEl.style.left = `${initialX}px`;
    stickerEl.style.top = `${initialY}px`;
    stickerEl.style.width = `${initialWidth}px`;
    stickerEl.style.height = `${initialHeight}px`;

    // State object
    const stickerState = {
        element: stickerEl,
        id: id,
        kind: kind,
        value: value,
        x: initialX,
        y: initialY,
        width: initialWidth,
        height: initialHeight,
        rotation: 0,
        scale: 1,
    };

    sessionState.stickers.push(stickerState);
    stickerLayer.appendChild(stickerEl);
    updateStickerDOMTransform(stickerState);

    // Make active
    selectSticker(stickerState);

    // Bind delete button
    const deleteBtn = stickerEl.querySelector(".sticker-btn-delete");
    deleteBtn.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
    });
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteSticker(stickerState);
    });

    // Bind resize/rotate button
    const resizeBtn = stickerEl.querySelector(".sticker-btn-resize");
    let isResizing = false;
    let resizeStartDist = 1;
    let resizeStartAngle = 0;
    let resizeStartScale = 1;
    let resizeStartRotation = 0;
    let resizeCenterX = 0;
    let resizeCenterY = 0;

    resizeBtn.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        selectSticker(stickerState);

        const rect = stickerEl.getBoundingClientRect();
        resizeCenterX = rect.left + rect.width / 2;
        resizeCenterY = rect.top + rect.height / 2;

        const dx = e.clientX - resizeCenterX;
        const dy = e.clientY - resizeCenterY;
        resizeStartDist = Math.hypot(dx, dy) || 1;
        resizeStartAngle = Math.atan2(dy, dx);

        resizeStartScale = stickerState.scale;
        resizeStartRotation = stickerState.rotation;

        resizeBtn.setPointerCapture(e.pointerId);
        isResizing = true;
        stickerEl.classList.add("resizing");
    });

    resizeBtn.addEventListener("pointermove", (e) => {
        if (!isResizing || !resizeBtn.hasPointerCapture(e.pointerId)) return;
        e.stopPropagation();

        const dx = e.clientX - resizeCenterX;
        const dy = e.clientY - resizeCenterY;
        const curDist = Math.hypot(dx, dy);
        const curAngle = Math.atan2(dy, dx);

        // Scale
        let newScale = resizeStartScale * (curDist / resizeStartDist);
        newScale = Math.max(0.3, Math.min(newScale, 3.0));
        stickerState.scale = newScale;

        // Rotation
        const angleDiff = (curAngle - resizeStartAngle) * (180 / Math.PI);
        let newRotation = (resizeStartRotation + angleDiff) % 360;
        if (newRotation < 0) newRotation += 360;
        stickerState.rotation = newRotation;

        updateStickerDOMTransform(stickerState);
    });

    resizeBtn.addEventListener("pointerup", (e) => {
        if (isResizing) {
            resizeBtn.releasePointerCapture(e.pointerId);
            isResizing = false;
            stickerEl.classList.remove("resizing");
        }
    });

    resizeBtn.addEventListener("pointercancel", (e) => {
        if (isResizing) {
            resizeBtn.releasePointerCapture(e.pointerId);
            isResizing = false;
            stickerEl.classList.remove("resizing");
        }
    });

    // Pointer events for dragging (Pointer Events API handles mouse and touch)
    stickerEl.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        selectSticker(stickerState);

        dragStart.x = e.clientX;
        dragStart.y = e.clientY;

        stickerStart.x = stickerState.x;
        stickerStart.y = stickerState.y;

        stickerEl.setPointerCapture(e.pointerId);
        stickerEl.classList.add("dragging");
    });

    stickerEl.addEventListener("pointermove", (e) => {
        if (!stickerEl.hasPointerCapture(e.pointerId)) return;

        const layerScale = stickerLayer.getBoundingClientRect().width / stickerLayer.clientWidth || 1;
        const dx = (e.clientX - dragStart.x) / layerScale;
        const dy = (e.clientY - dragStart.y) / layerScale;

        let newX = stickerStart.x + dx;
        let newY = stickerStart.y + dy;

        // Bounds checking against stickerLayer
        const maxW = stickerLayer.clientWidth - stickerState.width;
        const maxH = stickerLayer.clientHeight - stickerState.height;

        newX = Math.max(0, Math.min(newX, maxW));
        newY = Math.max(0, Math.min(newY, maxH));

        stickerState.x = newX;
        stickerState.y = newY;

        stickerEl.style.left = `${newX}px`;
        stickerEl.style.top = `${newY}px`;
    });

    stickerEl.addEventListener("pointerup", (e) => {
        if (stickerEl.hasPointerCapture(e.pointerId)) {
            stickerEl.releasePointerCapture(e.pointerId);
            stickerEl.classList.remove("dragging");
        }
    });
}

function intersectionArea(a, b) {
    return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
        Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
}

function chooseAutoPosition(item, index, width, height, renderW, renderH, occupied) {
    const geometry = getLayoutGeometry(sessionState.layoutId);
    const scaleX = renderW / geometry.canvas.w;
    const scaleY = renderH / geometry.canvas.h;
    const photos = geometry.photos.map((photo) => ({
        left: photo.x * scaleX,
        top: photo.y * scaleY,
        right: (photo.x + photo.w) * scaleX,
        bottom: (photo.y + photo.h) * scaleY,
    }));
    const brandY = Number(geometry.brand?.y ?? geometry.canvas.h * 0.94) * scaleY;
    const isHorizontal = geometry.canvas.w / geometry.canvas.h >= 1.45;
    const spreadAllSides = ["strip-3-h", "strip-4-h"].includes(sessionState.layoutId);
    const spreadVerticalTwo = sessionState.layoutId === "split-2-v";
    const spreadVerticalStrip = ["strip-3", "strip-4"].includes(sessionState.layoutId);
    const spreadGridNine = ["grid-9", "grid-9-tight"].includes(sessionState.layoutId);
    const spreadSimpleFrames = ["single", "split-2-h"].includes(sessionState.layoutId);
    const preferTopText = isHorizontal || spreadVerticalTwo || spreadVerticalStrip ||
        spreadGridNine || spreadSimpleFrames;
    const brand = {
        left: renderW * 0.14,
        right: renderW * 0.86,
        top: Math.max(0, brandY - renderH * 0.035),
        bottom: Math.min(renderH, brandY + renderH * 0.035),
    };
    const pad = Math.max(3, Math.min(renderW, renderH) * (isHorizontal ? 0.02 : 0.012));
    const desiredX = Number(item.x ?? 0.5) * renderW;
    const desiredY = Number(item.y ?? 0.5) * renderH;
    const candidates = [];
    const add = (x, y, side, slot = null) => candidates.push({ x, y, side, slot });
    const placedEmojiCount = occupied.filter((rect) => rect.kind !== "text").length;
    const requiredSlot = (spreadAllSides || spreadVerticalTwo || spreadVerticalStrip ||
        spreadGridNine || spreadSimpleFrames) && item.kind !== "text"
        ? placedEmojiCount % (spreadAllSides || spreadSimpleFrames ? 6 : 4)
        : null;

    if (requiredSlot !== null && spreadAllSides) {
        const outer = {
            left: Math.min(...photos.map((photo) => photo.left)),
            top: Math.min(...photos.map((photo) => photo.top)),
            right: Math.max(...photos.map((photo) => photo.right)),
            bottom: Math.max(...photos.map((photo) => photo.bottom)),
        };
        const rowHeight = outer.bottom - outer.top;
        // Exact, distant perimeter slots for the one-row 3/4-photo layouts.
        // Bottom anchors stay outside the watermark's horizontal span.
        const lowerY = Math.min(
            renderH - pad - height / 2,
            Math.max(outer.bottom + height * 0.18, (outer.bottom + brand.top) / 2),
        );
        add(outer.left - width * 0.32, outer.top + rowHeight * 0.18, "left", 0);
        add(outer.right + width * 0.32, outer.top + rowHeight * 0.18, "right", 1);
        add(renderW * 0.07, lowerY, "bottom-left", 2);
        add(renderW * 0.93, lowerY, "bottom-right", 3);
        add(outer.left - width * 0.32, outer.top + rowHeight * 0.82, "left", 4);
        add(outer.right + width * 0.32, outer.top + rowHeight * 0.82, "right", 5);
    }

    if (requiredSlot !== null && spreadVerticalTwo) {
        const topPhoto = photos[0];
        const bottomPhoto = photos[photos.length - 1];

        // Two stacked photos: one decoration on each outer side of each photo.
        add(topPhoto.left - width * 0.28, topPhoto.top + (topPhoto.bottom - topPhoto.top) * 0.34, "left", 0);
        add(topPhoto.right + width * 0.28, topPhoto.top + (topPhoto.bottom - topPhoto.top) * 0.66, "right", 1);
        add(bottomPhoto.left - width * 0.28, bottomPhoto.top + (bottomPhoto.bottom - bottomPhoto.top) * 0.34, "left", 2);
        add(bottomPhoto.right + width * 0.28, bottomPhoto.top + (bottomPhoto.bottom - bottomPhoto.top) * 0.66, "right", 3);
    }

    if (requiredSlot !== null && spreadVerticalStrip) {
        const outer = {
            left: Math.min(...photos.map((photo) => photo.left)),
            top: Math.min(...photos.map((photo) => photo.top)),
            right: Math.max(...photos.map((photo) => photo.right)),
            bottom: Math.max(...photos.map((photo) => photo.bottom)),
        };
        const stripHeight = outer.bottom - outer.top;

        // Alternate down the full strip instead of filling its top edge first.
        add(outer.left - width * 0.28, outer.top + stripHeight * 0.14, "left", 0);
        add(outer.right + width * 0.28, outer.top + stripHeight * 0.38, "right", 1);
        add(outer.left - width * 0.28, outer.top + stripHeight * 0.64, "left", 2);
        add(outer.right + width * 0.28, outer.top + stripHeight * 0.86, "right", 3);
    }

    if (requiredSlot !== null && spreadGridNine) {
        const outer = {
            left: Math.min(...photos.map((photo) => photo.left)),
            top: Math.min(...photos.map((photo) => photo.top)),
            right: Math.max(...photos.map((photo) => photo.right)),
            bottom: Math.max(...photos.map((photo) => photo.bottom)),
        };

        // One emoji per outer corner keeps a dense 3x3 grid balanced.
        add(outer.left - width * 0.25, outer.top - height * 0.25, "top-left", 0);
        add(outer.right + width * 0.25, outer.top - height * 0.25, "top-right", 1);
        add(outer.left - width * 0.25, outer.bottom + height * 0.25, "bottom-left", 2);
        add(outer.right + width * 0.25, outer.bottom + height * 0.25, "bottom-right", 3);
    }

    if (requiredSlot !== null && spreadSimpleFrames) {
        const outer = {
            left: Math.min(...photos.map((photo) => photo.left)),
            top: Math.min(...photos.map((photo) => photo.top)),
            right: Math.max(...photos.map((photo) => photo.right)),
            bottom: Math.max(...photos.map((photo) => photo.bottom)),
        };
        const lowerY = Math.min(
            renderH - pad - height / 2,
            Math.max(outer.bottom + height * 0.18, (outer.bottom + brand.top) / 2),
        );
        const singleFlowerCorner = sessionState.layoutId === "single" &&
            item.themeId === "flower-corner";

        add(outer.left - width * 0.25, outer.top - height * 0.25, "top-left", 0);
        add(outer.right + width * 0.25, outer.top - height * 0.25, "top-right", 1);
        add(outer.left - width * 0.25, lowerY, "bottom-left", 2);
        add(
            outer.right + width * 0.25,
            singleFlowerCorner ? (outer.top + outer.bottom) / 2 : lowerY,
            singleFlowerCorner ? "right-middle" : "bottom-right",
            3,
        );
        const topCenterTaken = occupied.some((rect) => rect.side === "top-center");
        add(
            singleFlowerCorner
                ? outer.right + width * 0.25
                : topCenterTaken ? outer.left - width * 0.25 : renderW / 2,
            singleFlowerCorner
                ? lowerY
                : topCenterTaken ? (outer.top + outer.bottom) / 2 : outer.top - height * 0.25,
            singleFlowerCorner
                ? "bottom-right"
                : topCenterTaken ? "left-middle" : "top-center-extra",
            4,
        );
        add(outer.right + width * 0.25, (outer.top + outer.bottom) / 2, "right-middle", 5);
    }

    if (preferTopText && item.kind === "text") {
        // Horizontal strips have a shallow header. Text belongs in its visual
        // centre and must never be exchanged for a side/bottom position.
        add(renderW / 2, Math.max(pad + height / 2, photos[0].top / 2), "top-center");
    }

    // Canvas perimeter and the edges/corners of every individual photo. This
    // naturally adapts to strips, grids, mosaics, and dynamically loaded frames.
    const xBands = [0.07, 0.22, 0.5, 0.78, 0.93];
    const yBands = [0.045, 0.13, 0.28, 0.5, 0.72, 0.87, 0.955];
    xBands.forEach((x) => {
        if (preferTopText && item.kind === "text") return;
        add(x * renderW, pad + height / 2, "top");
        if (item.kind !== "text") add(x * renderW, renderH - pad - height / 2, "bottom");
    });
    yBands.forEach((y) => {
        if (preferTopText && item.kind === "text") return;
        add(pad + width / 2, y * renderH, "left");
        add(renderW - pad - width / 2, y * renderH, "right");
    });
    photos.forEach((photo) => {
        if (preferTopText && item.kind === "text") return;
        const midX = (photo.left + photo.right) / 2;
        const midY = (photo.top + photo.bottom) / 2;
        add(midX, photo.top - height * 0.32, "top");
        if (item.kind !== "text") add(midX, photo.bottom + height * 0.32, "bottom");
        add(photo.left - width * 0.32, midY, "left");
        add(photo.right + width * 0.32, midY, "right");
        if (item.kind !== "text") {
            add(photo.left, photo.top, "left");
            add(photo.right, photo.top, "right");
            add(photo.left, photo.bottom, "left");
            add(photo.right, photo.bottom, "right");
        }
    });

    const stickerArea = Math.max(1, width * height);
    // The 3/4 horizontal strips have extremely narrow outer margins (about 3%
    // of the canvas), so their perimeter emoji box needs a larger allowance;
    // the visible glyph itself still only touches the photo edge partially.
    const maxPhotoRatio = item.kind === "text"
        ? 0.08
        : spreadVerticalTwo || spreadVerticalStrip || spreadGridNine || spreadSimpleFrames
            ? 0.82
            : spreadAllSides
                ? 0.58
                : 0.22;
    const usedSides = occupied.map((rect) => rect.side);
    let best = null;

    candidates.forEach((candidate, candidateIndex) => {
        if (requiredSlot !== null && candidate.slot !== requiredSlot) return;
        const left = Math.max(pad, Math.min(candidate.x - width / 2, renderW - width - pad));
        const top = Math.max(pad, Math.min(candidate.y - height / 2, renderH - height - pad));
        const rect = { left, top, right: left + width, bottom: top + height };
        const photoOverlap = photos.reduce((sum, photo) => sum + intersectionArea(rect, photo), 0);
        // A two-photo horizontal strip has almost no outer margin. Its six
        // layout-aware slots are final; rejecting one here would activate the
        // theme-coordinate fallback and leave another edge empty.
        const fixedTwoHorizontalSlot = sessionState.layoutId === "split-2-h" &&
            requiredSlot !== null;
        if (!fixedTwoHorizontalSlot && photoOverlap / stickerArea > maxPhotoRatio) return;
        if (intersectionArea(rect, brand) > 0) return;
        if (occupied.some((other) => intersectionArea(
            { left: rect.left - pad, top: rect.top - pad, right: rect.right + pad, bottom: rect.bottom + pad },
            other,
        ) > 0)) return;

        const distance = Math.hypot(candidate.x - desiredX, candidate.y - desiredY) /
            Math.max(renderW, renderH);
        const reusePenalty = usedSides.filter((side) => side === candidate.side).length *
            (spreadAllSides || spreadVerticalTwo || spreadVerticalStrip || spreadGridNine || spreadSimpleFrames ? 1.25 : isHorizontal ? 0.65 : 0.2);
        const textTopPenalty = item.kind === "text" &&
            candidate.side !== "top" && candidate.side !== "top-center" ? 2 : 0;
        const overlapPenalty = (photoOverlap / stickerArea) * 1.5;
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const nearestStickerDistance = occupied.length
            ? Math.min(...occupied.map((other) => Math.hypot(
                centerX - (other.left + other.right) / 2,
                centerY - (other.top + other.bottom) / 2,
            ))) / Math.max(renderW, renderH)
            : 1;
        // Non-overlapping is not enough visually: keep decorations well apart
        // on 2/4-box horizontal frames so they read as a balanced perimeter.
        const proximityPenalty = spreadAllSides || spreadVerticalTwo || spreadVerticalStrip || spreadGridNine || spreadSimpleFrames
            ? Math.max(0, 0.3 - nearestStickerDistance) * 18
            : 0;
        // Stable tie-breaker keeps the result natural but reproducible per theme.
        const score = distance + reusePenalty + textTopPenalty +
            overlapPenalty + proximityPenalty +
            ((candidateIndex + index * 7) % 11) * 0.002;
        if (!best || score < best.score) best = { ...rect, side: candidate.side, score };
    });

    // All layouts should normally find a collision-free candidate. The fallback
    // remains above the photos and, importantly, never drops text onto branding.
    return best || {
        left: Math.max(pad, Math.min(desiredX - width / 2, renderW - width - pad)),
        top: pad,
        right: 0,
        bottom: pad + height,
        side: "top",
    };
}

function applyAutoTheme(themeId) {
    const themes = window.PHOTOBOOTH_CONFIG?.stickerAutoThemes || [];
    const theme = themes.find((item) => item.id === themeId) || themes[0];
    if (!theme) return;

    clearAllStickers();

    const renderW = stickerLayer.clientWidth;
    const renderH = stickerLayer.clientHeight;
    const geometry = getLayoutGeometry(sessionState.layoutId);
    const isHorizontal = geometry.canvas.w / geometry.canvas.h >= 1.45;
    const hasCompactTopText = isHorizontal ||
        ["single", "split-2-v", "strip-3", "strip-4", "grid-9", "grid-9-tight"].includes(sessionState.layoutId);
    const firstPhotoTop = Math.min(...geometry.photos.map((photo) => photo.y));
    const headerHeight = firstPhotoTop / geometry.canvas.h * renderH;

    const occupied = [];
    const orderedItems = [...theme.items].sort((a, b) =>
        (a.kind === "text" ? -1 : 0) - (b.kind === "text" ? -1 : 0),
    );

    orderedItems.forEach((item, index) => {
        const stickerEl = document.createElement("div");
        stickerEl.className = "active-sticker auto-sticker";
        stickerEl.setAttribute("data-id", `${theme.id}-${index}`);
        stickerEl.setAttribute("data-kind", item.kind);
        stickerEl.style.setProperty(
            "--sticker-accent",
            item.kind === "text" ? "#fb7185" : "#38bdf8",
        );

        const requestedSize = Math.min(renderW, renderH) * (item.size || 0.1);
        const size = hasCompactTopText && item.kind === "text"
            ? Math.max(12, Math.min(requestedSize, headerHeight * 0.68))
            : Math.max(20, requestedSize);
        const textWidthFactor = Math.min(3.4, Math.max(1.9, item.value.length * 0.34 + 1));
        const stickerWidth = item.kind === "text" ? size * textWidthFactor : size;
        const stickerHeight = size;

        const fontSize =
            item.kind === "text" ? `${size * 0.22}px` : `${size * 0.75}px`;
        stickerEl.innerHTML =
            item.kind === "text"
                ? `
            <span class="sticker-render-emoji sticker-render-text" style="font-size: ${fontSize}; line-height: 1;">${item.value}</span>
        `
                : `
            <span class="sticker-render-emoji" style="font-size: ${fontSize}; line-height: 1;">${item.value}</span>
        `;

        const position = chooseAutoPosition(
            { ...item, themeId: theme.id },
            index, stickerWidth, stickerHeight, renderW, renderH, occupied,
        );
        const left = position.left;
        const top = position.top;
        occupied.push({
            left,
            top,
            right: left + stickerWidth,
            bottom: top + stickerHeight,
            side: position.side,
            kind: item.kind,
        });

        stickerEl.style.left = `${left}px`;
        stickerEl.style.top = `${top}px`;
        stickerEl.style.width = `${stickerWidth}px`;
        stickerEl.style.height = `${stickerHeight}px`;
        stickerEl.style.transform = `rotate(${item.rotation || 0}deg)`;
        stickerEl.style.pointerEvents = "none";
        stickerEl.style.cursor = "default";

        const stickerState = {
            element: stickerEl,
            id: `${theme.id}-${index}`,
            kind: item.kind,
            value: item.value,
            x: left,
            y: top,
            width: stickerWidth,
            height: stickerHeight,
            rotation: item.rotation || 0,
            scale: 1,
            auto: true,
        };

        sessionState.stickers.push(stickerState);
        stickerLayer.appendChild(stickerEl);
    });
}

function selectSticker(stickerState) {
    document
        .querySelectorAll(".active-sticker")
        .forEach((el) => el.classList.remove("selected"));
    stickerState.element.classList.add("selected");
    activeSticker = stickerState;
}

function deleteSticker(stickerState) {
    stickerState.element.remove();
    sessionState.stickers = sessionState.stickers.filter(
        (s) => s !== stickerState,
    );
    if (activeSticker === stickerState) {
        activeSticker = null;
    }
}

function clearAllStickers() {
    stickerLayer.innerHTML = "";
    sessionState.stickers = [];
    activeSticker = null;
}

// Flat-draw stickers onto high-res compositeCanvas
export async function flattenStickersToCanvas() {
    const canvas = sessionState.compositeCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const renderW = stickerLayer.clientWidth;

    // Calculate the correct scaling factor based on the rendered image, not the wrapper
    const scale = canvas.width / renderW;

    for (const sticker of sessionState.stickers) {
        // Compute high-res coordinates based on the sticker position inside sticker-layer
        const resX = (sticker.x + sticker.width / 2) * scale;
        const resY = (sticker.y + sticker.height / 2) * scale;
        const resW = sticker.width * scale * sticker.scale;
        const resH = sticker.height * scale * sticker.scale;

        ctx.save();

        // Move origin to center of sticker for rotation
        ctx.translate(resX, resY);
        ctx.rotate((sticker.rotation * Math.PI) / 180);

        // Draw emoji directly on canvas using the selected color.
        const stickerSize =
            sticker.kind === "text" ? resH * 0.25 : Math.max(resW, resH) * 0.82;
        ctx.font = `${sticker.kind === "text" ? "800" : "400"} ${stickerSize}px "Outfit", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (sticker.kind === "text") {
            const paddingX = Math.max(12, resW * 0.06);
            const paddingY = Math.max(6, resH * 0.06);
            const bubbleW = Math.max(
                resW * 0.8,
                ctx.measureText(sticker.value).width + paddingX * 2,
            );
            const bubbleH = Math.max(
                resH * 0.5,
                stickerSize * 1.3 + paddingY * 2,
            );
            ctx.shadowColor = "rgba(15, 23, 42, 0.18)";
            ctx.shadowBlur = 14;
            ctx.fillStyle = "rgba(255, 255, 255, 0.84)";
            ctx.beginPath();
            ctx.rect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH); // Define the rectangle path
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.lineWidth = Math.max(4, bubbleH * 0.06);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
            // Use the path defined above to draw the stroke, ensuring it's a sharp rectangle
            ctx.stroke();
            ctx.fillStyle = "#0f172a";
            ctx.fillText(sticker.value, 0, 0);
        } else {
            ctx.shadowColor = "rgba(15, 23, 42, 0.16)";
            ctx.shadowBlur = 10;
            ctx.fillStyle = "#ffffff";
            ctx.fillText(sticker.value, 0, 0);
        }

        ctx.restore();
    }
}
