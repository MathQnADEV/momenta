import { sessionState } from './state.js';
import { getLayoutPhotoAspectRatio } from './compose.js';

let stream = null;
let captureInProgress = false;

const videoElement = document.getElementById('camera-video');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const flashOverlay = document.getElementById('flash-overlay');
const cameraError = document.getElementById('camera-error');
const retryCameraButton = document.getElementById('btn-retry-camera');
const startCaptureButton = document.getElementById('btn-start-capture');

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForVideoReady() {
    if (videoElement?.videoWidth && videoElement?.videoHeight) return;

    await Promise.race([
        new Promise(resolve => {
            videoElement?.addEventListener('loadedmetadata', resolve, { once: true });
        }),
        wait(2500),
    ]);

    if (!videoElement?.videoWidth || !videoElement?.videoHeight) {
        throw new Error('Dimensi video belum tersedia.');
    }
}

export async function initCamera() {
    if (!videoElement || !navigator.mediaDevices?.getUserMedia) {
        if (cameraError) cameraError.style.display = 'flex';
        return false;
    }

    if (stream?.active && videoElement.srcObject === stream) {
        if (cameraError) cameraError.style.display = 'none';
        if (startCaptureButton && !captureInProgress) startCaptureButton.disabled = false;
        return true;
    }

    stopCamera();

    if (cameraError) cameraError.style.display = 'none';
    if (startCaptureButton) startCaptureButton.disabled = true;

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                aspectRatio: { ideal: 16 / 9 },
            },
            audio: false,
        });

        videoElement.srcObject = stream;
        await videoElement.play();
        await waitForVideoReady();

        if (startCaptureButton) startCaptureButton.disabled = false;
        return true;
    } catch (error) {
        console.error('Gagal mengakses kamera:', error);
        if (cameraError) cameraError.style.display = 'flex';
        return false;
    }
}

export function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    if (videoElement) videoElement.srcObject = null;
}

export function resetPoseThumbs() {
    document.querySelectorAll('.pose-thumb').forEach(thumb => {
        thumb.classList.remove('captured', 'active');
        thumb.style.backgroundImage = 'none';
        const numSpan = thumb.querySelector('.pose-num');
        if (numSpan) numSpan.style.display = 'grid';
    });
}

function setPoseThumb(index, dataUrl) {
    const thumb = document.querySelector(`.pose-thumb[data-pose="${index}"]`);
    if (!thumb) return;

    thumb.classList.remove('active');
    thumb.classList.add('captured');
    thumb.style.backgroundImage = `url(${dataUrl})`;
    thumb.style.backgroundSize = 'cover';
    thumb.style.backgroundPosition = 'center';

    const numSpan = thumb.querySelector('.pose-num');
    if (numSpan) numSpan.style.display = 'none';
}

async function runCountdown(seconds) {
    if (!countdownOverlay || !countdownNumber) return;

    countdownOverlay.classList.add('active');

    for (let count = seconds; count > 0; count -= 1) {
        countdownNumber.textContent = String(count);
        countdownNumber.classList.remove('countdown-pop');
        void countdownNumber.offsetWidth;
        countdownNumber.classList.add('countdown-pop');
        await wait(1000);
    }

    countdownOverlay.classList.remove('active');
}

function calculateCrop(videoWidth, videoHeight, targetAspectRatio) {
    let sourceWidth = videoHeight * targetAspectRatio;
    let sourceHeight = videoHeight;
    let sourceX = (videoWidth - sourceWidth) / 2;
    let sourceY = 0;

    if (sourceWidth > videoWidth) {
        sourceWidth = videoWidth;
        sourceHeight = videoWidth / targetAspectRatio;
        sourceX = 0;
        sourceY = (videoHeight - sourceHeight) / 2;
    }

    return { sourceX, sourceY, sourceWidth, sourceHeight };
}

function getOutputSize(targetAspectRatio) {
    const maxDimension = 1600;

    if (targetAspectRatio >= 1) {
        return {
            width: maxDimension,
            height: Math.max(1, Math.round(maxDimension / targetAspectRatio)),
        };
    }

    return {
        width: Math.max(1, Math.round(maxDimension * targetAspectRatio)),
        height: maxDimension,
    };
}

async function capturePose(index, countdownSeconds) {
    await waitForVideoReady();

    const thumb = document.querySelector(`.pose-thumb[data-pose="${index}"]`);
    thumb?.classList.add('active');

    await runCountdown(countdownSeconds);

    flashOverlay?.classList.add('flash-active');
    setTimeout(() => flashOverlay?.classList.remove('flash-active'), 450);

    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    const targetAspectRatio = getLayoutPhotoAspectRatio(sessionState.layoutId, index);
    const crop = calculateCrop(videoWidth, videoHeight, targetAspectRatio);
    const output = getOutputSize(targetAspectRatio);

    const canvas = document.createElement('canvas');
    canvas.width = output.width;
    canvas.height = output.height;

    const context = canvas.getContext('2d', { alpha: false });
    context.save();
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(
        videoElement,
        crop.sourceX,
        crop.sourceY,
        crop.sourceWidth,
        crop.sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
    );
    context.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    sessionState.poses[index] = dataUrl;
    setPoseThumb(index, dataUrl);

    return dataUrl;
}

async function withCaptureLock(callback) {
    if (captureInProgress) return false;

    captureInProgress = true;
    if (startCaptureButton) startCaptureButton.disabled = true;
    document.querySelectorAll('.pose-thumb-retake').forEach(button => {
        button.disabled = true;
    });

    try {
        await callback();
        return true;
    } finally {
        captureInProgress = false;
        if (startCaptureButton) startCaptureButton.disabled = false;
        document.querySelectorAll('.pose-thumb-retake').forEach(button => {
            button.disabled = false;
        });
    }
}

export async function runCaptureSequence(
    onComplete,
    countdownSeconds = sessionState.captureDelay || 3,
) {
    const layout = window.PHOTOBOOTH_CONFIG?.layouts?.[sessionState.layoutId];
    const totalPoses = Number(layout?.poses || 0);
    const missingIndexes = Array.from({ length: totalPoses }, (_, index) => index)
        .filter(index => !sessionState.poses[index]);

    if (missingIndexes.length === 0) {
        onComplete?.();
        return true;
    }

    return withCaptureLock(async () => {
        for (let position = 0; position < missingIndexes.length; position += 1) {
            await capturePose(missingIndexes[position], countdownSeconds);

            if (position < missingIndexes.length - 1) {
                await wait(900);
            }
        }

        onComplete?.();
    });
}

export async function captureSinglePose(
    poseIndex,
    onComplete,
    countdownSeconds = sessionState.captureDelay || 3,
) {
    return withCaptureLock(async () => {
        await capturePose(poseIndex, countdownSeconds);
        onComplete?.(poseIndex);
    });
}

if (retryCameraButton) {
    retryCameraButton.addEventListener('click', initCamera);
}
