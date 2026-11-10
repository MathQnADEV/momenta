export const sessionState = {
    step: 'layout',
    layoutId: null,
    bgStyle: null,
    frameId: 'none',
    frameColor: 'transparent',
    captureDelay: 3,
    stickerMode: 'auto',
    stickerTheme: null,
    decorateMode: 'background',
    poses: [],
    photoEdits: [],
    selectedPhotoIndex: 0,
    compositeCanvas: null,
    stickers: [],
    drawStrokes: [],
    uploadStatus: 'idle',
    photoSlug: null,
    downloadUrl: null,
    qrSvg: null,

    reset() {
        this.step = 'layout';
        this.layoutId = null;
        this.bgStyle = null;
        this.frameId = 'none';
        this.frameColor = 'transparent';
        this.captureDelay = 3;
        this.stickerMode = 'auto';
        this.stickerTheme = null;
        this.decorateMode = 'background';
        this.poses = [];
        this.photoEdits = [];
        this.selectedPhotoIndex = 0;
        this.compositeCanvas = null;
        this.stickers = [];
        this.drawStrokes = [];
        this.uploadStatus = 'idle';
        this.photoSlug = null;
        this.downloadUrl = null;
        this.qrSvg = null;
    }
};
