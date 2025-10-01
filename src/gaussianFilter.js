/**
 * Gaussian Filter Implementation
 * Thuật toán lọc Gaussian với phép nhân chập (convolution)
 * File: ./src/gaussianFilter.js
 */

class GaussianFilter {
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
        
        // Áp dụng Gaussian blur bằng CSS
        tempCtx.filter = `blur(${this.sigma}px)`;
        tempCtx.drawImage(imageElement, 0, 0);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        ctx.drawImage(tempCanvas, 0, 0);
        
        console.log('Đã áp dụng Simple Gaussian Filter (CSS blur) do CORS restriction');
        return canvas;
    }

    /**
     * Constructor
     * @param {number} sigma - Độ lệch chuẩn của Gaussian kernel
     * @param {number} kernelSize - Kích thước kernel (tự động tính nếu không cung cấp)
     */
    constructor(sigma = 1.0, kernelSize = null) {
        this.sigma = sigma;
        
        // Tự động tính kernel size nếu không được cung cấp
        // Thường sử dụng 6*sigma + 1 để đảm bảo kernel đủ lớn
        if (kernelSize === null) {
            this.kernelSize = Math.ceil(6 * sigma) | 1; // Đảm bảo là số lẻ
        } else {
            if (kernelSize % 2 === 0) {
                throw new Error('Kernel size phải là số lẻ!');
            }
            this.kernelSize = kernelSize;
        }
        
        this.radius = Math.floor(this.kernelSize / 2);
        
        // Tạo Gaussian kernel
        this.kernel = this.createGaussianKernel();
        
        console.log(`Gaussian Filter initialized: sigma=${sigma}, kernel_size=${this.kernelSize}`);
        console.log('Gaussian Kernel:', this.kernel);
    }

    /**
     * Tạo Gaussian kernel 
     * @returns {Float32Array} - Mảng chứa các giá trị của kernel
     */
    createGaussianKernel() {
        const kernel = new Float32Array(this.kernelSize);
        const sigma2 = 2 * this.sigma * this.sigma;
        let sum = 0;
        
        // Tính toán giá trị Gaussian cho từng vị trí trong kernel
        for (let i = 0; i < this.kernelSize; i++) {
            const x = i - this.radius;
            const value = Math.exp(-(x * x) / sigma2);
            kernel[i] = value;
            sum += value;
        }
        
        // Normalize kernel để tổng bằng 1
        for (let i = 0; i < this.kernelSize; i++) {
            kernel[i] /= sum;
        }
        
        return kernel;
    }

    /**
     * Áp dụng bộ lọc Gaussian  lên ảnh
     * Thực hiện convolution theo cả 2 hướng: ngang và dọc
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
                
                let imageData;
                try {
                    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                } catch (corsError) {
                    console.warn('CORS Error detected, using alternative method...');
                    resolve(this.applySimpleFilter(imageElement, canvas, ctx));
                    return;
                }
                
                console.log(`Đang áp dụng Gaussian Filter với sigma=${this.sigma}, kernel=${this.kernelSize}`);
                console.log(`Kích thước ảnh: ${canvas.width}x${canvas.height}`);
                
                // Bước 1: Convolution theo hướng ngang (horizontal)
                console.log('🔄 Bước 1: Convolution theo hướng ngang...');
                const horizontalData = this.applyHorizontalConvolution(imageData, canvas.width, canvas.height);
                
                // Bước 2: Convolution theo hướng dọc (vertical) 
                console.log('🔄 Bước 2: Convolution theo hướng dọc...');
                const finalData = this.applyVerticalConvolution(horizontalData, canvas.width, canvas.height);
                
                // Cập nhật imageData với kết quả cuối cùng
                for (let i = 0; i < imageData.data.length; i++) {
                    imageData.data[i] = finalData[i];
                }
                
                ctx.putImageData(imageData, 0, 0);
                
                console.log('✅ Hoàn thành Gaussian Filter!');
                resolve(canvas);
                
            } catch (error) {
                console.error('❌ Lỗi khi áp dụng Gaussian  Filter:', error);
                reject(error);
            }
        });
    }

    /**
     * Áp dụng convolution theo hướng ngang
     * @param {ImageData} imageData - Dữ liệu ảnh gốc
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     * @returns {Uint8ClampedArray} - Dữ liệu ảnh sau khi lọc ngang
     */
    applyHorizontalConvolution(imageData, width, height) {
        const data = imageData.data;
        const newData = new Uint8ClampedArray(data.length);
        
        console.log('Processing horizontal convolution...');
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;
                
                // Tính convolution cho từng kênh màu (R, G, B)
                const convResult = this.convolveHorizontal(data, x, y, width, height);
                
                newData[pixelIndex] = convResult.r;     // Red
                newData[pixelIndex + 1] = convResult.g; // Green  
                newData[pixelIndex + 2] = convResult.b; // Blue
                newData[pixelIndex + 3] = data[pixelIndex + 3]; // Alpha giữ nguyên
            }
            
            // Log progress
            if (y % Math.floor(height / 10) === 0) {
                console.log(`Horizontal progress: ${Math.round((y / height) * 100)}%`);
            }
        }
        
        return newData;
    }

    /**
     * Áp dụng convolution theo hướng dọc
     * @param {Uint8ClampedArray} inputData - Dữ liệu ảnh từ bước horizontal
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     * @returns {Uint8ClampedArray} - Dữ liệu ảnh sau khi lọc dọc
     */
    applyVerticalConvolution(inputData, width, height) {
        const newData = new Uint8ClampedArray(inputData.length);
        
        console.log('Processing vertical convolution...');
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;
                
                // Tính convolution cho từng kênh màu (R, G, B)
                const convResult = this.convolveVertical(inputData, x, y, width, height);
                
                newData[pixelIndex] = convResult.r;     // Red
                newData[pixelIndex + 1] = convResult.g; // Green  
                newData[pixelIndex + 2] = convResult.b; // Blue
                newData[pixelIndex + 3] = inputData[pixelIndex + 3]; // Alpha giữ nguyên
            }
            
            // Log progress
            if (y % Math.floor(height / 10) === 0) {
                console.log(`Vertical progress: ${Math.round((y / height) * 100)}%`);
            }
        }
        
        return newData;
    }

    /**
     * Thực hiện convolution theo hướng ngang cho một pixel
     * @param {Uint8ClampedArray} data - Dữ liệu pixel 
     * @param {number} centerX - Tọa độ X của pixel trung tâm
     * @param {number} centerY - Tọa độ Y của pixel trung tâm
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     * @returns {Object} - Kết quả convolution {r, g, b}
     */
    convolveHorizontal(data, centerX, centerY, width, height) {
        let sumR = 0, sumG = 0, sumB = 0;
        
        // Duyệt qua kernel theo hướng ngang
        for (let i = 0; i < this.kernelSize; i++) {
            const dx = i - this.radius;
            const newX = centerX + dx;
            
            // Xử lý biên bằng cách clamp (giữ trong bounds)
            const validX = Math.max(0, Math.min(width - 1, newX));
            const pixelIndex = (centerY * width + validX) * 4;
            
            const kernelValue = this.kernel[i];
            
            sumR += data[pixelIndex] * kernelValue;         // Red
            sumG += data[pixelIndex + 1] * kernelValue;     // Green
            sumB += data[pixelIndex + 2] * kernelValue;     // Blue
        }
        
        return {
            r: Math.round(Math.max(0, Math.min(255, sumR))),
            g: Math.round(Math.max(0, Math.min(255, sumG))),
            b: Math.round(Math.max(0, Math.min(255, sumB)))
        };
    }

    /**
     * Thực hiện convolution theo hướng dọc cho một pixel
     * @param {Uint8ClampedArray} data - Dữ liệu pixel 
     * @param {number} centerX - Tọa độ X của pixel trung tâm
     * @param {number} centerY - Tọa độ Y của pixel trung tâm
     * @param {number} width - Chiều rộng ảnh
     * @param {number} height - Chiều cao ảnh
     * @returns {Object} - Kết quả convolution {r, g, b}
     */
    convolveVertical(data, centerX, centerY, width, height) {
        let sumR = 0, sumG = 0, sumB = 0;
        
        // Duyệt qua kernel theo hướng dọc
        for (let i = 0; i < this.kernelSize; i++) {
            const dy = i - this.radius;
            const newY = centerY + dy;
            
            // Xử lý biên bằng cách clamp (giữ trong bounds)
            const validY = Math.max(0, Math.min(height - 1, newY));
            const pixelIndex = (validY * width + centerX) * 4;
            
            const kernelValue = this.kernel[i];
            
            sumR += data[pixelIndex] * kernelValue;         // Red
            sumG += data[pixelIndex + 1] * kernelValue;     // Green
            sumB += data[pixelIndex + 2] * kernelValue;     // Blue
        }
        
        return {
            r: Math.round(Math.max(0, Math.min(255, sumR))),
            g: Math.round(Math.max(0, Math.min(255, sumG))),
            b: Math.round(Math.max(0, Math.min(255, sumB)))
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
        
        // Tạo pattern với nhiều chi tiết
        for (let y = 0; y < height; y += 20) {
            for (let x = 0; x < width; x += 20) {
                const hue = (x + y) % 360;
                ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
                ctx.fillRect(x, y, 15, 15);
            }
        }
        
        // Thêm nhiễu high frequency
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 80;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        
        ctx.putImageData(imageData, 0, 0);
        console.log('Đã tạo ảnh test với nhiễu cho Gaussian !');
        
        return canvas;
    }
}

