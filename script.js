
let currentImageFile = null;
let meanFilterInstance = null;
let medianFilterInstance = null;
let geometricMeanFilterInstance = null;
let harmonicMeanFilterInstance = null;
let contraharmonicMeanFilterInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Initializing Image Noise Filter App...');

    meanFilterInstance = new MeanFilter(5); 
    medianFilterInstance = new MedianFilter(5)
    gaussianFilterInstance = new GaussianFilter(2.0);
    geometricMeanFilterInstance = new GeometricMeanFilter(5);
    harmonicMeanFilterInstance = new HarmonicMeanFilter(5);
    contraharmonicMeanFilterInstance = new ContraharmonicMeanFilter(5, 1.5);

    bindEventListeners();
    
    console.log('✅ App initialized with all filters!');
}

function bindEventListeners() {
    document.getElementById('inputImage').addEventListener('change', handleImageUpload);
    document.getElementById('filterBtn').addEventListener('click', handleFilterApply);
    document.getElementById('algorithmSelect').addEventListener('change', handleAlgorithmChange);
    
    document.getElementById('sigmaRange').addEventListener('input', (e) => {
        document.getElementById('sigmaValue').textContent = e.target.value;
    });
}
function handleImageUpload(event) {
    const file = event.target.files[0];
    const label = document.querySelector('.file-input-label');
    
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh hợp lệ!');
            return;
        }
        
        currentImageFile = file;
        
        const fileName = file.name.length > 20 
            ? file.name.substring(0, 20) + '...' 
            : file.name;
        
        label.innerHTML = `<i class="bi bi-check-circle"></i> ${fileName}`;
        label.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        
        loadImageToDisplay(file);
        
        console.log(`📁 File uploaded: ${file.name} (${formatFileSize(file.size)})`);
    }
}

function loadImageToDisplay(file) {
    const reader = new FileReader();
    
    reader.onload = function(evt) {
        const img = document.getElementById('originalImage');
        const placeholder = document.querySelector('#originalImageContainer .placeholder-text');
        
        const newImg = new Image();
        newImg.onload = function() {
            img.src = evt.target.result;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            
            document.getElementById('filterBtn').disabled = false;
            
            resetProcessedImage();
            
            console.log('🖼️ Image loaded and displayed');
        };
        
        newImg.crossOrigin = 'anonymous';
        newImg.src = evt.target.result;
    };
    
    reader.onerror = function() {
        console.error('❌ Error loading image file');
        alert('Lỗi khi tải ảnh. Vui lòng thử lại!');
    };
    
    reader.readAsDataURL(file);
}

function resetProcessedImage() {
    const processedImg = document.getElementById('processedImage');
    const processedPlaceholder = document.querySelector('#processedImageContainer .placeholder-text');
    
    processedImg.style.display = 'none';
    processedPlaceholder.style.display = 'block';
    processedPlaceholder.innerHTML = `
        <i class="bi bi-hourglass-split" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
        Chờ xử lý ảnh
    `;
}

function handleAlgorithmChange(event) {
    const algorithm = event.target.value;
    const kernelSizeControl = document.getElementById('kernelSizeControl');
    const sigmaControl = document.getElementById('sigmaControl');
    
    console.log(`Algorithm changed to: ${algorithm}`);
    
    // Hiển thị control phù hợp
    if (algorithm === 'gaussian') {
        kernelSizeControl.style.display = 'none';
        sigmaControl.style.display = 'flex';
    } else {
        kernelSizeControl.style.display = 'flex';
        sigmaControl.style.display = 'none';
    }
    

    const qContainer = document.getElementById('qParameterContainer');
    if (algorithm === 'contraharmonic') {
        qContainer.style.display = 'flex';
    } else {
        qContainer.style.display = 'none';
    }
    
    const filterBtn = document.getElementById('filterBtn');
    const algorithmNames = {
        'mean': 'Lọc Trung Bình',
        'median': 'Lọc Trung Vị', 
        'gaussian': 'Lọc  Gaussian',
        'geometric': 'Lọc TB Hình Học',
        'harmonic': 'Lọc TB Điều Hòa',
        'contraharmonic': 'Lọc TB Phản Điều Hòa'
    };
    
    if (!filterBtn.disabled) {
        filterBtn.innerHTML = `<i class="bi bi-magic"></i> Áp dụng ${algorithmNames[algorithm]}`;
    }
}

