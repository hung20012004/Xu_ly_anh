/**
 * Contraharmonic Mean Filter Implementation
 * Bộ lọc trung bình phản điều hòa để giảm nhiễu muối tiêu
 * File: ./src/contraharmonicMeanFilter.js
 */

class ContraharmonicMeanFilter {
    /**
     * Constructor
     * @param {number} kernelSize - Kích thước kernel (3, 5, 7, 9...)
     * @param {number} Q - Bậc của bộ lọc (Q > 0: loại nhiễu tiêu, Q < 0: loại nhiễu muối)
     */
    constructor(kernelSize = 3, Q = 1.0) {
        if (kernelSize % 2 === 0) {
            throw new Error('Kernel size phải là số lẻ!');
        }
        this.kernelSize = kernelSize;
        this.radius = Math.floor(kernelSize / 2);
        this.Q = Q;
    }

    /**
     * Áp dụng bộ lọc trung bình phản điều hòa lên ảnh
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
                
                console.log(`Đang áp dụng Contraharmonic Mean Filter với kernel ${this.kernelSize}x${this.kernelSize}, Q=${this.Q}`);
                console.log(`Kích thước ảnh: ${canvas.width}x${canvas.height}`);
                
                this.processImageData(imageData, originalData, canvas.width, canvas.height);
                
                ctx.putImageData(imageData, 0, 0);
                
                console.log('Hoàn thành Contraharmonic Mean Filter!');
                resolve(canvas);
                
            } catch (error) {
                console.error('Lỗi khi áp dụng Contraharmonic Mean Filter:', error);
                reject(error);
            }
        });
    }

    /**
     * Xử lý dữ liệu pixel với thuật toán Contraharmonic Mean Filter
     * @param {ImageData} imageData - Dữ liệu ảnh để sửa đổi
     * @param {Uint8ClampedArray} originalData - Dữ liệu ảnh gốc
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     */
    processImageData(imageData, originalData, width, height) {
        const data = imageData.data;
        const newData = new Uint8ClampedArray(data.length);
        
        console.log(`Processing ${width}x${height} image with ${this.kernelSize}x${this.kernelSize} kernel, Q=${this.Q}...`);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;
                
                const contraharmonicMeanColors = this.calculateContraharmonicMean(originalData, x, y, width, height);
                
                newData[pixelIndex] = contraharmonicMeanColors.r;
                newData[pixelIndex + 1] = contraharmonicMeanColors.g;
                newData[pixelIndex + 2] = contraharmonicMeanColors.b;
                newData[pixelIndex + 3] = originalData[pixelIndex + 3];
            }
            
            if (y % Math.floor(height / 10) === 0) {
                console.log(`Progress: ${Math.round((y / height) * 100)}%`);
            }
        }
        
        for (let i = 0; i < data.length; i++) {
            data[i] = newData[i];
        }
        
        console.log('Contraharmonic Mean filter processing completed!');
    }

    /**
     * Tính giá trị trung bình phản điều hòa của các pixel trong kernel
     * Công thức: C_Q = (x1^(Q+1) + x2^(Q+1) + ... + xn^(Q+1)) / (x1^Q + x2^Q + ... + xn^Q)
     * 
     * @param {Uint8ClampedArray} data - Dữ liệu pixel gốc
     * @param {number} centerX - Tọa độ X của pixel trung tâm
     * @param {number} centerY - Tọa độ Y của pixel trung tâm
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     * @returns {Object} - Giá trị trung bình phản điều hòa {r, g, b}
     */
    calculateContraharmonicMean(data, centerX, centerY, width, height) {
        let sumPowerQPlus1_R = 0, sumPowerQPlus1_G = 0, sumPowerQPlus1_B = 0;
        let sumPowerQ_R = 0, sumPowerQ_G = 0, sumPowerQ_B = 0;
        const epsilon = 1e-10; // Tránh chia cho 0
        
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
                
                const r = data[pixelIndex] + epsilon;
                const g = data[pixelIndex + 1] + epsilon;
                const b = data[pixelIndex + 2] + epsilon;
                
                // Tính x^(Q+1) và x^Q
                sumPowerQPlus1_R += Math.pow(r, this.Q + 1);
                sumPowerQPlus1_G += Math.pow(g, this.Q + 1);
                sumPowerQPlus1_B += Math.pow(b, this.Q + 1);
                
                sumPowerQ_R += Math.pow(r, this.Q);
                sumPowerQ_G += Math.pow(g, this.Q);
                sumPowerQ_B += Math.pow(b, this.Q);
            }
        }
        
        // Contraharmonic mean = sum(x^(Q+1)) / sum(x^Q)
        // Thêm epsilon vào mẫu số để tránh chia cho 0
        return {
            r: Math.max(0, Math.min(255, Math.round(sumPowerQPlus1_R / (sumPowerQ_R + epsilon)))),
            g: Math.max(0, Math.min(255, Math.round(sumPowerQPlus1_G / (sumPowerQ_G + epsilon)))),
            b: Math.max(0, Math.min(255, Math.round(sumPowerQPlus1_B / (sumPowerQ_B + epsilon))))
        };
    }

    /**
     * Thay đổi giá trị Q
     * @param {number} newQ - Giá trị Q mới
     */
    setQ(newQ) {
        this.Q = newQ;
        console.log(`Q đã được thay đổi thành: ${this.Q}`);
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
    module.exports = ContraharmonicMeanFilter;
}