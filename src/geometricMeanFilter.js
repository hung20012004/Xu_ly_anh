/**
 * Geometric Mean Filter Implementation
 * Bộ lọc trung bình hình học để giảm nhiễu ảnh
 * File: ./src/geometricMeanFilter.js
 */

class GeometricMeanFilter {
    /**
     * Constructor
     * @param {number} kernelSize - Kích thước kernel (3, 5, 7, 9...)
     */
    constructor(kernelSize = 3) {
        if (kernelSize % 2 === 0) {
            throw new Error('Kernel size phải là số lẻ!');
        }
        this.kernelSize = kernelSize;
        this.radius = Math.floor(kernelSize / 2);
    }

    /**
     * Áp dụng bộ lọc trung bình hình học lên ảnh
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
                
                console.log(`Đang áp dụng Geometric Mean Filter với kernel ${this.kernelSize}x${this.kernelSize}`);
                console.log(`Kích thước ảnh: ${canvas.width}x${canvas.height}`);
                
                this.processImageData(imageData, originalData, canvas.width, canvas.height);
                
                ctx.putImageData(imageData, 0, 0);
                
                console.log('Hoàn thành Geometric Mean Filter!');
                resolve(canvas);
                
            } catch (error) {
                console.error('Lỗi khi áp dụng Geometric Mean Filter:', error);
                reject(error);
            }
        });
    }

    /**
     * Xử lý dữ liệu pixel với thuật toán Geometric Mean Filter
     * @param {ImageData} imageData - Dữ liệu ảnh để sửa đổi
     * @param {Uint8ClampedArray} originalData - Dữ liệu ảnh gốc
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     */
    processImageData(imageData, originalData, width, height) {
        const data = imageData.data;
        const newData = new Uint8ClampedArray(data.length);
        
        console.log(`Processing ${width}x${height} image with ${this.kernelSize}x${this.kernelSize} kernel...`);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;
                
                const geoMeanColors = this.calculateGeometricMean(originalData, x, y, width, height);
                
                newData[pixelIndex] = geoMeanColors.r;
                newData[pixelIndex + 1] = geoMeanColors.g;
                newData[pixelIndex + 2] = geoMeanColors.b;
                newData[pixelIndex + 3] = originalData[pixelIndex + 3];
            }
            
            if (y % Math.floor(height / 10) === 0) {
                console.log(`Progress: ${Math.round((y / height) * 100)}%`);
            }
        }
        
        for (let i = 0; i < data.length; i++) {
            data[i] = newData[i];
        }
        
        console.log('Geometric Mean filter processing completed!');
    }

    /**
     * Tính giá trị trung bình hình học của các pixel trong kernel
     * Công thức: G = (a1 * a2 * ... * an)^(1/n)
     * Sử dụng log để tránh overflow: G = exp(mean(log(values)))
     * 
     * @param {Uint8ClampedArray} data - Dữ liệu pixel gốc
     * @param {number} centerX - Tọa độ X của pixel trung tâm
     * @param {number} centerY - Tọa độ Y của pixel trung tâm
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     * @returns {Object} - Giá trị trung bình hình học {r, g, b}
     */
    calculateGeometricMean(data, centerX, centerY, width, height) {
        let sumLogR = 0, sumLogG = 0, sumLogB = 0;
        let count = 0;
        const epsilon = 1e-10; // Tránh log(0)
        
        for (let dy = -this.radius; dy <= this.radius; dy++) {
            for (let dx = -this.radius; dx <= this.radius; dx++) {
                const newX = centerX + dx;
                const newY = centerY + dy;
                
                let validX = newX;
                let validY = newY;
                
                if (validX < 0) validX = Math.abs(validX);
                if (validX >= width) validX = width - 1 - (validX - width + 1);
                if (validY < 0) validY = Math.abs(validY);
                if (validY >= height) validY = height - 1 - (validY - height + 1);
                
                validX = Math.max(0, Math.min(width - 1, validX));
                validY = Math.max(0, Math.min(height - 1, validY));
                
                const pixelIndex = (validY * width + validX) * 4;
                
                // Tính log của từng giá trị (thêm epsilon để tránh log(0))
                sumLogR += Math.log(data[pixelIndex] + epsilon);
                sumLogG += Math.log(data[pixelIndex + 1] + epsilon);
                sumLogB += Math.log(data[pixelIndex + 2] + epsilon);
                count++;
            }
        }
        
        // Geometric mean = exp(mean(log(values)))
        return {
            r: Math.round(Math.exp(sumLogR / count)),
            g: Math.round(Math.exp(sumLogG / count)),
            b: Math.round(Math.exp(sumLogB / count))
        };
    }

    /**
     * Phương pháp thay thế khi gặp CORS error
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
        
        console.log('Đã áp dụng Simple Filter do CORS restriction');
        return canvas;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeometricMeanFilter;
}