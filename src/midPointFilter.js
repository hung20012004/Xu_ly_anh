/**
 * Midpoint Filter Implementation
 * Thuật toán lọc trung điểm giữa Max và Min để làm mượt ảnh
 * File: ./src/midpointFilter.js
 */

class MidpointFilter {
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

                console.log(`Đang áp dụng Midpoint Filter với kernel ${this.kernelSize}x${this.kernelSize}`);
                this.processImageData(imageData, originalData, canvas.width, canvas.height);

                ctx.putImageData(imageData, 0, 0);
                console.log('Hoàn thành lọc Midpoint!');
                resolve(canvas);
            } catch (error) {
                console.error('Lỗi khi áp dụng Midpoint Filter:', error);
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
                const midpointColors = this.calculateMidpointValues(originalData, x, y, width, height);

                newData[pixelIndex] = midpointColors.r;
                newData[pixelIndex + 1] = midpointColors.g;
                newData[pixelIndex + 2] = midpointColors.b;
                newData[pixelIndex + 3] = originalData[pixelIndex + 3]; // giữ alpha
            }
        }

        for (let i = 0; i < data.length; i++) {
            data[i] = newData[i];
        }
    }

    calculateMidpointValues(data, centerX, centerY, width, height) {
        let minR = 255, minG = 255, minB = 255;
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

                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];

                minR = Math.min(minR, r);
                maxR = Math.max(maxR, r);

                minG = Math.min(minG, g);
                maxG = Math.max(maxG, g);

                minB = Math.min(minB, b);
                maxB = Math.max(maxB, b);
            }
        }

        return {
            r: Math.round((minR + maxR) / 2),
            g: Math.round((minG + maxG) / 2),
            b: Math.round((minB + maxB) / 2)
        };
    }
}