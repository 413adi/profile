// Initial hotspot positions - these would be configured based on your PDF layout
// Using percentages for responsive positioning
const hotspotPositions = {
    instructionBox: { x: 78, y: 4, width: 16, height: 4 },
    experience1: { x: 11.5, y: 43.5, width: 85, height: 2 },
    experience2: { x: 11.5, y: 39.1, width: 85, height: 2 },
    experience3: { x: 11.5, y: 55.8, width: 85, height: 2 },
    experience4: { x: 11.5, y: 59.1, width: 85, height: 2 },
    experience5: { x: 11.5, y: 61.2, width: 85, height: 2 },
    experience51: { x: 11.5, y: 63.3, width: 85, height: 2 },
    experience6: { x: 11.5, y: 69.4, width: 85, height: 2 },
    experience7: { x: 11.5, y: 73.6, width: 85, height: 2 },
    experience8: { x: 11.5, y: 21.7, width: 76, height: 1 },
    experience9: { x: 11.5, y: 22.8, width: 85, height: 2 },
    experience10: { x: 11.5, y: 27, width: 85, height: 4.5 }
};

// Add this to your script to disable internal scrolling
// In your positionHotspots function, adjust to handle scrolling
// Replace your current positionHotspots function with this one
// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Load the PDF
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
// Replace the fixed scale
// const scale = 2.0;

// With a dynamic scale calculation
function calculateScale() {
    const pdfContainer = document.getElementById('pdfContainer');
    const containerWidth = pdfContainer.clientWidth - 30; // Account for padding
    
    // Use a higher minimum scale for better clarity
    // This ensures text remains readable
    return Math.max(1.5, containerWidth / 600); // Adjusted from 800 to 600 for better quality
}

const scale = calculateScale();
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const pdfViewer = document.getElementById('pdfViewer');
pdfViewer.appendChild(canvas);

// Render a specific page of the PDF
function renderPage(num) {
    pageRendering = true;
    
    // Get the page
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        // Wait for rendering to finish
        renderTask.promise.then(function() {
            pageRendering = false;
            
            if (pageNumPending !== null) {
                // New page rendering is pending
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            
            // Position hotspots after page is rendered
            positionHotspots();
        });
        setTimeout(positionHotspots, 100);
    });
}

// Load and render the PDF
function loadPDF() {
    pdfjsLib.getDocument('Resume_AdityaKrishna.pdf').promise.then(function(pdf) {
        pdfDoc = pdf;
        
        // Initial page render
        renderPage(1);
        
        // Render all pages for scrolling
        renderAllPages(pdf);
    });
}

// Render all pages of the PDF for scrolling
function renderAllPages(pdf) {
    const pdfContainer = document.getElementById('pdfViewer');
    pdfContainer.innerHTML = ''; // Clear any existing content
    
    // Get total page count
    const numPages = pdf.numPages;
    
    // Create a container to hold all pages
    const pagesContainer = document.createElement('div');
    pagesContainer.className = 'pdf-pages-container';
    pdfContainer.appendChild(pagesContainer);
    
    // Function to render a specific page
    function renderPageToContainer(pageNum) {
        return pdf.getPage(pageNum).then(function(page) {
            const pdfContainer = document.getElementById('pdfContainer');
            const containerWidth = pdfContainer.clientWidth - 50;
            
            // Get original page dimensions
            const originalViewport = page.getViewport({ scale: 1.0 });
            const originalAspectRatio = originalViewport.width / originalViewport.height;
            
            // Calculate scale to fit container width
            const widthScale = containerWidth / originalViewport.width;
            
            // Use a minimum scale of 1.5 for clarity, but respect aspect ratio
            const scaleFactor = Math.max(1.5, widthScale);
            const displayViewport = page.getViewport({ scale: scaleFactor });
            
            // Create div for this page
            const pageDiv = document.createElement('div');
            pageDiv.className = 'pdf-page-div';
            pageDiv.setAttribute('data-page-number', pageNum);
            pageDiv.style.position = 'relative';
            
            // Create canvas for this page
            const pageCanvas = document.createElement('canvas');
            
            // Set dimensions maintaining aspect ratio
            const pixelRatio = window.devicePixelRatio || 1;
            pageCanvas.width = displayViewport.width * pixelRatio;
            pageCanvas.height = displayViewport.height * pixelRatio;
            pageCanvas.style.width = '100%'; // Make it responsive to container
            pageCanvas.style.height = 'auto'; // Maintain aspect ratio
            
            const context = pageCanvas.getContext('2d');
            context.scale(pixelRatio, pixelRatio);
            
            pageDiv.appendChild(pageCanvas);
            pagesContainer.appendChild(pageDiv);
            
            // Render with improved quality
            const renderContext = {
                canvasContext: context,
                viewport: displayViewport,
                renderInteractiveForms: true
            };
            
            return page.render(renderContext).promise.then(() => {
                return { 
                    pageNum, 
                    height: displayViewport.height, 
                    width: displayViewport.width 
                };
            });
        });
    }
    
    // Render all pages
    const renderPromises = [];
    for (let i = 1; i <= numPages; i++) {
        renderPromises.push(renderPageToContainer(i));
    }
    
    // After all pages are rendered, position hotspots
    Promise.all(renderPromises).then(pageInfos => {
        // Store page dimensions for hotspot positioning
        window.pdfPageInfo = pageInfos;
        
        // Position hotspots
        positionHotspots();
        
        // Set wrapper height to match all pages
        const totalHeight = pageInfos.reduce((acc, info) => acc + info.height, 0);
        document.getElementById('hotspotWrapper').style.height = totalHeight + 'px';
        setTimeout(positionHotspots, 100);
    });
}

