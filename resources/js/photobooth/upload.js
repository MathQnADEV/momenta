import { sessionState } from './state.js';

const uploadProgress = document.getElementById('upload-progress');
const uploadError = document.getElementById('upload-error');
const retryUploadBtn = document.getElementById('btn-retry-upload');
const qrCodeContainer = document.getElementById('qr-code');
const qrUrlElement = document.getElementById('qr-url');

export async function uploadPhotoStrip() {
    const canvas = sessionState.compositeCanvas;
    if (!canvas) return false;

    sessionState.uploadStatus = 'uploading';
    showStatusUI('uploading');

    // Get Blob from canvas
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    
    const formData = new FormData();
    formData.append('photo', blob, 'photobooth.jpg');
    formData.append('frame_id', sessionState.frameId);

    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    let responseData = null;

    while (attempt < maxRetries && !success) {
        attempt++;
        try {
            console.log(`Mengunggah foto... Percobaan ke-${attempt}`);
            const response = await fetch(window.PHOTOBOOTH_CONFIG.apiUploadUrl, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': window.PHOTOBOOTH_CONFIG.csrfToken,
                    'Accept': 'application/json'
                },
                body: formData
            });

            if (response.ok) {
                responseData = await response.json();
                success = true;
            } else {
                const errorText = await response.text();
                throw new Error(`Server merespon dengan status ${response.status}: ${errorText}`);
            }
        } catch (err) {
            console.error(`Gagal mengunggah pada percobaan ke-${attempt}:`, err);
            if (attempt < maxRetries) {
                // Wait with backoff
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }

    if (success && responseData) {
        sessionState.uploadStatus = 'success';
        sessionState.photoSlug = responseData.slug;
        sessionState.downloadUrl = responseData.download_url;
        sessionState.qrSvg = responseData.qr_svg;

        // Render QR
        qrCodeContainer.innerHTML = responseData.qr_svg;
        qrUrlElement.textContent = responseData.download_url;
        qrUrlElement.setAttribute('href', responseData.download_url);
        qrUrlElement.setAttribute('target', '_blank');

        showStatusUI('success');
        return true;
    } else {
        sessionState.uploadStatus = 'error';
        showStatusUI('error');
        return false;
    }
}

function showStatusUI(status) {
    if (status === 'uploading') {
        uploadProgress.style.display = 'flex';
        uploadError.style.display = 'none';
        qrCodeContainer.parentElement.style.opacity = '0.3';
    } else if (status === 'success') {
        uploadProgress.style.display = 'none';
        uploadError.style.display = 'none';
        qrCodeContainer.parentElement.style.opacity = '1';
    } else if (status === 'error') {
        uploadProgress.style.display = 'none';
        uploadError.style.display = 'flex';
        qrCodeContainer.parentElement.style.opacity = '0.3';
    }
}

// Bind retry button
if (retryUploadBtn) {
    retryUploadBtn.addEventListener('click', uploadPhotoStrip);
}
