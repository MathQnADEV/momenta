import { sessionState } from './state.js';

const wrapper = document.getElementById('canvas-wrapper');
const drawingCanvas = document.getElementById('drawing-canvas');
const brushSizeInput = document.getElementById('draw-brush-size');
const brushSizeValue = document.getElementById('draw-brush-size-value');
const eraserButton = document.getElementById('btn-draw-eraser');
const undoButton = document.getElementById('btn-draw-undo');
const clearButton = document.getElementById('btn-draw-clear');

let initialized = false;
let drawingEnabled = false;
let drawing = false;
let activePointerId = null;
let currentStroke = null;
let brushColor = '#ef4444';
let brushSize = 12;
let eraserEnabled = false;
let resizeObserver = null;

function getContext() {
    return drawingCanvas?.getContext('2d');
}

function getCanvasDisplayRect() {
    const composite = sessionState.compositeCanvas;
    if (!wrapper || !composite) return null;

    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;
    const imageRatio = composite.width / composite.height;
    const wrapperRatio = wrapperWidth / wrapperHeight;

    let width;
    let height;
    let left;
    let top;

    if (imageRatio > wrapperRatio) {
        width = wrapperWidth;
        height = wrapperWidth / imageRatio;
        left = 0;
        top = (wrapperHeight - height) / 2;
    } else {
        height = wrapperHeight;
        width = wrapperHeight * imageRatio;
        top = 0;
        left = (wrapperWidth - width) / 2;
    }

    return { width, height, left, top };
}

function syncCanvasGeometry() {
    const composite = sessionState.compositeCanvas;
    if (!drawingCanvas || !composite) return;

    const dimensionsChanged =
        drawingCanvas.width !== composite.width ||
        drawingCanvas.height !== composite.height;

    if (dimensionsChanged) {
        drawingCanvas.width = composite.width;
        drawingCanvas.height = composite.height;
    }

    const displayRect = getCanvasDisplayRect();
    if (!displayRect) return;

    drawingCanvas.style.left = `${displayRect.left}px`;
    drawingCanvas.style.top = `${displayRect.top}px`;
    drawingCanvas.style.width = `${displayRect.width}px`;
    drawingCanvas.style.height = `${displayRect.height}px`;

    if (dimensionsChanged) redrawAllStrokes();
}

function pointFromEvent(event) {
    const rect = drawingCanvas.getBoundingClientRect();
    const scaleX = drawingCanvas.width / rect.width;
    const scaleY = drawingCanvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
    };
}

function drawSegment(context, stroke, from, to) {
    context.save();
    context.globalCompositeOperation = stroke.eraser
        ? 'destination-out'
        : 'source-over';
    context.strokeStyle = stroke.color;
    context.lineWidth = Math.max(2, stroke.sizeRatio * drawingCanvas.width);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    context.restore();
}

function redrawAllStrokes() {
    const context = getContext();
    if (!context || !drawingCanvas) return;

    context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

    sessionState.drawStrokes.forEach(stroke => {
        if (!stroke.points?.length) return;

        if (stroke.points.length === 1) {
            const point = stroke.points[0];
            drawSegment(context, stroke, point, { x: point.x + 0.01, y: point.y + 0.01 });
            return;
        }

        for (let index = 1; index < stroke.points.length; index += 1) {
            drawSegment(context, stroke, stroke.points[index - 1], stroke.points[index]);
        }
    });
}

function updateToolUI() {
    document.querySelectorAll('[data-draw-color]').forEach(button => {
        button.classList.toggle('selected', button.dataset.drawColor === brushColor && !eraserEnabled);
    });

    eraserButton?.classList.toggle('selected', eraserEnabled);

    if (brushSizeValue) brushSizeValue.textContent = `${brushSize}px`;
    if (undoButton) undoButton.disabled = sessionState.drawStrokes.length === 0;
    if (clearButton) clearButton.disabled = sessionState.drawStrokes.length === 0;
}

function handlePointerDown(event) {
    if (!drawingEnabled || drawing || !drawingCanvas) return;

    event.preventDefault();
    drawing = true;
    activePointerId = event.pointerId;
    drawingCanvas.setPointerCapture(event.pointerId);

    currentStroke = {
        color: brushColor,
        eraser: eraserEnabled,
        sizeRatio: brushSize / Math.max(1, drawingCanvas.clientWidth),
        points: [pointFromEvent(event)],
    };

    sessionState.drawStrokes.push(currentStroke);
    updateToolUI();
}

function handlePointerMove(event) {
    if (!drawing || event.pointerId !== activePointerId || !currentStroke) return;

    event.preventDefault();
    const nextPoint = pointFromEvent(event);
    const previousPoint = currentStroke.points[currentStroke.points.length - 1];
    currentStroke.points.push(nextPoint);

    const context = getContext();
    if (context) drawSegment(context, currentStroke, previousPoint, nextPoint);
}

function finishStroke(event) {
    if (!drawing || event.pointerId !== activePointerId) return;

    event.preventDefault();
    if (drawingCanvas.hasPointerCapture(event.pointerId)) {
        drawingCanvas.releasePointerCapture(event.pointerId);
    }

    drawing = false;
    activePointerId = null;
    currentStroke = null;
    updateToolUI();
}

function bindControls() {
    document.querySelectorAll('[data-draw-color]').forEach(button => {
        button.addEventListener('click', () => {
            brushColor = button.dataset.drawColor || brushColor;
            eraserEnabled = false;
            updateToolUI();
        });
    });

    brushSizeInput?.addEventListener('input', () => {
        brushSize = Number(brushSizeInput.value) || 12;
        updateToolUI();
    });

    eraserButton?.addEventListener('click', () => {
        eraserEnabled = !eraserEnabled;
        updateToolUI();
    });

    undoButton?.addEventListener('click', () => {
        sessionState.drawStrokes.pop();
        redrawAllStrokes();
        updateToolUI();
    });

    clearButton?.addEventListener('click', () => {
        resetDrawing();
    });

    drawingCanvas?.addEventListener('pointerdown', handlePointerDown);
    drawingCanvas?.addEventListener('pointermove', handlePointerMove);
    drawingCanvas?.addEventListener('pointerup', finishStroke);
    drawingCanvas?.addEventListener('pointercancel', finishStroke);
}

export function initDrawing() {
    if (!drawingCanvas || !wrapper || !sessionState.compositeCanvas) return;

    syncCanvasGeometry();
    redrawAllStrokes();

    if (!initialized) {
        initialized = true;
        bindControls();

        resizeObserver = new ResizeObserver(() => {
            syncCanvasGeometry();
        });
        resizeObserver.observe(wrapper);
    }

    updateToolUI();
}

export function setDrawingEnabled(enabled) {
    drawingEnabled = Boolean(enabled);
    if (!drawingCanvas) return;

    drawingCanvas.classList.toggle('drawing-enabled', drawingEnabled);
    drawingCanvas.style.pointerEvents = drawingEnabled ? 'auto' : 'none';
}

export function resetDrawing() {
    sessionState.drawStrokes = [];
    const context = getContext();
    if (context && drawingCanvas) {
        context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    }
    updateToolUI();
}

export function flattenDrawingToCanvas() {
    const composite = sessionState.compositeCanvas;
    if (!composite || !drawingCanvas || sessionState.drawStrokes.length === 0) return;

    composite.getContext('2d').drawImage(drawingCanvas, 0, 0, composite.width, composite.height);
}