// Call loadPDF when document is loaded
window.addEventListener('load', loadPDF);
function positionHotspots() {
    // Get the PDF viewer and its dimensions
    const pdfViewer = document.getElementById('pdfViewer');
    const pdfContainer = document.getElementById('pdfContainer');
    const wrapper = document.getElementById('hotspotWrapper');
    
    // Get the current dimensions of the PDF container
    const containerRect = pdfContainer.getBoundingClientRect();
    
    // Set wrapper to cover the PDF viewer
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.position = 'absolute';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.pointerEvents = 'none';
    
    // Position each hotspot based on the current PDF dimensions
    for (const [id, position] of Object.entries(hotspotPositions)) {
        const hotspot = document.getElementById(id);
        if (hotspot) {
            // Use viewport-relative positioning for consistency
            const pageHeight = pdfViewer.offsetHeight;
            const pageWidth = pdfViewer.offsetWidth;
            
            // Calculate the absolute position relative to the container
            const xPos = (position.x / 100) * pageWidth;
            const yPos = (position.y / 100) * pageHeight;
            const width = (position.width / 100) * pageWidth;
            const height = (position.height / 100) * pageHeight;
            
            // Set the hotspot's position
            hotspot.style.position = 'absolute';
            hotspot.style.left = `${xPos}px`;
            hotspot.style.top = `${yPos}px`;
            hotspot.style.width = `${width}px`;
            hotspot.style.height = `${height}px`;
            hotspot.style.pointerEvents = 'auto';
        }
    }

    if (instructionBox) {
        // Base positioning from hotspotPositions
        const position = hotspotPositions.instructionBox;
        const pageHeight = pdfViewer.offsetHeight;
        const pageWidth = pdfViewer.offsetWidth;
        
        // Calculate the absolute position relative to the container
        let xPos = (position.x / 100) * pageWidth;
        let yPos = (position.y / 100) * pageHeight;
        let width = (position.width / 100) * pageWidth;
        let height = (position.height / 100) * pageHeight;
        
        // Calculate font size based on PDF width
        let fontSize = Math.max(8, Math.min(16, pageWidth * 0.018)); // 1.8% of PDF width, min 8px, max 16px
        
        // Set the hotspot's position and font size
        instructionBox.style.position = 'absolute';
        instructionBox.style.left = `${xPos}px`;
        instructionBox.style.top = `${yPos}px`;
        instructionBox.style.width = `${width}px`;
        instructionBox.style.height = `${height}px`;
        instructionBox.style.fontSize = `${fontSize}px`;
        
        // Adjust padding based on font size
        let padding = Math.max(4, fontSize * 0.5);
        instructionBox.style.padding = `${padding}px ${padding * 1.5}px`;
    }
}
// Position hotspots on load and window resize
window.addEventListener('load', positionHotspots);
window.addEventListener('resize', positionHotspots);
// Add this right after your existing event listeners
window.addEventListener('scroll', function() {
    positionHotspots();
});

// Add this to your existing script
// Consolidate window load event listeners
window.addEventListener('load', function() {
    loadPDF();
    positionHotspots();
    enableScrolling();
    checkDeviceAndOrientation();
    
    // Set appropriate initial height for wrapper with delay
    setTimeout(function() {
        const wrapper = document.getElementById('hotspotWrapper');
        wrapper.style.height = "1500px";
        positionHotspots();
    }, 1000);
    
    // Check orientation after delays
    setTimeout(checkDeviceAndOrientation, 500);
    setTimeout(checkDeviceAndOrientation, 1000);
    setTimeout(checkDeviceAndOrientation, 2000);
    
});

