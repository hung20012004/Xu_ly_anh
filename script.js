/**
 * Main Script - Image Noise Filter Application
 * File: script.js
 */

// Global variables
let currentImageFile = null;
let meanFilterInstance = null;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('🚀 Initializing Image Noise Filter App...');
    
    // Initialize Mean Filter instance với kernel 5x5 để thấy rõ hiệu quả
    meanFilterInstance = new MeanFilter(5); // Thay đổi từ 3 thành 5
    
    // Bind event listeners
    bindEventListeners();
    
    console.log('✅ App initialized with 5x5 Mean Filter kernel!');
}

/**
 * Bind all event listeners
 */
function bindEventListeners() {
    // File input change event
    document.getElementById('inputImage').addEventListener('change', handleImageUpload);
    
    // Filter button click event
    document.getElementById('filterBtn').addEventListener('click', handleFilterApply);
    
    // Algorithm selection change
    document.getElementById('algorithmSelect').addEventListener('change', handleAlgorithmChange);
}

/**
 * Handle image upload
 * @param {Event} event - File input change event
 */
function handleImageUpload(event) {
    const file = event.target.files[0];
    const label = document.querySelector('.file-input-label');
    
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh hợp lệ!');
            return;
        }
        
        // Store current file
        currentImageFile = file;
        
        // Update UI
        const fileName = file.name.length > 20 
            ? file.name.substring(0, 20) + '...' 
            : file.name;
        
        label.innerHTML = `<i class="bi bi-check-circle"></i> ${fileName}`;
        label.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        
        // Load and display image
        loadImageToDisplay(file);
        
        console.log(`📁 File uploaded: ${file.name} (${formatFileSize(file.size)})`);
    }
}

/**
 * Load image file and display in original image container
 * @param {File} file - Image file to load
 */
function loadImageToDisplay(file) {
    const reader = new FileReader();
    
    reader.onload = function(evt) {
        const img = document.getElementById('originalImage');
        const placeholder = document.querySelector('#originalImageContainer .placeholder-text');
        
        // Tạo image object mới để tránh CORS
        const newImg = new Image();
        newImg.onload = function() {
            // Display original image
            img.src = evt.target.result;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            
            // Enable filter button
            document.getElementById('filterBtn').disabled = false;
            
            // Reset processed image
            resetProcessedImage();
            
            console.log('🖼️ Image loaded and displayed');
        };
        
        // Set crossOrigin để tránh taint canvas nếu có thể
        newImg.crossOrigin = 'anonymous';
        newImg.src = evt.target.result;
    };
    
    reader.onerror = function() {
        console.error('❌ Error loading image file');
        alert('Lỗi khi tải ảnh. Vui lòng thử lại!');
    };
    
    reader.readAsDataURL(file);
}

/**
 * Reset processed image display
 */
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

/**
 * Handle algorithm selection change
 * @param {Event} event - Select change event
 */
function handleAlgorithmChange(event) {
    const algorithm = event.target.value;
    console.log(`🔄 Algorithm changed to: ${algorithm}`);
    
    // Update filter button text based on selected algorithm
    const filterBtn = document.getElementById('filterBtn');
    const algorithmNames = {
        'mean': 'Lọc Trung Bình',
        'median': 'Lọc Trung Vị', 
        'gaussian': 'Lọc Gaussian'
    };
    
    if (!filterBtn.disabled) {
        filterBtn.innerHTML = `<i class="bi bi-magic"></i> Áp dụng ${algorithmNames[algorithm]}`;
    }
}

/**
 * Handle filter application
 */
async function handleFilterApply() {
    const originalImg = document.getElementById('originalImage');
    const algorithm = document.getElementById('algorithmSelect').value;
    
    if (!originalImg.src || !currentImageFile) {
        alert('Vui lòng chọn ảnh trước!');
        return;
    }
    
    console.log(`🎯 Applying ${algorithm} filter...`);
    
    // Show processing state
    showProcessingState(true);
    
    try {
        let filteredCanvas;
        
        // Apply selected filter
        switch (algorithm) {
            case 'mean':
                filteredCanvas = await applyMeanFilter(originalImg);
                break;
            case 'median':
                filteredCanvas = await applyMedianFilter(originalImg);
                break;
            case 'gaussian':
                filteredCanvas = await applyGaussianFilter(originalImg);
                break;
            default:
                throw new Error(`Unsupported algorithm: ${algorithm}`);
        }
        
        // Display processed image
        displayProcessedImage(filteredCanvas);
        
        console.log('✅ Filter applied successfully!');
        
    } catch (error) {
        console.error('❌ Error applying filter:', error);
        alert('Lỗi khi xử lý ảnh. Vui lòng thử lại!');
        
        // Show error state
        showErrorState();
        
    } finally {
        // Hide processing state
        showProcessingState(false);
    }
}

