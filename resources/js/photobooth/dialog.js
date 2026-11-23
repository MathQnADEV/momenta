/*
 * Pop-up bergaya Momenta pengganti alert()/confirm() bawaan browser.
 * showDialog() mengembalikan Promise<boolean>: true bila tombol utama ditekan.
 */

let activeDialog = null;

export function showDialog({
    title,
    message = '',
    confirmText = 'OK',
    cancelText = null,
    tone = 'default',
} = {}) {
    activeDialog?.close(false);

    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'momenta-dialog-overlay';
        overlay.innerHTML = `
            <div class="momenta-dialog momenta-dialog--${tone}" role="alertdialog" aria-modal="true" aria-labelledby="momenta-dialog-title">
                <img class="momenta-dialog-logo" alt="Momenta">
                <h3 class="momenta-dialog-title" id="momenta-dialog-title"></h3>
                <p class="momenta-dialog-message"></p>
                <div class="momenta-dialog-actions"></div>
            </div>`;

        const logo = overlay.querySelector('.momenta-dialog-logo');
        const logoUrl = window.PHOTOBOOTH_CONFIG?.logoUrl;
        if (logoUrl) logo.src = logoUrl;
        else logo.remove();

        overlay.querySelector('.momenta-dialog-title').textContent = title;
        const messageEl = overlay.querySelector('.momenta-dialog-message');
        if (message) messageEl.textContent = message;
        else messageEl.remove();

        const actions = overlay.querySelector('.momenta-dialog-actions');
        const close = result => {
            if (!overlay.isConnected) return;
            overlay.classList.remove('is-open');
            document.removeEventListener('keydown', onKey);
            setTimeout(() => overlay.remove(), 180);
            activeDialog = null;
            resolve(result);
        };
        const onKey = event => {
            if (event.key === 'Escape') close(false);
        };

        if (cancelText) {
            const cancel = document.createElement('button');
            cancel.type = 'button';
            cancel.className = 'momenta-dialog-button momenta-dialog-button--secondary';
            cancel.textContent = cancelText;
            cancel.addEventListener('click', () => close(false));
            actions.append(cancel);
        }

        const confirm = document.createElement('button');
        confirm.type = 'button';
        confirm.className = 'momenta-dialog-button momenta-dialog-button--primary';
        confirm.textContent = confirmText;
        confirm.addEventListener('click', () => close(true));
        actions.append(confirm);

        overlay.addEventListener('click', event => {
            if (event.target === overlay && cancelText) close(false);
        });
        document.addEventListener('keydown', onKey);

        // Dipasang di dalam #app agar ikut skala layar kiosk.
        (document.getElementById('app') || document.body).append(overlay);
        requestAnimationFrame(() => overlay.classList.add('is-open'));
        confirm.focus();
        activeDialog = { close };
    });
}
