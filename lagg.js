
export class LagOptimizer {

    constructor(renderer, coinField, fpsElement = null) {
        this.renderer = renderer;
        this.coinField = coinField;
        this.fpsElement = fpsElement;

        this.quality = 0.85;
        this.minQuality = 0.55;
        this.maxQuality = 1.15;

        this.frames = 0;
        this.time = 0;
        this.fps = 60;
        this.slowFrames = 0;
        this.fastFrames = 0;

        this.lastQualityChange = 0;

        this.applyQuality();
        this.optimizeCoinUpdates();
    }

    applyQuality() {
        const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            1.5
        ) * this.quality;

        this.renderer.setPixelRatio(pixelRatio);

        this.renderer.setSize(
            window.innerWidth,
            window.innerHeight,
            false
        );
    }

    resize() {
        this.applyQuality();
    }

    optimizeCoinUpdates() {
        const mesh = this.coinField?.coins;

        if (!mesh || mesh.userData.partialUpdateOptimized) {
            return;
        }

        const originalSetMatrixAt = mesh.setMatrixAt.bind(mesh);

        mesh.setMatrixAt = (index, matrix) => {
            originalSetMatrixAt(index, matrix);

            const attribute = mesh.instanceMatrix;

            // Nur den geänderten Bereich übertragen.
            attribute.clearUpdateRanges();
            attribute.addUpdateRange(index * 16, 16);
        };

        mesh.userData.partialUpdateOptimized = true;
    }

    update(delta) {
        this.frames++;
        this.time += delta;
        this.lastQualityChange += delta;

        if (this.time < 1) return;

        this.fps = Math.round(this.frames / this.time);

        if (this.fpsElement) {
            this.fpsElement.textContent =
                `${this.fps} FPS | Grafik ${Math.round(this.quality * 100)}%`;
        }

        if (this.fps < 42) {
            this.slowFrames++;
            this.fastFrames = 0;
        } else if (this.fps > 57) {
            this.fastFrames++;
            this.slowFrames = 0;
        } else {
            this.slowFrames = Math.max(0, this.slowFrames - 1);
            this.fastFrames = 0;
        }

        // Qualität bei längerem Ruckeln reduzieren.
        if (
            this.slowFrames >= 2 &&
            this.lastQualityChange > 2
        ) {
            this.quality = Math.max(
                this.minQuality,
                this.quality - 0.10
            );

            this.slowFrames = 0;
            this.lastQualityChange = 0;
            this.applyQuality();
        }

        // Qualität bei stabiler Leistung langsam erhöhen.
        if (
            this.fastFrames >= 5 &&
            this.lastQualityChange > 5
        ) {
            this.quality = Math.min(
                this.maxQuality,
                this.quality + 0.05
            );

            this.fastFrames = 0;
            this.lastQualityChange = 0;
            this.applyQuality();
        }

        this.frames = 0;
        this.time = 0;
    }

    getFPS() {
        return this.fps;
    }

    getQuality() {
        return this.quality;
    }
}
