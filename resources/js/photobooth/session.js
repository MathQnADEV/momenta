import { sessionState } from './state.js';
import {
    initCamera,
    stopCamera,
    runCaptureSequence,
    captureSinglePose,
} from './camera.js';
import { composePhotoStrip } from './compose.js';
import { initStickers, flattenStickersToCanvas } from './stickers.js';
import {
    initDrawing,
    setDrawingEnabled,
    resetDrawing,
    flattenDrawingToCanvas,
} from './doodle.js';
import { uploadPhotoStrip } from './upload.js';

document.addEventListener('DOMContentLoaded', () => {
    const stepOrder = ['layout', 'capture', 'style', 'stickers', 'preview'];
    const captureDescription = document.getElementById('capture-desc');
    const poseIndicators = document.getElementById('pose-indicators');
    const btnStartCapture = document.getElementById('btn-start-capture');
    const btnRetakeAll = document.getElementById('btn-retake-all');
    const stickerLayer = document.getElementById('sticker-layer');
    const stickerWorkspace = document.querySelector('.sticker-workspace');
    const backgroundPanel = document.getElementById('decorate-background-panel');
    const filterPanel = document.getElementById('decorate-filter-panel');
    const stickerPanel = document.getElementById('decorate-sticker-panel');
    const drawPanel = document.getElementById('decorate-draw-panel');
    const photoEditSelector = document.getElementById('photo-edit-selector');
    const photoEditTargetGrid = document.getElementById('photo-edit-target-grid');
    const selectedPhotoEditLabel = document.getElementById('selected-photo-edit-label');
    const colorPicker = document.getElementById('photo-background-color');
    const colorPreview = document.getElementById('photo-background-color-preview');
    const backgroundProcessingStatus = document.getElementById('background-processing-status');
    const clearStickersButton = document.getElementById('btn-clear-stickers');
    const templateManualNotice = document.getElementById('template-manual-notice');
    const autoStickerButton = document.querySelector('[data-sticker-mode="auto"]');

    let stylePreviewDebounce = null;
    let decorationRefreshDebounce = null;
    let backgroundSourceTab = 'none';
    let backgroundRefreshToken = 0;
    let backgroundStatusTimer = null;

    function makePhotoEdit() {
        return {
            background: { type: 'none' },
            filter: 'none',
            filterCss: 'none',
        };
    }

    function ensurePhotoEdits(total = sessionState.poses.length) {
        const current = Array.isArray(sessionState.photoEdits) ? sessionState.photoEdits : [];
        sessionState.photoEdits = Array.from({ length: total }, (_, index) => ({
            ...makePhotoEdit(),
            ...(current[index] || {}),
            background: {
                type: 'none',
                ...(current[index]?.background || {}),
            },
        }));
        sessionState.selectedPhotoIndex = Math.max(
            0,
            Math.min(Number(sessionState.selectedPhotoIndex) || 0, Math.max(0, total - 1)),
        );
    }

    function selectedPhotoEdit() {
        ensurePhotoEdits();
        return sessionState.photoEdits[sessionState.selectedPhotoIndex] || sessionState.photoEdits[0];
    }

    function getCaptureCounts() {
        const total = Number(
            window.PHOTOBOOTH_CONFIG.layouts?.[sessionState.layoutId]?.poses || 0,
        );
        const captured = sessionState.poses.filter(Boolean).length;
        return { total, captured };
    }

    function isTemplateLayout() {
        const layout = window.PHOTOBOOTH_CONFIG.layouts?.[sessionState.layoutId];
        return Boolean(layout?.default_frame);
    }

    function returnToCapture() {
        renderPoseIndicators();
        goToStep('capture');
    }

    function updateCaptureUI() {
        if (!btnStartCapture) return;

        const { total, captured } = getCaptureCounts();

        if (captured === 0) {
            btnStartCapture.textContent = 'Mulai Ambil Foto';
            if (captureDescription) {
                captureDescription.textContent = 'Foto akan diambil berurutan sesuai timer.';
            }
        } else if (captured < total) {
            btnStartCapture.textContent = `Ambil ${total - captured} Foto Tersisa`;
            if (captureDescription) {
                captureDescription.textContent = 'Lanjutkan foto yang belum terisi.';
            }
        } else {
            btnStartCapture.textContent = isTemplateLayout()
                ? 'Semua Foto Oke — Lanjut ke Hias'
                : 'Semua Foto Oke — Lanjut ke Gaya';
            if (captureDescription) {
                captureDescription.textContent = 'Periksa hasilnya. Gunakan Ulang Foto atau Ulang Semua Foto bila perlu.';
            }
        }

        if (btnRetakeAll) {
            btnRetakeAll.hidden = !(total > 0 && captured === total);
        }
    }

    function renderPoseIndicators() {
        const layout = window.PHOTOBOOTH_CONFIG.layouts?.[sessionState.layoutId];
        if (!poseIndicators || !layout) return;

        poseIndicators.innerHTML = '';
        poseIndicators.dataset.poseCount = String(layout.poses);

        for (let index = 0; index < Number(layout.poses); index += 1) {
            const pose = sessionState.poses[index];
            const thumb = document.createElement('div');
            thumb.className = `pose-thumb${pose ? ' captured' : ''}`;
            thumb.dataset.pose = String(index);
            if (pose) {
                thumb.style.backgroundImage = `url(${pose})`;
                thumb.style.backgroundSize = 'cover';
                thumb.style.backgroundPosition = 'center';
            }

            thumb.innerHTML = `
                <span class="pose-num" style="display:${pose ? 'none' : 'grid'}">${index + 1}</span>
                <span class="pose-status">Foto ${index + 1}</span>
                <button class="pose-thumb-retake" type="button" data-pose="${index}" ${pose ? '' : 'disabled'}>
                    Ulang Foto
                </button>
            `;

            poseIndicators.appendChild(thumb);
        }
    }

    function updateProgress(newStep) {
        const activeIndex = stepOrder.indexOf(newStep);

        document.querySelectorAll('.progress-bar .step').forEach(step => {
            const index = stepOrder.indexOf(step.dataset.step);
            step.classList.toggle('active', index === activeIndex);
            step.classList.toggle('completed', activeIndex > index || newStep === 'qr');
        });
    }

    function syncDecorateMode() {
        const mode = sessionState.decorateMode || 'background';
        const drawMode = mode === 'draw';
        const stickerMode = mode === 'stickers';
        const photoEditMode = mode === 'background' || mode === 'filter';

        document.querySelectorAll('[data-decorate-mode]').forEach(button => {
            button.classList.toggle('selected', button.dataset.decorateMode === mode);
        });

        if (backgroundPanel) backgroundPanel.style.display = mode === 'background' ? 'flex' : 'none';
        if (filterPanel) filterPanel.style.display = mode === 'filter' ? 'flex' : 'none';
        if (stickerPanel) stickerPanel.style.display = stickerMode ? 'flex' : 'none';
        if (drawPanel) drawPanel.style.display = drawMode ? 'flex' : 'none';
        if (photoEditSelector) photoEditSelector.style.display = photoEditMode ? 'flex' : 'none';
        stickerWorkspace?.classList.toggle('has-photo-selector', photoEditMode);
        if (clearStickersButton) clearStickersButton.style.display = stickerMode ? 'grid' : 'none';

        stickerLayer?.classList.toggle('decorating-disabled', !stickerMode);
        setDrawingEnabled(drawMode);
    }

    function setBackgroundSourceTab(tab) {
        const nextTab = ['none', 'photo', 'color'].includes(tab) ? tab : 'none';
        backgroundSourceTab = nextTab;

        document.querySelectorAll('[data-background-source-tab]').forEach(button => {
            const selected = button.dataset.backgroundSourceTab === nextTab;
            button.classList.toggle('selected', selected);
            button.setAttribute('aria-selected', selected ? 'true' : 'false');
        });

        document.querySelectorAll('[data-background-source-pane]').forEach(pane => {
            pane.hidden = pane.dataset.backgroundSourcePane !== nextTab;
        });
    }

    function showBackgroundStatus(message, state = 'loading', autoHide = false) {
        if (!backgroundProcessingStatus) return;
        if (backgroundStatusTimer) window.clearTimeout(backgroundStatusTimer);

        backgroundProcessingStatus.textContent = message;
        backgroundProcessingStatus.dataset.state = state;
        backgroundProcessingStatus.hidden = false;

        if (autoHide) {
            backgroundStatusTimer = window.setTimeout(() => {
                backgroundProcessingStatus.hidden = true;
            }, 1800);
        }
    }

    function syncTemplateStickerAccess() {
        const templateLayout = isTemplateLayout();

        if (templateManualNotice) templateManualNotice.hidden = !templateLayout;
        if (autoStickerButton) {
            autoStickerButton.disabled = templateLayout;
            autoStickerButton.setAttribute('aria-disabled', templateLayout ? 'true' : 'false');
        }

        if (templateLayout) {
            sessionState.stickerMode = 'manual';
        }
    }

    function syncPhotoEditControls() {
        const edit = selectedPhotoEdit();
        const background = edit?.background || { type: 'none' };
        const selectedIndex = sessionState.selectedPhotoIndex;

        if (selectedPhotoEditLabel) {
            selectedPhotoEditLabel.textContent = `Foto ${selectedIndex + 1} dipilih`;
        }

        document.querySelectorAll('.photo-edit-target').forEach(button => {
            button.classList.toggle('selected', Number(button.dataset.photoIndex) === selectedIndex);
        });

        document.querySelectorAll('[data-photo-background-url]').forEach(button => {
            button.classList.toggle(
                'selected',
                background.type === 'image' && button.dataset.photoBackgroundUrl === background.url,
            );
        });

        document.querySelectorAll('[data-photo-background-color]').forEach(button => {
            button.classList.toggle(
                'selected',
                background.type === 'color' && button.dataset.photoBackgroundColor?.toLowerCase() === String(background.value || '').toLowerCase(),
            );
        });

        document.getElementById('btn-clear-photo-background')?.classList.toggle(
            'selected',
            background.type === 'none',
        );

        document.querySelectorAll('[data-photo-filter]').forEach(button => {
            button.classList.toggle('selected', button.dataset.photoFilter === (edit?.filter || 'none'));
        });

        if (background.type === 'color' && background.value && colorPicker) {
            colorPicker.value = background.value;
        }
        if (colorPreview && colorPicker) {
            colorPreview.style.setProperty('--picked-color', colorPicker.value);
        }

        setBackgroundSourceTab(
            background.type === 'image' ? 'photo' : background.type === 'color' ? 'color' : 'none',
        );
    }

    function renderPhotoEditTargets() {
        if (!photoEditTargetGrid) return;
        ensurePhotoEdits();
        photoEditTargetGrid.innerHTML = '';

        sessionState.poses.forEach((pose, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `photo-edit-target${index === sessionState.selectedPhotoIndex ? ' selected' : ''}`;
            button.dataset.photoIndex = String(index);
            button.innerHTML = `
                <span class="photo-edit-target-thumb" style="background-image:url('${pose || ''}')"></span>
                <strong>Foto ${index + 1}</strong>
            `;
            button.addEventListener('click', () => {
                sessionState.selectedPhotoIndex = index;
                syncPhotoEditControls();
            });
            photoEditTargetGrid.appendChild(button);
        });

        syncPhotoEditControls();
    }

    function paintCompositeCanvas() {
        const canvas = document.getElementById('composite-canvas');
        if (!canvas || !sessionState.compositeCanvas) return;
        canvas.width = sessionState.compositeCanvas.width;
        canvas.height = sessionState.compositeCanvas.height;
        canvas.getContext('2d').drawImage(sessionState.compositeCanvas, 0, 0);
    }

    async function refreshDecorationBase() {
        await composePhotoStrip(sessionState.poses, sessionState.bgStyle);
        paintCompositeCanvas();
        initDrawing();
    }

    function scheduleDecorationRefresh({ backgroundChange = false } = {}) {
        if (decorationRefreshDebounce) clearTimeout(decorationRefreshDebounce);
        const refreshToken = ++backgroundRefreshToken;

        if (backgroundChange) {
            window.__PHOTOBOOTH_BACKGROUND_REMOVAL_ERROR__ = null;
            showBackgroundStatus('Menghapus background foto...', 'loading');
        }

        decorationRefreshDebounce = setTimeout(async () => {
            try {
                await refreshDecorationBase();
                if (refreshToken !== backgroundRefreshToken || !backgroundChange) return;

                const removalError = window.__PHOTOBOOTH_BACKGROUND_REMOVAL_ERROR__;
                if (removalError) {
                    showBackgroundStatus('Background gagal dihapus. Foto asli tetap digunakan.', 'error');
                } else {
                    showBackgroundStatus('Background berhasil diterapkan.', 'success', true);
                }
            } catch (error) {
                console.error('Gagal memperbarui background/filter:', error);
                if (backgroundChange) {
                    showBackgroundStatus('Background gagal diproses. Coba pilih ulang.', 'error');
                }
            }
        }, 80);
    }

    async function renderDecorationCanvas() {
        syncTemplateStickerAccess();
        ensurePhotoEdits();
        await composePhotoStrip(sessionState.poses, sessionState.bgStyle);
        paintCompositeCanvas();
        renderPhotoEditTargets();
        initStickers();
        initDrawing();
        syncDecorateMode();
    }

    function goToStep(newStep) {
        document.querySelectorAll('.session-step').forEach(section => {
            section.classList.remove('active');
        });

        sessionState.step = newStep;
        document.getElementById(`step-${newStep}`)?.classList.add('active');
        updateProgress(newStep);

        if (newStep === 'capture') {
            initCamera();
            updateCaptureUI();
        } else {
            stopCamera();
        }

        if (newStep === 'style') refreshStylePreview();
        if (newStep === 'stickers') {
            const backStyleButton = document.getElementById('btn-back-style');
            if (backStyleButton) {
                backStyleButton.textContent = isTemplateLayout()
                    ? 'Kembali ke Foto'
                    : 'Ganti Gaya';
            }
            renderDecorationCanvas().catch(error => {
                console.error('Gagal menyiapkan halaman hias:', error);
                alert('Gagal menyiapkan halaman hias. Silakan coba lagi.');
            });
        }
        if (newStep !== 'stickers') setDrawingEnabled(false);
    }

    function refreshStylePreview() {
        const previewCanvas = document.getElementById('style-preview-canvas');
        if (!previewCanvas || !sessionState.poses.every(Boolean)) return;

        if (stylePreviewDebounce) clearTimeout(stylePreviewDebounce);
        stylePreviewDebounce = setTimeout(async () => {
            await composePhotoStrip(sessionState.poses, sessionState.bgStyle);
            if (!sessionState.compositeCanvas) return;

            previewCanvas.width = sessionState.compositeCanvas.width;
            previewCanvas.height = sessionState.compositeCanvas.height;
            previewCanvas.getContext('2d').drawImage(sessionState.compositeCanvas, 0, 0);
        }, 80);
    }

    document.querySelectorAll('[data-layout-category]').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.layoutCategory;

            document.querySelectorAll('[data-layout-category]').forEach(item => {
                const selected = item === button;
                item.classList.toggle('selected', selected);
                item.setAttribute('aria-selected', selected ? 'true' : 'false');
            });

            document.querySelectorAll('[data-layout-category-card]').forEach(card => {
                card.hidden = card.dataset.layoutCategoryCard !== category;
            });
        });
    });

    document.querySelectorAll('.layout-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.layout-card').forEach(item => item.classList.remove('selected'));
            card.classList.add('selected');

            sessionState.layoutId = card.dataset.layoutId;
            sessionState.frameId = card.dataset.defaultFrame || 'none';
            sessionState.frameColor = 'transparent';
            sessionState.stickerMode = card.dataset.isTemplate === 'true' ? 'manual' : 'auto';
            sessionState.decorateMode = 'background';
            sessionState.poses = Array(
                Number(window.PHOTOBOOTH_CONFIG.layouts[sessionState.layoutId].poses),
            ).fill(null);
            sessionState.photoEdits = sessionState.poses.map(makePhotoEdit);
            sessionState.selectedPhotoIndex = 0;
            sessionState.stickers = [];
            resetDrawing();

            renderPoseIndicators();
            goToStep('capture');
        });
    });

    poseIndicators?.addEventListener('click', async event => {
        const retakeButton = event.target.closest('.pose-thumb-retake');
        if (!retakeButton || retakeButton.disabled) return;

        const poseIndex = Number(retakeButton.dataset.pose);
        retakeButton.textContent = 'Menunggu...';

        await captureSinglePose(
            poseIndex,
            () => {
                renderPoseIndicators();
                updateCaptureUI();
            },
            sessionState.captureDelay || 3,
        );
    });

    document.querySelectorAll('[data-capture-seconds]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('[data-capture-seconds]').forEach(item => item.classList.remove('selected'));
            chip.classList.add('selected');
            sessionState.captureDelay = Number(chip.dataset.captureSeconds) || 3;
        });
    });

    const selectedTimer = document.querySelector('[data-capture-seconds].selected');
    if (selectedTimer) {
        sessionState.captureDelay = Number(selectedTimer.dataset.captureSeconds) || 3;
    }

    btnStartCapture?.addEventListener('click', async () => {
        const { total, captured } = getCaptureCounts();

        if (total > 0 && captured === total) {
            goToStep(isTemplateLayout() ? 'stickers' : 'style');
            return;
        }

        await runCaptureSequence(
            () => {
                renderPoseIndicators();
                updateCaptureUI();
            },
            sessionState.captureDelay || 3,
        );
    });

    btnRetakeAll?.addEventListener('click', async () => {
        const { total } = getCaptureCounts();
        if (total < 1) return;

        btnRetakeAll.disabled = true;
        sessionState.poses = Array(total).fill(null);
        sessionState.photoEdits = Array.from({ length: total }, makePhotoEdit);
        sessionState.selectedPhotoIndex = 0;
        sessionState.compositeCanvas = null;
        sessionState.stickers = [];
        resetDrawing();
        renderPoseIndicators();
        updateCaptureUI();

        try {
            await runCaptureSequence(
                () => {
                    renderPoseIndicators();
                    updateCaptureUI();
                },
                sessionState.captureDelay || 3,
            );
        } finally {
            btnRetakeAll.disabled = false;
        }
    });

    document.getElementById('btn-back-layout')?.addEventListener('click', () => goToStep('layout'));

    document.querySelectorAll('.bg-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.bg-swatch').forEach(item => item.classList.remove('selected'));
            swatch.classList.add('selected');
            sessionState.bgStyle = JSON.parse(swatch.dataset.bg);
            refreshStylePreview();
        });
    });

    const firstBackground = document.querySelector('.bg-swatch');
    if (firstBackground && !sessionState.bgStyle) firstBackground.click();

    document.querySelectorAll('[data-frame-color]').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('[data-frame-color]').forEach(item => item.classList.remove('selected'));
            button.classList.add('selected');
            sessionState.frameColor = button.dataset.frameColor;
            refreshStylePreview();
        });
    });

    const selectedFrameColor = document.querySelector('[data-frame-color].selected');
    if (selectedFrameColor) sessionState.frameColor = selectedFrameColor.dataset.frameColor;

    document.getElementById('btn-finish-style')?.addEventListener('click', () => {
        if (!sessionState.bgStyle) firstBackground?.click();
        goToStep('stickers');
    });

    document.querySelectorAll('[data-decorate-mode]').forEach(button => {
        button.addEventListener('click', () => {
            sessionState.decorateMode = button.dataset.decorateMode || 'background';
            syncDecorateMode();
        });
    });

    document.querySelectorAll('[data-background-source-tab]').forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.backgroundSourceTab || 'none';
            setBackgroundSourceTab(tab);

            if (tab === 'none') {
                const edit = selectedPhotoEdit();
                if (!edit) return;
                edit.background = { type: 'none' };
                syncPhotoEditControls();
                scheduleDecorationRefresh();
            }
        });
    });

    colorPicker?.addEventListener('input', () => {
        const edit = selectedPhotoEdit();
        if (!edit) return;

        colorPreview?.style.setProperty('--picked-color', colorPicker.value);
        edit.background = { type: 'color', value: colorPicker.value };
        syncPhotoEditControls();
        scheduleDecorationRefresh({ backgroundChange: true });
    });

    document.querySelectorAll('[data-photo-background-color]').forEach(button => {
        button.addEventListener('click', () => {
            const edit = selectedPhotoEdit();
            const value = button.dataset.photoBackgroundColor;
            if (!edit || !value) return;

            edit.background = { type: 'color', value };
            if (colorPicker) colorPicker.value = value;
            syncPhotoEditControls();
            scheduleDecorationRefresh({ backgroundChange: true });
        });
    });

    document.getElementById('btn-clear-photo-background')?.addEventListener('click', () => {
        const edit = selectedPhotoEdit();
        if (!edit) return;
        edit.background = { type: 'none' };
        syncPhotoEditControls();
        scheduleDecorationRefresh();
    });

    document.querySelectorAll('[data-photo-background-url]').forEach(button => {
        button.addEventListener('click', () => {
            const edit = selectedPhotoEdit();
            if (!edit) return;
            edit.background = {
                type: 'image',
                url: button.dataset.photoBackgroundUrl,
                name: button.dataset.photoBackgroundName || 'Background',
            };
            syncPhotoEditControls();
            scheduleDecorationRefresh({ backgroundChange: true });
        });
    });

    document.querySelectorAll('[data-photo-filter]').forEach(button => {
        button.addEventListener('click', () => {
            const edit = selectedPhotoEdit();
            if (!edit) return;
            edit.filter = button.dataset.photoFilter || 'none';
            edit.filterCss = button.dataset.photoFilterCss || 'none';
            syncPhotoEditControls();
            scheduleDecorationRefresh();
        });
    });

    document.getElementById('btn-back-style')?.addEventListener('click', () => {
        if (isTemplateLayout()) {
            returnToCapture();
            return;
        }
        goToStep('style');
    });

    document.querySelectorAll('.btn-retake-photos').forEach(button => {
        button.addEventListener('click', returnToCapture);
    });

    const finishDecorationsButton = document.getElementById('btn-finish-stickers');
    finishDecorationsButton?.addEventListener('click', async () => {
        finishDecorationsButton.disabled = true;
        finishDecorationsButton.textContent = 'Memproses...';

        try {
            await flattenStickersToCanvas();
            flattenDrawingToCanvas();

            const finalCanvas = document.getElementById('final-canvas');
            if (!finalCanvas || !sessionState.compositeCanvas) return;

            finalCanvas.width = sessionState.compositeCanvas.width;
            finalCanvas.height = sessionState.compositeCanvas.height;
            finalCanvas.getContext('2d').drawImage(sessionState.compositeCanvas, 0, 0);
            goToStep('preview');
        } catch (error) {
            console.error('Gagal memproses hiasan:', error);
            alert('Gagal memproses hiasan. Silakan coba lagi.');
        } finally {
            finishDecorationsButton.disabled = false;
            finishDecorationsButton.textContent = 'Lanjut ke Preview';
        }
    });

    document.getElementById('btn-back-stickers')?.addEventListener('click', () => goToStep('stickers'));

    const saveButton = document.getElementById('btn-save-photo');
    saveButton?.addEventListener('click', async () => {
        saveButton.disabled = true;
        goToStep('qr');
        await uploadPhotoStrip();
        saveButton.disabled = false;
    });
});
