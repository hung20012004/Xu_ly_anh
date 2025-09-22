/**
 * Mean Filter Implementation
 * Thuật toán lọc trung bình để giảm nhiễu ảnh
 * File: ./src/meanFilter.js
 */

class MeanFilter {
    /**
     * Phương pháp thay thế khi gặp CORS error
     * Áp dụng filter đơn giản bằng CSS filters
     * @param {HTMLImageElement} imageElement 
     * @param {HTMLCanvasElement} canvas 
     * @param {CanvasRenderingContext2D} ctx 
     * @returns {HTMLCanvasElement}
     */
    applySimpleFilter(imageElement, canvas, ctx) {
        // Tạo canvas tạm với filter CSS
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        // Áp dụng blur nhẹ để giảm nhiễu
        tempCtx.filter = 'blur(1px)';
        tempCtx.drawImage(imageElement, 0, 0);
        
        // Vẽ lại lên canvas chính
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        ctx.drawImage(tempCanvas, 0, 0);
        
        console.log('Đã áp dụng Simple Filter (CSS blur) do CORS restriction');
        return canvas;
    }

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
     * Áp dụng bộ lọc trung bình lên ảnh
     * @param {HTMLImageElement} imageElement - Element ảnh input
     * @returns {Promise<HTMLCanvasElement>} - Canvas chứa ảnh đã lọc
     */
    async applyFilter(imageElement) {
        return new Promise((resolve, reject) => {
            try {
                // Tạo canvas để xử lý ảnh
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set kích thước canvas bằng ảnh gốc
                canvas.width = imageElement.naturalWidth || imageElement.width;
                canvas.height = imageElement.naturalHeight || imageElement.height;
                
                // Vẽ ảnh gốc lên canvas
                ctx.drawImage(imageElement, 0, 0);
                
                // Lấy dữ liệu pixel với error handling
                let imageData, originalData;
                try {
                    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    originalData = new Uint8ClampedArray(imageData.data);
                } catch (corsError) {
                    console.warn('CORS Error detected, using alternative method...');
                    // Fallback: Sử dụng phương pháp khác
                    resolve(this.applySimpleFilter(imageElement, canvas, ctx));
                    return;
                }
                
                console.log(`Đang áp dụng Mean Filter với kernel ${this.kernelSize}x${this.kernelSize}`);
                console.log(`Kích thước ảnh: ${canvas.width}x${canvas.height}`);
                
                // Áp dụng bộ lọc trung bình
                this.processImageData(imageData, originalData, canvas.width, canvas.height);
                
                // Vẽ ảnh đã xử lý lên canvas
                ctx.putImageData(imageData, 0, 0);
                
                console.log('Hoàn thành lọc trung bình!');
                resolve(canvas);
                
            } catch (error) {
                console.error('Lỗi khi áp dụng Mean Filter:', error);
                reject(error);
            }
        });
    }

    /**
     * Xử lý dữ liệu pixel với thuật toán Mean Filter
     * @param {ImageData} imageData - Dữ liệu ảnh để sửa đổi
     * @param {Uint8ClampedArray} originalData - Dữ liệu ảnh gốc
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     */
    processImageData(imageData, originalData, width, height) {
        const data = imageData.data;
        const newData = new Uint8ClampedArray(data.length);
        
        console.log(`Processing ${width}x${height} image with ${this.kernelSize}x${this.kernelSize} kernel...`);
        
        // Duyệt qua từng pixel
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;
                
                // Tính giá trị trung bình cho mỗi kênh màu (R, G, B)
                const avgColors = this.calculateMeanValues(originalData, x, y, width, height);
                
                // Gán giá trị mới vào buffer tạm
                newData[pixelIndex] = avgColors.r;     // Red
                newData[pixelIndex + 1] = avgColors.g; // Green  
                newData[pixelIndex + 2] = avgColors.b; // Blue
                newData[pixelIndex + 3] = originalData[pixelIndex + 3]; // Alpha giữ nguyên
            }
            