// Consolidate resize event listener with debouncing
window.addEventListener('resize', debounce(function() {
    positionHotspots();
    checkDeviceAndOrientation();
}, 100));

// Consolidate orientation change listener
window.addEventListener('orientationchange', function() {
    setTimeout(checkDeviceAndOrientation, 200);
});

// Consolidate scroll event listener
window.addEventListener('scroll', debounce(function() {
    positionHotspots();
}, 100));
// Add this function to restore scrolling functionality
function enableScrolling() {
    document.querySelectorAll('.hotspot').forEach(hotspot => {
        hotspot.addEventListener('click', function(e) {
            // Prevent any default behavior that might interfere with scrolling
            e.stopPropagation();
            
            // Open the modal
            const modalId = `${this.id}Modal`;
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
            }
            
            // Ensure scrolling is still enabled
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        });
    });
}

// Call this function after the document loads
window.addEventListener('load', enableScrolling);
// Set up modal functionality
const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.close-modal');

document.querySelectorAll('.hotspot').forEach(hotspot => {
    if (hotspot.id !== 'linkedin' && hotspot.id !== 'email' && hotspot.id !== 'location') {
        hotspot.addEventListener('click', () => {
            const modalId = `${hotspot.id}Modal`;
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
            }
        });
    }
});

// Close modal when close button is clicked
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        button.closest('.modal').classList.remove('active');
        // Restore scrolling
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
    });
});


// Close modal when clicking outside of modal content
modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            // Restore scrolling
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        }
    });
});

// Close modal when Escape key is pressed
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// Handle form submission (just for demonstration)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! This is a demo form - in a real website, this would send an email.');
        contactForm.reset();
        document.getElementById('contactModal').classList.remove('active');
    });
}

// Edit mode functionality
let editMode = false;
const editModeKeyCode = 'KeyE'; // Press 'e' key + Ctrl to toggle edit mode

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === editModeKeyCode) {
        toggleEditMode();
    }
});

function toggleEditMode() {
    editMode = !editMode;
    const controlPanel = document.getElementById('controlPanel');
    
    if (editMode) {
        controlPanel.classList.add('active');
        document.querySelectorAll('.hotspot').forEach(hotspot => {
            hotspot.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
            hotspot.style.border = '2px dashed rgba(255, 0, 0, 0.8)';
        });
        loadHotspotEditor();
    } else {
        controlPanel.classList.remove('active');
        document.querySelectorAll('.hotspot').forEach(hotspot => {
            hotspot.style.backgroundColor = '';
            hotspot.style.border = '';
        });
    }
}

document.getElementById('saveHotspot').addEventListener('click', () => {
    
    if (hotspotPositions[hotspotId]) {
        hotspotPositions[hotspotId] = { x, y, width, height };
        positionHotspots();
        
        // In a real application, you might want to save this to localStorage or a database
        console.log('Updated hotspot positions:', hotspotPositions);
        
        alert(`Hotspot "${hotspotId}" updated successfully!`);
    }
});

document.getElementById('linkedin').addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation(); // Stop event bubbling
    window.open('https://www.linkedin.com/in/adi413/', '_blank');
});

document.getElementById('location').addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation(); // Stop event bubbling
    window.open('https://maps.app.goo.gl/dcgirv9nagqtmJ8t5', '_blank');
});

document.getElementById('email').addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation(); // Stop event bubbling
    window.open('mailto:aditya.krishna413@gmail.com', '_blank');
});


// Export hotspot positions (for saving configuration)
function exportHotspotPositions() {
    return JSON.stringify(hotspotPositions);
}

// Import hotspot positions (for loading saved configuration)
function importHotspotPositions(positionsJson) {
    try {
        const positions = JSON.parse(positionsJson);
        Object.assign(hotspotPositions, positions);
        positionHotspots();
        return true;
    } catch (e) {
        console.error('Failed to import hotspot positions:', e);
        return false;
    }
}

// Also check on resize and orientation change
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', function() {
    // Check multiple times after orientation change
    setTimeout(checkOrientation, 100);
    setTimeout(checkOrientation, 500);
    setTimeout(checkOrientation, 1000);
});

