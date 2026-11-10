const ASSET_BASE = '/vendor/selfie-segmentation';
const foregroundCache = new Map();

let segmenterPromise = null;
let pendingResult = null;
let segmentationQueue = Promise.resolve();

function loadImage(source) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Gambar foto gagal dimuat untuk penghapusan background.'));
        image.src = source;
    });
}

function loadMediaPipeScript() {
    if (window.SelfieSegmentation) return Promise.resolve(window.SelfieSegmentation);

    return new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-selfie-segmentation-loader]');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.SelfieSegmentation), { once: true });
            existing.addEventListener('error', () => reject(new Error('Library penghapus background gagal dimuat.')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = `${ASSET_BASE}/selfie_segmentation.js`;
        script.async = true;
        script.dataset.selfieSegmentationLoader = 'true';
        script.onload = () => {
            if (!window.SelfieSegmentation) {
                reject(new Error('Library penghapus background tidak tersedia.'));
                return;
            }
            resolve(window.SelfieSegmentation);
        };
        script.onerror = () => reject(new Error('Library penghapus background gagal dimuat.'));
        document.head.appendChild(script);
    });
}

async function getSegmenter() {
    if (!segmenterPromise) {
        segmenterPromise = (async () => {
            const SelfieSegmentation = await loadMediaPipeScript();
            const segmenter = new SelfieSegmentation({
                locateFile: file => `${ASSET_BASE}/${file}`,
            });

            segmenter.setOptions({
                modelSelection: 0,
                selfieMode: false,
            });

            segmenter.onResults(results => {
                if (!pendingResult) return;
                const current = pendingResult;
                pendingResult = null;
                current.resolve(results);
            });

            await segmenter.initialize();
            return segmenter;
        })().catch(error => {
            segmenterPromise = null;
            throw error;
        });
    }

    return segmenterPromise;
}

function enqueueSegmentation(task) {
    const next = segmentationQueue.catch(() => undefined).then(task);
    segmentationQueue = next.catch(() => undefined);
    return next;
}

async function segmentImage(image) {
    return enqueueSegmentation(async () => {
        const segmenter = await getSegmenter();

        return new Promise((resolve, reject) => {
            const timeout = window.setTimeout(() => {
                if (pendingResult) pendingResult = null;
                reject(new Error('Proses penghapusan background terlalu lama.'));
            }, 20000);

            pendingResult = {
                resolve: results => {
                    window.clearTimeout(timeout);
                    resolve(results);
                },
            };

            segmenter.send({ image }).catch(error => {
                window.clearTimeout(timeout);
                pendingResult = null;
                reject(error);
            });
        });
    });
}

function buildForegroundCanvas(image, segmentationMask) {
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: true });
    context.clearRect(0, 0, width, height);

    // Mask dibuat sedikit halus agar tepi rambut dan pakaian tidak bergerigi.
    context.save();
    context.filter = 'blur(1.2px)';
    context.drawImage(segmentationMask, 0, 0, width, height);
    context.restore();

    context.globalCompositeOperation = 'source-in';
    context.drawImage(image, 0, 0, width, height);
    context.globalCompositeOperation = 'source-over';

    return canvas;
}

/**
 * Menghasilkan kanvas transparan yang hanya berisi orang dari foto.
 * Hasil disimpan di cache agar pergantian warna/gambar background berikutnya cepat.
 */
export function removePhotoBackground(source) {
    if (!source) {
        return Promise.reject(new Error('Sumber foto tidak tersedia.'));
    }

    if (!foregroundCache.has(source)) {
        foregroundCache.set(source, (async () => {
            const image = await loadImage(source);
            const results = await segmentImage(image);

            if (!results?.segmentationMask) {
                throw new Error('Model tidak menghasilkan mask orang.');
            }

            return buildForegroundCanvas(image, results.segmentationMask);
        })().catch(error => {
            foregroundCache.delete(source);
            throw error;
        }));
    }

    return foregroundCache.get(source);
}
