const config = window.PHOTOBOOTH_SETTINGS || {};

const tabButtons = document.querySelectorAll('[data-settings-tab]');
const tabPanels = document.querySelectorAll('[data-settings-panel]');

function activateSettingsTab(tab) {
    const target = tab === 'backgrounds' ? 'backgrounds' : 'templates';
    tabButtons.forEach(button => button.classList.toggle('is-active', button.dataset.settingsTab === target));
    tabPanels.forEach(panel => panel.classList.toggle('is-active', panel.dataset.settingsPanel === target));

    const url = new URL(window.location.href);
    if (target === 'backgrounds') url.searchParams.set('tab', 'backgrounds');
    else url.searchParams.delete('tab');
    window.history.replaceState({}, '', url);
}

tabButtons.forEach(button => {
    button.addEventListener('click', () => activateSettingsTab(button.dataset.settingsTab));
});

const form = document.getElementById('background-form');
if (form) {
    const methodInput = document.getElementById('background-method');
    const nameInput = document.getElementById('background-name');
    const descriptionInput = document.getElementById('background-description');
    const imageInput = document.getElementById('background-image');
    const sortOrderInput = document.getElementById('background-sort-order');
    const activeInput = document.getElementById('background-is-active');
    const modeLabel = document.getElementById('background-editor-mode');
    const title = document.getElementById('background-editor-title');
    const saveButton = document.getElementById('btn-save-background');
    const previewImage = document.getElementById('background-preview-image');
    const previewPlaceholder = document.getElementById('background-preview-placeholder');
    let objectUrl = null;

    function releaseObjectUrl() {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
        }
    }

    function showPreview(url) {
        previewImage.src = url;
        previewImage.hidden = false;
        previewPlaceholder.hidden = true;
    }

    function clearPreview() {
        previewImage.removeAttribute('src');
        previewImage.hidden = true;
        previewPlaceholder.hidden = false;
    }

    function resetBackgroundEditor() {
        releaseObjectUrl();
        form.reset();
        form.action = config.backgroundStoreUrl || '/photobooth/settings/backgrounds';
        methodInput.value = 'POST';
        imageInput.required = true;
        sortOrderInput.value = '100';
        activeInput.checked = true;
        modeLabel.textContent = 'BACKGROUND BARU';
        title.textContent = 'Tambah Background';
        saveButton.textContent = 'Simpan Background';
        document.querySelectorAll('[data-background-card]').forEach(card => card.classList.remove('is-editing'));
        clearPreview();
    }

    function loadBackground(background) {
        releaseObjectUrl();
        form.action = background.updateUrl;
        methodInput.value = 'PUT';
        nameInput.value = background.name || '';
        descriptionInput.value = background.description || '';
        imageInput.required = false;
        imageInput.value = '';
        sortOrderInput.value = String(background.sortOrder ?? 100);
        activeInput.checked = Boolean(background.isActive);
        modeLabel.textContent = 'EDIT BACKGROUND';
        title.textContent = background.name || 'Edit Background';
        saveButton.textContent = 'Simpan Perubahan';
        showPreview(background.imageUrl);
        document.querySelectorAll('[data-background-card]').forEach(card => {
            card.classList.toggle('is-editing', Number(card.dataset.backgroundCard) === Number(background.id));
        });
        activateSettingsTab('backgrounds');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    imageInput.addEventListener('change', () => {
        const file = imageInput.files?.[0];
        if (!file) return;
        releaseObjectUrl();
        objectUrl = URL.createObjectURL(file);
        showPreview(objectUrl);
    });

    document.getElementById('btn-new-background')?.addEventListener('click', () => {
        activateSettingsTab('backgrounds');
        resetBackgroundEditor();
        nameInput.focus();
    });
    document.getElementById('btn-reset-background')?.addEventListener('click', resetBackgroundEditor);

    document.querySelectorAll('[data-edit-background]').forEach(button => {
        button.addEventListener('click', () => {
            const background = (config.backgrounds || []).find(item => Number(item.id) === Number(button.dataset.editBackground));
            if (background) loadBackground(background);
        });
    });

    form.addEventListener('submit', event => {
        if (methodInput.value === 'POST' && !imageInput.files?.length) {
            event.preventDefault();
            alert('Pilih gambar background terlebih dahulu.');
        }
    });

    resetBackgroundEditor();
}

activateSettingsTab(config.activeTab || 'templates');