/**
 * Apply Mean Filter
 * @param {HTMLImageElement} imageElement - Original image element
 * @returns {Promise<HTMLCanvasElement>} - Processed canvas
 */
async function applyMeanFilter(imageElement) {
    if (!meanFilterInstance) {
        throw new Error('Mean Filter not initialized');
    }
    
    // Lấy kernel size từ UI
    const kernelSize = parseInt(document.getElementById('kernelSize').value);
    
    // Tạo instance mới với kernel size được chọn
    const filter = new MeanFilter(kernelSize);
    
    console.log(`🔧 Using ${kernelSize}x${kernelSize} kernel for Mean Filter`);
    
    return await filter.applyFilter(imageElement);
}

/**
 * Apply Median Filter (placeholder - implement later)
 * @param {HTMLImageElement} imageElement - Original image element
 * @returns {Promise<HTMLCanvasElement>} - Processed canvas
 */
async function applyMedianFilter(imageElement) {
    // TODO: Implement Median Filter
    console.log('🚧 Median Filter not implemented yet. Using Mean Filter as demo.');
    return await applyMeanFilter(imageElement);
}

/**
 * Apply Gaussian Filter (placeholder - implement later)
 * @param {HTMLImageElement} imageElement - Original image element
 * @returns {Promise<HTMLCanvasElement>} - Processed canvas
 */
async function applyGaussianFilter(imageElement) {
    // TODO: Implement Gaussian Filter
    console.log('🚧 Gaussian Filter not implemented yet. Using Mean Filter as demo.');
    return await applyMeanFilter(imageElement);
}

/**
 * Display processed image
 * @param {HTMLCanvasElement} canvas - Processed image canvas
 */
function displayProcessedImage(canvas) {
    const processedImg = document.getElementById('processedImage');
    const processedPlaceholder = document.querySelector('#processedImageContainer .placeholder-text');
    
    // Convert canvas to data URL
    const dataURL = canvas.toDataURL('image/png', 0.9);
    
    // Display processed image
    processedImg.src = dataURL;
    processedImg.style.display = 'block';
    processedPlaceholder.style.display = 'none';
    
    console.log('🖼️ Processed image displayed');
}

/**
 * Show/hide processing state
 * @param {boolean} isProcessing - Whether to show processing state
 */
function showProcessingState(isProcessing) {
    const processingIndicator = document.getElementById('processingIndicator');
    const filterBtn = document.getElementById('filterBtn');
    const algorithm = document.getElementById('algorithmSelect').value;
    
    if (isProcessing) {
        // Show processing state
        processingIndicator.style.display = 'block';
        filterBtn.disabled = true;
        filterBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Đang xử lý...';
        
    } else {
        // Hide processing state
        processingIndicator.style.display = 'none';
        filterBtn.disabled = false;
        
        const algorithmNames = {
            'mean': 'Lọc Trung Bình',
            'median': 'Lọc Trung Vị',
            'gaussian': 'Lọc Gaussian'
        };
        
        filterBtn.innerHTML = `<i class="bi bi-magic"></i> Áp dụng ${algorithmNames[algorithm]}`;
    }
}

/**
 * Show error state in processed image container
 */
function showErrorState() {
    const processedPlaceholder = document.querySelector('#processedImageContainer .placeholder-text');
    
    processedPlaceholder.innerHTML = `
        <i class="bi bi-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; display: block; color: #ef4444;"></i>
        <span style="color: #ef4444;">Lỗi xử lý ảnh</span>
    `;
    processedPlaceholder.style.display = 'block';
    
    document.getElementById('processedImage').style.display = 'none';
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Debug function - Test with sample image
 */
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