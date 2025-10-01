/**
 * Max Filter Implementation
 * Thuật toán lọc cực đại (Maximum Filter) để làm mượt ảnh hoặc tăng sáng vùng nhiễu đen
 * File: ./src/maxFilter.js
 */

class MaxFilter {
    constructor(kernelSize = 3) {
        if (kernelSize % 2 === 0) {
            throw new Error('Kernel size phải là số lẻ!');
        }
        this.kernelSize = kernelSize;
        this.radius = Math.floor(kernelSize / 2);
    }

    async applyFilter(imageElement) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = imageElement.naturalWidth || imageElement.width;
                canvas.height = imageElement.naturalHeight || imageElement.height;
                ctx.drawImage(imageElement, 0, 0);

                let imageData, originalData;
                try {
                    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    originalData = new Uint8ClampedArray(imageData.data);
                } catch (corsError) {
                    console.warn('CORS Error detected. Không thể truy cập pixel.');
                    reject(corsError);
                    return;
                }

                console.log(`Đang áp dụng Max Filter với kernel ${this.kernelSize}x${this.kernelSize}`);
                this.processImageData(imageData, originalData, canvas.width, canvas.height);

                ctx.putImageData(imageData, 0, 0);
                console.log('Hoàn thành lọc Max!');
                resolve(canvas);
            } catch (error) {
                console.error('Lỗi khi áp dụng Max Filter:', error);
                reject(error);
            }
        });
    }

    processImageData(imageData, originalData, width, height) {
        const data = imageData.data;
        const newData = new Uint8ClampedArray(data.length);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;
                const maxColors = this.calculateMaxValues(originalData, x, y, width, height);

                newData[pixelIndex] = maxColors.r;
                newData[pixelIndex + 1] = maxColors.g;
                newData[pixelIndex + 2] = maxColors.b;
                newData[pixelIndex + 3] = originalData[pixelIndex + 3]; // giữ alpha
            }
        }

        for (let i = 0; i < data.length; i++) {
            data[i] = newData[i];
        }
    }

    calculateMaxValues(data, centerX, centerY, width, height) {
        let maxR = 0, maxG = 0, maxB = 0;

        for (let dy = -this.radius; dy <= this.radius; dy++) {
            for (let dx = -this.radius; dx <= this.radius; dx++) {
                let newX = centerX + dx;
                let newY = centerY + dy;

                // Mirror padding
                if (newX < 0) newX = -newX;
                if (newX >= width) newX = width - 1 - (newX - width + 1);
                if (newY < 0) newY = -newY;
                if (newY >= height) newY = height - 1 - (newY - height + 1);

                newX = Math.max(0, Math.min(width - 1, newX));
                newY = Math.max(0, Math.min(height - 1, newY));

                const index = (newY * width + newX) * 4;

                maxR = Math.max(maxR, data[index]);
                maxG = Math.max(maxG, data[index + 1]);
                maxB = Math.max(maxB, data[index + 2]);
            }
        }

        return {
            r: maxR,
            g: maxG,
            b: maxB
        };
    }
}