// Add this function to your JavaScript
function checkDeviceAndOrientation() {
    const container = document.getElementById('pdfContainer');
    const hotspotWrapper = document.getElementById('hotspotWrapper');
    const windowWidth = window.innerWidth;
    
    // Check if screen width is below threshold (850px as you suggested)
    if (windowWidth < 850) {
        // Hide hotspots
        hotspotWrapper.style.display = 'none';
        
        // Check if in portrait mode on mobile (width < height)
        if (window.innerWidth < window.innerHeight) {
            // Show landscape mode message if it doesn't exist yet
            if (!document.getElementById('landscapeMessage')) {
                createLandscapeMessage();
            }
        } else {
            // In landscape mode, remove message if it exists
            const message = document.getElementById('landscapeMessage');
            if (message) {
                message.remove();
            }
            
            // Consider showing hotspots in landscape mode if width is adequate
            if (windowWidth > 600) { // Minimum width for usable hotspots in landscape
                hotspotWrapper.style.display = 'block';
            }
        }
    } else {
        // For desktop/larger screens, show hotspots and remove message
        hotspotWrapper.style.display = 'block';
        const message = document.getElementById('landscapeMessage');
        if (message) {
            message.remove();
        }
    }
}

// Function to create the landscape mode message
function createLandscapeMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.id = 'landscapeMessage';
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '50%';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translate(-50%, -50%)';
    messageDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    messageDiv.style.color = 'white';
    messageDiv.style.padding = '20px';
    messageDiv.style.borderRadius = '10px';
    messageDiv.style.textAlign = 'center';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.maxWidth = '80%';
    messageDiv.style.boxShadow = '0 0 20px rgba(0, 123, 255, 0.5)';
    
    // Add pulsing animation
    messageDiv.style.animation = 'pulse 2s infinite';
    
    // Create a style element for the animations
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(0, 123, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); }
        }
        
        @keyframes rotatePhone {
            0% { transform: rotate(0deg); }
            20% { transform: rotate(90deg); }
            100% { transform: rotate(90deg); }
        }
        
        @keyframes glow {
            0% { background-color: rgba(0, 123, 255, 0.3); }
            50% { background-color: rgba(0, 123, 255, 0.7); }
            100% { background-color: rgba(0, 123, 255, 0.3); }
        }
        
        .phone-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 140px;
            margin-bottom: 20px;
        }
        
        .phone {
            position: relative;
            width: 70px;
            height: 120px;
            border: 3px solid white;
            border-radius: 12px;
            background-color: rgba(255, 255, 255, 0.1);
            animation: rotatePhone 3s ease-in-out infinite;
            transform-origin: center center;
        }
        
        .phone-screen {
            position: absolute;
            top: 5px;
            left: 5px;
            right: 5px;
            bottom: 5px;
            background-color: rgba(0, 123, 255, 0.3);
            border-radius: 6px;
            animation: glow 3s infinite;
            animation-delay: 1s;
        }
    `;
    document.head.appendChild(styleElement);
    
    // Add content with the phone animation
    messageDiv.innerHTML = `
        <div class="phone-container">
            <div class="phone">
                <div class="phone-screen"></div>
            </div>
        </div>
        <h3 style="margin-bottom: 15px; font-size: 18px;">Rotate your device to landscape mode</h3>
    `;
    
    document.body.appendChild(messageDiv);
}
// Call the function initially
window.addEventListener('load', checkDeviceAndOrientation);

// Call on resize and orientation change
window.addEventListener('resize', debounce(checkDeviceAndOrientation, 100));
window.addEventListener('orientationchange', function() {
    // Small delay to allow orientation change to complete
    setTimeout(checkDeviceAndOrientation, 200);
});

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Add event listener for the download button
document.addEventListener('DOMContentLoaded', function() {
    const downloadButton = document.getElementById('downloadPdfButton');
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            // Store the original background color
            const originalBgColor = this.style.backgroundColor;
            
            // Visual feedback
            this.textContent = "Downloading...";
            this.style.backgroundColor = "#004080";
            
            // Reset button after a delay
            setTimeout(() => {
                this.textContent = "Download Resume PDF";
                this.style.backgroundColor = originalBgColor || "#0056b3";
            }, 1500);
        });
    }
});

// Add event listener for the visit button
document.addEventListener('DOMContentLoaded', function() {
    const visitButton = document.getElementById('visitButton');
    if (visitButton) {
        visitButton.addEventListener('click', function() {
            // Store the original background color
            const originalBgColor = this.style.backgroundColor;
            
            // Visual feedback
            this.textContent = "Redirecting...";
            this.style.backgroundColor = "#1e7e34";
            
            // Reset isn't strictly necessary since we're navigating away,
            // but included for completeness in case the link opens in a new tab
            setTimeout(() => {
                this.textContent = "Visit My Portfolio";
                this.style.backgroundColor = originalBgColor || "#28a745";
            }, 1500);
        });
    }
});