            // Log progress mỗi 10% 
            if (y % Math.floor(height / 10) === 0) {
                console.log(`Progress: ${Math.round((y / height) * 100)}%`);
            }
        }
        
        // Copy dữ liệu đã xử lý vào imageData
        for (let i = 0; i < data.length; i++) {
            data[i] = newData[i];
        }
        
        console.log('Mean filter processing completed!');
    }

    /**
     * Tính giá trị trung bình của các pixel trong kernel
     * @param {Uint8ClampedArray} data - Dữ liệu pixel gốc
     * @param {number} centerX - Tọa độ X của pixel trung tâm
     * @param {number} centerY - Tọa độ Y của pixel trung tâm
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     * @returns {Object} - Giá trị trung bình {r, g, b}
     */
    calculateMeanValues(data, centerX, centerY, width, height) {
        let sumR = 0, sumG = 0, sumB = 0;
        let count = 0;
        
        // Duyệt qua kernel (ví dụ 3x3: từ -1 đến +1)
        for (let dy = -this.radius; dy <= this.radius; dy++) {
            for (let dx = -this.radius; dx <= this.radius; dx++) {
                const newX = centerX + dx;
                const newY = centerY + dy;
                
                // Kiểm tra biên ảnh - padding bằng cách reflect
                let validX = newX;
                let validY = newY;
                
                // Xử lý biên bằng mirror padding
                if (validX < 0) validX = Math.abs(validX);
                if (validX >= width) validX = width - 1 - (validX - width + 1);
                if (validY < 0) validY = Math.abs(validY);
                if (validY >= height) validY = height - 1 - (validY - height + 1);
                
                // Đảm bảo vẫn trong bounds
                validX = Math.max(0, Math.min(width - 1, validX));
                validY = Math.max(0, Math.min(height - 1, validY));
                
                const pixelIndex = (validY * width + validX) * 4;
                
                sumR += data[pixelIndex];     // Red
                sumG += data[pixelIndex + 1]; // Green
                sumB += data[pixelIndex + 2]; // Blue
                count++;
            }
        }
        
        // Trả về giá trị trung bình
        return {
            r: Math.round(sumR / count),
            g: Math.round(sumG / count),
            b: Math.round(sumB / count)
        };
    }

    /**
     * Chuyển đổi canvas thành base64 string
     * @param {HTMLCanvasElement} canvas 
     * @param {string} format - Định dạng ảnh ('image/png', 'image/jpeg')
     * @param {number} quality - Chất lượng ảnh (0.0 - 1.0)
     * @returns {string} - Base64 string
     */
    canvasToDataURL(canvas, format = 'image/png', quality = 0.9) {
        return canvas.toDataURL(format, quality);
    }

    /**
     * Test function - Tạo ảnh nhiễu để test
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     * @returns {HTMLCanvasElement} - Canvas chứa ảnh nhiễu
     */
    createNoisyTestImage(width = 300, height = 300) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        // Tạo ảnh nền gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.5, '#4ecdc4');
        gradient.addColorStop(1, '#45b7d1');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Thêm nhiễu ngẫu nhiên
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 100; // Nhiễu từ -50 đến +50
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        }
        
        ctx.putImageData(imageData, 0, 0);
        console.log('Đã tạo ảnh test với nhiễu!');
        
        return canvas;
    }
}

// Export để sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeanFilter;
}

// Hàm helper để test nhanh
function testMeanFilter() {
    console.log('🧪 Bắt đầu test Mean Filter...');
    
    const filter = new MeanFilter(3); // Kernel 3x3
    
    // Tạo ảnh test
    const noisyCanvas = filter.createNoisyTestImage(200, 200);
    
    // Tạo img element từ canvas
    const img = new Image();
    img.onload = async function() {
        console.log('✅ Ảnh test đã load');
        
        try {
            // Áp dụng bộ lọc
            const filteredCanvas = await filter.applyFilter(img);
            
            console.log('✅ Đã áp dụng Mean Filter thành công!');
            console.log('📊 Kích thước ảnh sau lọc:', filteredCanvas.width + 'x' + filteredCanvas.height);
            
            // Có thể thêm code để hiển thị kết quả ở đây
            // document.body.appendChild(noisyCanvas); // Ảnh gốc
            // document.body.appendChild(filteredCanvas); // Ảnh đã lọc
            
        } catch (error) {
            console.error('❌ Lỗi khi test:', error);
        }
    };
    
    img.src = noisyCanvas.toDataURL();
}

// Auto test khi chạy script
// testMeanFilter();