async function handleFilterApply() {
    const originalImg = document.getElementById('originalImage');
    const algorithm = document.getElementById('algorithmSelect').value;
    
    if (!originalImg.src || !currentImageFile) {
        alert('Vui lòng chọn ảnh trước!');
        return;
    }
    
    console.log(`🎯 Applying ${algorithm} filter...`);
    
    showProcessingState(true);
    
    try {
        let filteredCanvas;
        
        switch (algorithm) {
            case 'mean':
                filteredCanvas = await applyMeanFilter(originalImg);
                break;
            case 'median':
                filteredCanvas = await applyMedianFilter(originalImg);
                break;
            case 'min':
                filteredCanvas = await applyMinFilter(originalImg);
                break;
            case 'max':
                filteredCanvas = await applyMaxFilter(originalImg);
                break;
            case 'midpoint':
                filteredCanvas = await applyMidPointFilter(originalImg);
                break;
            case 'gaussian':
                filteredCanvas = await applyGaussianFilter(originalImg);
                break;
            case 'geometric':
                filteredCanvas = await applyGeometricMeanFilter(originalImg);
                break;
            case 'harmonic':
                filteredCanvas = await applyHarmonicMeanFilter(originalImg);
                break;
            case 'contraharmonic':
                filteredCanvas = await applyContraharmonicMeanFilter(originalImg);
                break;
            default:
                throw new Error(`Unsupported algorithm: ${algorithm}`);
        }
        
        displayProcessedImage(filteredCanvas);
        
        console.log('✅ Filter applied successfully!');
        
    } catch (error) {
        console.error('❌ Error applying filter:', error);
        alert('Lỗi khi xử lý ảnh. Vui lòng thử lại!');
        showErrorState();
        
    } finally {
        showProcessingState(false);
    }
}

async function applyMeanFilter(imageElement) {
    const kernelSize = parseInt(document.getElementById('kernelSize').value);
    const filter = new MeanFilter(kernelSize);
    console.log(`🔧 Using ${kernelSize}x${kernelSize} kernel for Mean Filter`);
    return await filter.applyFilter(imageElement);
}

async function applyMedianFilter(imageElement) {
    const kernelSize = parseInt(document.getElementById('kernelSize').value);
    const filter = new MedianFilter(kernelSize);
    console.log(`🔧 Using ${kernelSize}x${kernelSize} kernel for Median Filter`);
    return await filter.applyFilter(imageElement);
}

async function applyMinFilter(imageElement) {
    const kernelSize = parseInt(document.getElementById('kernelSize').value);
    const filter = new MinFilter(kernelSize);
    console.log(`🔧 Using ${kernelSize}x${kernelSize} kernel for Min Filter`);
    return await filter.applyFilter(imageElement);
}

async function applyMaxFilter(imageElement) {
    const kernelSize = parseInt(document.getElementById('kernelSize').value);
    const filter = new MaxFilter(kernelSize);
    console.log(`🔧 Using ${kernelSize}x${kernelSize} kernel for Max Filter`);
    return await filter.applyFilter(imageElement);
}

async function applyMidPointFilter(imageElement) {
    const kernelSize = parseInt(document.getElementById('kernelSize').value);
    const filter = new MidpointFilter(kernelSize);
    console.log(`🔧 Using ${kernelSize}x${kernelSize} kernel for Midpoint Filter`);
    return await filter.applyFilter(imageElement);
}

async function applyGaussianFilter(imageElement) {
    if (!gaussianFilterInstance) {
        throw new Error('Gaussian Filter not initialized');
    }

    // Lấy sigma từ UI
    const sigma = parseFloat(document.getElementById('sigmaRange').value);
    const filter = new GaussianFilter(sigma);

    console.log(`Using sigma=${sigma} for Gaussian Filter (auto kernel size: ${filter.kernelSize}x${filter.kernelSize})`);
    return await filter.applyFilter(imageElement);
    console.log('🚧 Gaussian Filter not implemented yet. Using Mean Filter as demo.');
    return await applyMeanFilter(imageElement);

}

