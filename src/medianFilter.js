/**
 * Median Filter Implementation
 * Thuật toán lọc trung vị để giảm nhiễu ảnh
 * File: ./src/medianFilter.js
 */

class MedianFilter {
    constructor(kernelSize = 3) {
        if (kernelSize % 2 === 0) {
            throw new Error('Kernel size phải là số lẻ!');
        }
        this.kernelSize = kernelSize;
        this.radius = Math.floor(kernelSize / 2);
    }

    /**
     * Phương pháp thay thế khi gặp CORS error
     * Áp dụng filter đơn giản bằng CSS filters
     * @param {HTMLImageElement} imageElement 
     * @param {HTMLCanvasElement} canvas 
     * @param {CanvasRenderingContext2D} ctx 
     * @returns {HTMLCanvasElement}
     */
    applySimpleFilter(imageElement, canvas, ctx) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.filter = 'blur(1px)';
        tempCtx.drawImage(imageElement, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        ctx.drawImage(tempCanvas, 0, 0);
        console.log('Đã áp dụng Simple Filter (CSS blur) do CORS restriction');
        return canvas;
    }

    /**
     * Áp dụng bộ lọc trung vị lên ảnh
     * @param {HTMLImageElement} imageElement - Element ảnh input
     * @returns {Promise<HTMLCanvasElement>} - Canvas chứa ảnh đã lọc
     */
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
                    console.warn('CORS Error detected, using alternative method...');
                    resolve(this.applySimpleFilter(imageElement, canvas, ctx));
                    return;
                }

                console.log(`Đang áp dụng Median Filter với kernel ${this.kernelSize}x${this.kernelSize}`);
                console.log(`Kích thước ảnh: ${canvas.width}x${canvas.height}`);

                this.processImageData(imageData, originalData, canvas.width, canvas.height);

                ctx.putImageData(imageData, 0, 0);
                console.log('Hoàn thành lọc trung vị!');
                resolve(canvas);
            } catch (error) {
                console.error('Lỗi khi áp dụng Median Filter:', error);
                reject(error);
            }
        });
    }

    /**
     * Xử lý dữ liệu pixel với thuật toán Median Filter
     * @param {ImageData} imageData - Dữ liệu ảnh để sửa đổi
     * @param {Uint8ClampedArray} originalData - Dữ liệu ảnh gốc
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     */
    processImageData(imageData, originalData, width, height) {
        const data = imageData.data;
        const newData = new Uint8ClampedArray(data.length);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;
                const medianColors = this.calculateMedianValues(originalData, x, y, width, height);

                newData[pixelIndex] = medianColors.r;
                newData[pixelIndex + 1] = medianColors.g;
                newData[pixelIndex + 2] = medianColors.b;
                newData[pixelIndex + 3] = originalData[pixelIndex + 3]; // giữ alpha
            }
        }

        // Cập nhạt dữ liệu ảnh
        for (let i = 0; i < data.length; i++) {
            data[i] = newData[i];
        }
    }

    /**
     * Tính giá trị trung vị của các pixel trong kernel bằng thuật toán Histogram
     * @param {Uint8ClampedArray} data - Dữ liệu pixel gốc
     * @param {number} centerX - Tọa độ X của pixel trung tâm
     * @param {number} centerY - Tọa độ Y của pixel trung tâm
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     * @returns {Object} - Giá trị trung bình {r, g, b}
     */
    calculateMedianValues(data, centerX, centerY, width, height) {
        // Tạo một histogram với 256 bins cho mỗi kênh
        const createHistogram = () => new Uint16Array(256).fill(0);
        let histR = createHistogram();
        let histG = createHistogram();
        let histB = createHistogram();

        const totalPixels = this.kernelSize * this.kernelSize;
        // Đối với số lượng phần tử lẻ, vị trí trung vị là (totalPixels/2 + 1)
        const medianIndex = Math.floor(totalPixels / 2) + 1;

        for (let dy = -this.radius; dy <= this.radius; dy++) {
            for (let dx = -this.radius; dx <= this.radius; dx++) {
                let newX = centerX + dx;
                let newY = centerY + dy;

                // Mirror padding để xử lý biên ảnh
                if (newX < 0) newX = -newX;
                if (newX >= width) newX = width - 1 - (newX - width + 1);
                if (newY < 0) newY = -newY;
                if (newY >= height) newY = height - 1 - (newY - height + 1);

                newX = Math.max(0, Math.min(width - 1, newX));
                newY = Math.max(0, Math.min(height - 1, newY));

                const index = (newY * width + newX) * 4;
                histR[data[index]]++;
                histG[data[index + 1]]++;
                histB[data[index + 2]]++;
            }
        }

        const findMedian = (hist) => {
            let sum = 0;
            for (let i = 0; i < 256; i++) {
                sum += hist[i];
                if (sum >= medianIndex) return i;
            }
            return 255;
        };

        return {
            r: findMedian(histR),
            g: findMedian(histG),
            b: findMedian(histB)
        };
    }
}