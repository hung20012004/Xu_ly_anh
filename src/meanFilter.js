
class MeanFilter {
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
                    console.warn('CORS Error detected, using alternative method...');
                
                    resolve(this.applySimpleFilter(imageElement, canvas, ctx));
                    return;
                }
                
                console.log(`Đang áp dụng Mean Filter với kernel ${this.kernelSize}x${this.kernelSize}`);
                console.log(`Kích thước ảnh: ${canvas.width}x${canvas.height}`);
                
                this.processImageData(imageData, originalData, canvas.width, canvas.height);
                
                ctx.putImageData(imageData, 0, 0);
                
                console.log('Hoàn thành lọc trung bình!');
                resolve(canvas);
                
            } catch (error) {
                console.error('Lỗi khi áp dụng Mean Filter:', error);
                reject(error);
            }
        });
    }

    processImageData(imageData, originalData, width, height) {
        const data = imageData.data;
        const newData = new Uint8ClampedArray(data.length);
        
        console.log(`Processing ${width}x${height} image with ${this.kernelSize}x${this.kernelSize} kernel...`);
        

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;
                
                
                const avgColors = this.calculateMeanValues(originalData, x, y, width, height);
                
                newData[pixelIndex] = avgColors.r;     
                newData[pixelIndex + 1] = avgColors.g;  
                newData[pixelIndex + 2] = avgColors.b; 
                newData[pixelIndex + 3] = originalData[pixelIndex + 3]; // Alpha giữ nguyên
            }
            
            
            if (y % Math.floor(height / 10) === 0) {
                console.log(`Progress: ${Math.round((y / height) * 100)}%`);
            }
        }
        
        
        for (let i = 0; i < data.length; i++) {
            data[i] = newData[i];
        }
        
        console.log('Mean filter processing completed!');
    }

    calculateMeanValues(data, centerX, centerY, width, height) {
        let sumR = 0, sumG = 0, sumB = 0;
        let count = 0;
        
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
                
                sumR += data[pixelIndex];     
                sumG += data[pixelIndex + 1]; 
                sumB += data[pixelIndex + 2]; 
                count++;
            }
        }
        
        return {
            r: Math.round(sumR / count),
            g: Math.round(sumG / count),
            b: Math.round(sumB / count)
        };
    }


    canvasToDataURL(canvas, format = 'image/png', quality = 0.9) {
        return canvas.toDataURL(format, quality);
    }


    createNoisyTestImage(width = 300, height = 300) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.5, '#4ecdc4');
        gradient.addColorStop(1, '#45b7d1');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        
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


if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeanFilter;
}


function testMeanFilter() {
    console.log('🧪 Bắt đầu test Mean Filter...');
    
    const filter = new MeanFilter(3); 
    
    
    const noisyCanvas = filter.createNoisyTestImage(200, 200);
    
  
    const img = new Image();
    img.onload = async function() {
        console.log('✅ Ảnh test đã load');
        
        try {
           
            const filteredCanvas = await filter.applyFilter(img);
            
            console.log('✅ Đã áp dụng Mean Filter thành công!');
            console.log('📊 Kích thước ảnh sau lọc:', filteredCanvas.width + 'x' + filteredCanvas.height);
            
            
        } catch (error) {
            console.error('❌ Lỗi khi test:', error);
        }
    };
    
    img.src = noisyCanvas.toDataURL();
}