async function applyGeometricMeanFilter(imageElement) {
    const kernelSize = parseInt(document.getElementById('kernelSize').value);
    const filter = new GeometricMeanFilter(kernelSize);
    console.log(`🔧 Using ${kernelSize}x${kernelSize} kernel for Geometric Mean Filter`);
    return await filter.applyFilter(imageElement);
}

async function applyHarmonicMeanFilter(imageElement) {
    const kernelSize = parseInt(document.getElementById('kernelSize').value);
    const filter = new HarmonicMeanFilter(kernelSize);
    console.log(`🔧 Using ${kernelSize}x${kernelSize} kernel for Harmonic Mean Filter`);
    return await filter.applyFilter(imageElement);
}

async function applyContraharmonicMeanFilter(imageElement) {
    const kernelSize = parseInt(document.getElementById('kernelSize').value);
    const Q = parseFloat(document.getElementById('qParameter').value);
    const filter = new ContraharmonicMeanFilter(kernelSize, Q);
    console.log(`🔧 Using ${kernelSize}x${kernelSize} kernel for Contraharmonic Mean Filter with Q=${Q}`);
    return await filter.applyFilter(imageElement);
}


function displayProcessedImage(canvas) {
    const processedImg = document.getElementById('processedImage');
    const processedPlaceholder = document.querySelector('#processedImageContainer .placeholder-text');
    
    const dataURL = canvas.toDataURL('image/png', 0.9);
    
    processedImg.src = dataURL;
    processedImg.style.display = 'block';
    processedPlaceholder.style.display = 'none';
    
    console.log('🖼️ Processed image displayed');
}

function showProcessingState(isProcessing) {
    const processingIndicator = document.getElementById('processingIndicator');
    const filterBtn = document.getElementById('filterBtn');
    const algorithm = document.getElementById('algorithmSelect').value;
    
    if (isProcessing) {
        processingIndicator.style.display = 'block';
        filterBtn.disabled = true;
        filterBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Đang xử lý...';
        
    } else {
        processingIndicator.style.display = 'none';
        filterBtn.disabled = false;
        
        const algorithmNames = {
            'mean': 'Lọc Trung Bình',
            'median': 'Lọc Trung Vị',
            'gaussian': 'Lọc Gaussian',
            'geometric': 'Lọc Hình Học',
            'harmonic': 'Lọc Điều Hòa',
            'contraharmonic': 'Lọc Phản Điều Hòa'
        };
        
        filterBtn.innerHTML = `<i class="bi bi-magic"></i> Áp dụng ${algorithmNames[algorithm]}`;
    }
}

function showErrorState() {
    const processedPlaceholder = document.querySelector('#processedImageContainer .placeholder-text');
    
    processedPlaceholder.innerHTML = `
        <i class="bi bi-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; display: block; color: #ef4444;"></i>
        <span style="color: #ef4444;">Lỗi xử lý ảnh</span>
    `;
    processedPlaceholder.style.display = 'block';
    
    document.getElementById('processedImage').style.display = 'none';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function debugTestWithSampleImage() {
    console.log('🧪 Creating test image...');
    
    if (meanFilterInstance) {
        const testCanvas = meanFilterInstance.createNoisyTestImage(300, 300);
        const testImg = new Image();
        
        testImg.onload = function() {
            const originalImg = document.getElementById('originalImage');
            const placeholder = document.querySelector('#originalImageContainer .placeholder-text');
            
            originalImg.src = testImg.src;
            originalImg.style.display = 'block';
            placeholder.style.display = 'none';
            
            document.getElementById('filterBtn').disabled = false;
            
            console.log('🖼️ Test image loaded');
        };
        
        testImg.src = testCanvas.toDataURL();
    }
}

// Expose debug function to global scope
window.debugTestWithSampleImage = debugTestWithSampleImage;