// Export để sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GaussianFilter;
}

// Hàm helper để test Gaussian  Filter
function testGaussianFilter() {
    console.log('🧪 Bắt đầu test Gaussian  Filter...');
    
    const filter = new GaussianFilter(2.0); // sigma = 2.0
    
    // Tạo ảnh test
    const noisyCanvas = filter.createNoisyTestImage(200, 200);
    
    // Tạo img element từ canvas
    const img = new Image();
    img.onload = async function() {
        console.log('✅ Ảnh test đã load');
        
        try {
            console.log('⏱️ Bắt đầu áp dụng Gaussian  Filter...');
            const startTime = performance.now();
            
            const filteredCanvas = await filter.applyFilter(img);
            
            const endTime = performance.now();
            console.log(`✅ Đã áp dụng Gaussian  Filter thành công! Thời gian: ${Math.round(endTime - startTime)}ms`);
            console.log('📊 Kích thước ảnh sau lọc:', filteredCanvas.width + 'x' + filteredCanvas.height);
            
            // Có thể thêm code để hiển thị kết quả
            // document.body.appendChild(noisyCanvas);    // Ảnh gốc
            // document.body.appendChild(filteredCanvas); // Ảnh đã lọc
            
        } catch (error) {
            console.error('❌ Lỗi khi test:', error);
        }
    };
    
    img.src = noisyCanvas.toDataURL();
}