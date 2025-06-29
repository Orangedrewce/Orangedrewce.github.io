// --- INITIALIZE APP ---
(function() {
    //
    // --- START: PASTE THIS ENTIRE SCROLL LOCK OBJECT HERE ---
    //
    const ScrollLock = {
        scrollPosition: 0,
        preventScroll(e) {
            e.preventDefault();
        },
        disable() {
            // Store the current scroll position
            this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            const body = document.body;
            body.style.overflow = 'hidden';
            body.style.position = 'fixed';
            body.style.top = `-${this.scrollPosition}px`;
            body.style.width = '100%';
            // Actively block wheel/touch events on the overlay itself
            document.querySelectorAll('.modal-overlay.active').forEach(overlay => {
                overlay.addEventListener('wheel', this.preventScroll, { passive: false });
                overlay.addEventListener('touchmove', this.preventScroll, { passive: false });
            });
        },
        enable() {
            const body = document.body;
            body.style.removeProperty('overflow');
            body.style.removeProperty('position');
            body.style.removeProperty('top');
            body.style.removeProperty('width');
            // Restore the scroll position
            window.scrollTo(0, this.scrollPosition);
            // Clean up event listeners
            document.querySelectorAll('.modal-overlay').forEach(overlay => {
                overlay.removeEventListener('wheel', this.preventScroll);
                overlay.removeEventListener('touchmove', this.preventScroll);
            });
        }
    };
    //
    // --- END: SCROLL LOCK OBJECT ---
    
    // --- TOAST NOTIFICATIONS ---
    function showToast(message, duration = 3000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

function initializeAnimatedTitle() {
    const title = document.getElementById('appTitle');
    if (!title) return;
    
    const text = title.textContent;
    title.innerHTML = '';
    
    [...text].forEach((char, i) => {
        const span = document.createElement('span');
        span.className = char === ' ' ? 'letter space' : 'letter';
        span.textContent = char;
        span.style.setProperty('--i', i);
        title.appendChild(span);
    });
}

// --- MODAL MANAGEMENT ---
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}
    
    // --- PEER-TO-PEER SYNC MODULE ---
    class PeerSync {
        constructor(app) {
            this.app = app;
            this.peer = null;
            this.connection = null;
            this.peerId = null;
            this.qrCode = null;
            this.receivedData = null;
            this.videoStream = null;
            
            // UI elements
            this.sendContent = document.getElementById('sendContent');
            this.receiveContent = document.getElementById('receiveContent');
            this.sendStatus = document.getElementById('sendStatus');
            this.receiveStatus = document.getElementById('receiveStatus');
            this.peerIdDisplay = document.getElementById('peerIdDisplay');
            this.sendProgress = document.getElementById('sendProgress');
            this.receiveProgress = document.getElementById('receiveProgress');
            this.receiverCode = document.getElementById('receiverCode');
            this.sendQrContainer = document.getElementById('sendQrContainer');
            this.cameraContainer = document.getElementById('cameraContainer');
            this.videoElement = document.getElementById('qrScanner');
            this.scanBtn = document.getElementById('scanQRBtn');
            this.cancelScanBtn = document.getElementById('cancelScanBtn');
            
            // Initialize event listeners
            this.initEvents();
        }
        
        initEvents() {
            // Tab switching for Send/Receive within the Sync tab
            document.querySelectorAll('.sync-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.sync-tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.sync-content').forEach(c => c.classList.remove('active'));
                    
                    tab.classList.add('active');
                    const tabId = tab.getAttribute('data-tab');
                    document.getElementById(`${tabId}Content`).classList.add('active');
                    
                    this.resetSyncState();
                });
            });
            
            // Sync buttons
            document.getElementById('copyPeerIdBtn').addEventListener('click', () => this.copyPeerId());
            document.getElementById('generateCodeBtn').addEventListener('click', () => this.startPeer());
            document.getElementById('cancelSyncBtn').addEventListener('click', () => this.resetSyncState());
            document.getElementById('connectToPeerBtn').addEventListener('click', () => this.connectToPeer());
            
            // Camera scanning
            this.scanBtn.addEventListener('click', () => this.startCameraScan());
            this.cancelScanBtn.addEventListener('click', () => this.stopCameraScan());
        }
        
        resetSyncState() {
            // Reset UI elements
            this.sendStatus.textContent = 'Ready to generate sync code';
            this.sendStatus.className = 'sync-status';
            this.sendProgress.style.width = '0%';
            
            this.receiveStatus.textContent = 'Enter code or scan QR to connect';
            this.receiveStatus.className = 'sync-status';
            this.receiveProgress.style.width = '0%';
            this.receiverCode.value = '';
            
            // Clear QR code if exists
            if (this.qrCode) {
                this.qrCode.clear();
                this.sendQrContainer.innerHTML = '<div class="qr-placeholder">Click "Generate Code" to start</div>';
                this.qrCode = null;
            }
            
            this.peerIdDisplay.textContent = 'CLICK "GENERATE CODE"';
            
            // Reset steps
            document.querySelectorAll('#sync .sync-step').forEach((step, index) => {
                step.classList.remove('active', 'completed');
                if (index === 0) step.classList.add('active');
            });
            
            // Reset peer connection
            this.resetPeerConnection();
            this.stopCameraScan();
        }
        
        resetPeerConnection() {
            if (this.connection) {
                this.connection.close();
                this.connection = null;
            }
            
            if (this.peer) {
                this.peer.destroy();
                this.peer = null;
            }
            
            this.peerId = null;
            this.receivedData = null;
        }
        
        generatePeerId() {
            // Generate a random 6-digit alphanumeric code
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let id = '';
            for (let i = 0; i < 6; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return id;
        }
        
        copyPeerId() {
            if (!this.peerId) {
                showToast('Generate a code first');
                return;
            }
            
            navigator.clipboard.writeText(this.peerId).then(() => {
                showToast('Code copied to clipboard!');
            }).catch(err => {
                this.sendStatus.textContent = 'Failed to copy code: ' + err;
                this.sendStatus.className = 'sync-status error';
            });
        }
        
// This is the complete startPeer() function from your PeerSync class,
// updated to include the more robust error handling you requested.

startPeer() {
    if (this.peer) return;

    // Immediate UI feedback
    this.sendStatus.textContent = 'Generating sync code...';
    this.sendStatus.className = 'sync-status connecting';

    this.peerId = this.generatePeerId();
    this.peerIdDisplay.textContent = this.peerId;

    // Show QR code placeholder
    this.sendQrContainer.innerHTML = '<div class="qr-placeholder">Generating QR code...</div>';

    // Generate QR code and initialize PeerJS after a small delay
    setTimeout(() => {
        // ✨ The existing try block already covers both operations.
        try {
            // Clear any existing QR code
            if (this.qrCode) {
                this.qrCode.clear();
            }

            // --- 1. Attempt to generate QR code ---
            this.sendQrContainer.innerHTML = '';
            this.qrCode = new QRCode(this.sendQrContainer, {
                text: this.peerId,
                width: 160,
                height: 160,
                colorDark: "#2c3e50",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            // Update step 1 to completed
            document.querySelector('#sendContent .sync-step:nth-child(1)').classList.add('completed');
            document.querySelector('#sendContent .sync-step:nth-child(2)').classList.add('active');

            this.sendStatus.textContent = 'Waiting for receiver to connect...';

            // --- 2. Attempt to initialize PeerJS ---
            // This is the line your request focused on. If it fails,
            // it will now be caught by the improved catch block below.
            this.peer = new Peer(this.peerId, {
                host: '0.peerjs.com',
                port: 443,
                secure: true,
                debug: 1
            });

            // --- 3. Set up PeerJS event handlers ---
            this.peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                this.sendStatus.textContent = `Error: ${err.type}`;
                this.sendStatus.className = 'sync-status error';
                showToast(`PeerJS error: ${err.type}`);
            });

            this.peer.on('open', (id) => {
                // This message might be briefly overridden by the 'waiting' one, which is fine.
                this.sendStatus.textContent = `Ready to connect with ID: ${id}`;
            });

            this.peer.on('connection', (conn) => {
                this.connection = conn;
                this.sendStatus.textContent = 'Receiver connected!';
                this.sendStatus.className = 'sync-status connected';

                // Update step 2 to completed
                document.querySelector('#sendContent .sync-step:nth-child(2)').classList.add('completed');
                document.querySelector('#sendContent .sync-step:nth-child(3)').classList.add('active');

                this.setupDataConnection();
            });

        // ✨ CHANGED: This catch block is now more generic to handle
        // failures from either QR code generation or PeerJS initialization.
        } catch (error) {
            console.error('Initialization failed during peer setup:', error);
            // Provide a user-friendly error message that covers any failure in the try block.
            this.sendQrContainer.innerHTML = '<div class="qr-error">Initialization failed</div>';
            this.sendStatus.textContent = 'Could not start sync. Please try again.';
            this.sendStatus.className = 'sync-status error';
            showToast('Failed to initialize sync session.');
        }
    }, 100);
}
        
        startCameraScan() {
            // Hide input, show video
            this.receiverCode.style.display = 'none';
            this.scanBtn.style.display = 'none';
            this.cameraContainer.style.display = 'block';
            
            // Camera constraints
            const constraints = {
                video: { facingMode: "environment" },
                audio: false
            };

            // Start video stream
            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    this.videoStream = stream;
                    this.videoElement.srcObject = stream;
                    this.videoElement.play();
                    this.scanQRCode();
                })
                .catch(err => {
                    this.receiveStatus.textContent = `Camera error: ${err.message}`;
                    this.receiveStatus.className = 'sync-status error';
                    this.stopCameraScan();
                });
        }
        
// ✨ UPDATED FUNCTION: Replaces the existing scanQRCode in the PeerSync class.
// This version uses an arrow function to fix the 'this' context issue,
// ensuring the camera closes automatically on success.

scanQRCode() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Use an arrow function for scanFrame to preserve the 'this' context.
    // This is the key to fixing the auto-close issue.
    const scanFrame = () => {
        // If the video stream has been stopped (e.g., by clicking cancel),
        // we must stop the animation loop.
        if (!this.videoStream) {
            return;
        }

        // Wait for video to have dimensions
        if (!this.videoElement || !this.videoElement.videoWidth) {
            requestAnimationFrame(scanFrame);
            return;
        }

        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

        try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code && code.data) {
                // --- SUCCESS ---
                // A valid QR code was found.
                showToast(`QR Code Detected: ${code.data}`);
                this.receiverCode.value = code.data;
                
                // This call will now work correctly because 'this' refers to the PeerSync instance.
                this.stopCameraScan();
                
                this.connectToPeer();
                
                // Important: Do NOT request another animation frame. The scan is complete.
                return;

            } else {
                // --- NO CODE FOUND ---
                // Continue scanning on the next available frame.
                requestAnimationFrame(scanFrame);
            }
        } catch (e) {
            console.error('QR scanning error:', e);
            // Even if one frame errors, try the next one.
            requestAnimationFrame(scanFrame);
        }
    };

    // Start the scanning loop.
    requestAnimationFrame(scanFrame);
}
        
        stopCameraScan() {
            if (this.videoStream) {
                this.videoStream.getTracks().forEach(track => track.stop());
                this.videoStream = null;
            }
            
            this.cameraContainer.style.display = 'none';
            this.receiverCode.style.display = 'block';
            this.scanBtn.style.display = 'block';
            this.videoElement.srcObject = null;
        }
        
        connectToPeer() {
            const peerId = this.receiverCode.value.trim().toUpperCase();
            if (!peerId || peerId.length !== 6) {
                this.receiveStatus.textContent = 'Please enter a valid 6-digit code';
                this.receiveStatus.className = 'sync-status error';
                return;
            }
            
            this.receiveStatus.textContent = 'Connecting to sender...';
            this.receiveStatus.className = 'sync-status connecting';
            this.receiveProgress.style.width = '30%';
            
            // Initialize PeerJS with a random ID
            this.peer = new Peer({
                host: '0.peerjs.com',
                port: 443,
                secure: true,
                debug: 1
            });
            
            this.peer.on('open', (id) => {
                this.receiveStatus.textContent = `Connecting to ${peerId}...`;
                this.receiveProgress.style.width = '60%';
                
                // Connect to the sender
                this.connection = this.peer.connect(peerId, {
                    reliable: true
                });
                
                this.setupDataConnection();
                
                // Update step 1 to completed
                document.querySelector('#receiveContent .sync-step:nth-child(1)').classList.add('completed');
                document.querySelector('#receiveContent .sync-step:nth-child(2)').classList.add('active');
            });
            
            this.peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                this.receiveStatus.textContent = `Error: ${err.type}`;
                this.receiveStatus.className = 'sync-status error';
                this.receiveProgress.style.width = '0%';
            });
        }
        
        setupDataConnection() {
            if (!this.connection) return;
            
            this.connection.on('open', () => {
                if (this.sendContent.classList.contains('active')) {
                    // We are the sender - send data
                    this.sendStatus.textContent = 'Sending training data...';
                    this.sendProgress.style.width = '50%';
                    
                    setTimeout(() => {
                        this.sendTrainingData();
                    }, 500);
                } else {
                    // We are the receiver - wait for data
                    this.receiveStatus.textContent = 'Connected. Waiting for data...';
                    this.receiveStatus.className = 'sync-status connected';
                    this.receiveProgress.style.width = '80%';
                    
                    // Update step 2 to completed
                    document.querySelector('#receiveContent .sync-step:nth-child(2)').classList.add('completed');
                    document.querySelector('#receiveContent .sync-step:nth-child(3)').classList.add('active');
                }
            });
            
            this.connection.on('data', (data) => {
                if (this.receiveContent.classList.contains('active')) {
                    // We are the receiver - process incoming data
                    this.receiveTrainingData(data);
                }
            });
            
            this.connection.on('close', () => {
                if (this.sendContent.classList.contains('active')) {
                    this.sendStatus.textContent = 'Connection closed';
                } else {
                    this.receiveStatus.textContent = 'Connection closed';
                }
            });
            
            this.connection.on('error', (err) => {
                console.error('Connection error:', err);
                if (this.sendContent.classList.contains('active')) {
                    this.sendStatus.textContent = `Connection error: ${err.message}`;
                    this.sendStatus.className = 'sync-status error';
                } else {
                    this.receiveStatus.textContent = `Connection error: ${err.message}`;
                    this.receiveStatus.className = 'sync-status error';
                }
            });
        }
        
        sendTrainingData() {
            if (!this.connection || !this.connection.open) {
                this.sendStatus.textContent = 'Connection not ready for sending';
                this.sendStatus.className = 'sync-status error';
                return;
            }
            
            try {
                const trainingData = this.app.trainingData;
                const dataStr = JSON.stringify(trainingData);
                
                // Send data in chunks to simulate progress
                const chunkSize = 1024;
                const totalChunks = Math.ceil(dataStr.length / chunkSize);
                let chunksSent = 0;
                
                const sendNextChunk = () => {
                    const start = chunksSent * chunkSize;
                    const end = Math.min(start + chunkSize, dataStr.length);
                    const chunk = dataStr.substring(start, end);
                    
                    this.connection.send({
                        type: 'data',
                        chunk: chunk,
                        totalChunks: totalChunks,
                        currentChunk: chunksSent + 1
                    });
                    
                    chunksSent++;
                    const progress = Math.round((chunksSent / totalChunks) * 100);
                    this.sendProgress.style.width = `${50 + (progress / 2)}%`;
                    
                    if (chunksSent < totalChunks) {
                        setTimeout(sendNextChunk, 50);
                    } else {
                        // Final message
                        this.connection.send({
                            type: 'complete',
                            entries: Object.keys(trainingData).length
                        });
                        
                        this.sendProgress.style.width = '100%';
                        this.sendStatus.textContent = `Data sent successfully! Transferred ${Object.keys(trainingData).length} entries.`;
                        this.sendStatus.className = 'sync-status success';
                        
                        // Update step 3 to completed
                        document.querySelector('#sendContent .sync-step:nth-child(3)').classList.add('completed');
                        
                        // Close connection after a delay
                        setTimeout(() => {
                            if (this.connection) this.connection.close();
                        }, 3000);
                    }
                };
                
                // Start sending chunks
                sendNextChunk();
                
            } catch (err) {
                console.error('Error sending data:', err);
                this.sendStatus.textContent = 'Error sending data: ' + err.message;
                this.sendStatus.className = 'sync-status error';
            }
        }
        
        receiveTrainingData(data) {
            if (data.type === 'complete') {
                // Final processing
                this.receiveProgress.style.width = '100%';
                this.receiveStatus.textContent = `Received ${data.entries} training entries!`;
                this.receiveStatus.className = 'sync-status success';
                
                // Update step 3 to completed
                document.querySelector('#receiveContent .sync-step:nth-child(3)').classList.add('completed');
                
                // Save the data to the app
                try {
                    this.app.trainingData = JSON.parse(this.receivedData);
                    this.app.saveData();
                    this.app.updateHistory();
                    this.app.updateAnalytics();
                    showToast('Data received and saved successfully!');
                } catch (e) {
                    this.receiveStatus.textContent = 'Error parsing received data';
                    this.receiveStatus.className = 'sync-status error';
                }
                
                // Close connection after a delay
                setTimeout(() => {
                    if (this.connection) this.connection.close();
                }, 3000);
                
                return;
            }
            
            if (data.type === 'data') {
                if (!this.receivedData) this.receivedData = '';
                this.receivedData += data.chunk;
                
                const progress = Math.round((data.currentChunk / data.totalChunks) * 100);
                this.receiveProgress.style.width = `${80 + (progress / 5)}%`;
                this.receiveStatus.textContent = `Receiving data... ${data.currentChunk}/${data.totalChunks} chunks`;
                
                return;
            }
        }
    }
    

/* ============================================
   ✨ REVEAL TEAR EFFECT - FULLY CUSTOMIZABLE
   ============================================ */
class FluidTearEffect {
    constructor() {
        // --- 🖌️ YOUR CUSTOMIZATION CONTROLS ---
        this.TEAR_CONTROLS = {
            // How long the animation takes in milliseconds (e.g., 1200 = 1.2s)
            duration: 1000,
            
            // 'left-to-right' or 'right-to-left'
            direction: 'left-to-right',
            
            // Where the tear happens vertically (0.1 = top, 0.5 = middle, 0.9 = bottom)
            verticalPosition: 0.2,
            
            // How wavy and chaotic the tear line is (0 = straight, 50 = very wavy)
            waviness: 30,
            
            // How far the two halves fly apart
            separation: 500
        };
        // ------------------------------------

        this.canvas = null;
        this.ctx = null;
        this.screenshot = null;
        this.tearPoints = [];
        this.animationId = null;
        this.startTime = 0;
        this.dataCleared = false;
        this.isActive = false;

        // Apply settings from controls
        this.duration = this.TEAR_CONTROLS.duration;
    }

// ✨ ADD THIS ENTIRE NEW FUNCTION INSIDE THE CLASS
togglePageShadows(enable) {
    const shadowSelectors = [
        '.container', '.input-section', '.recommendation-panel', '.button-group',
        '.personalization-section', '.log-entry', '.modal-content', '.chart-container'
    ];
    
    const elements = document.querySelectorAll(shadowSelectors.join(', '));
    
    elements.forEach(el => {
        if (enable) {
            el.classList.remove('no-tear-shadow');
        } else {
            el.classList.add('no-tear-shadow');
        }
    });
}

// ✨ REPLACE your existing initiateTear function with this one
async initiateTear() {
    if (this.isActive) return;
    this.isActive = true;
    this.dataCleared = false;

    // Use a try...finally block to ENSURE shadows are always restored
    try {
        // 1. Turn OFF all shadows on the live page
        this.togglePageShadows(false);

        // 2. Take the "flat" screenshot
        const screenshotCanvas = await html2canvas(document.documentElement, {
            useCORS: true, allowTaint: true, scale: window.devicePixelRatio || 1,
            width: window.innerWidth, height: window.innerHeight,
            x: window.scrollX, y: window.scrollY,
            logging: false, 
            backgroundColor: '#fffacd', // Keep our solid background
            removeContainer: true
        });

        // 3. Prepare the animation canvas and points
        this.createTearCanvas();
        this.screenshot = screenshotCanvas;
        this.initializeTearPoints();
        
        // 4. Start the animation
        this.startTime = performance.now();
        this.animate();

    } catch (error) {
        console.error('Tear effect failed:', error);
        this.cleanup(); // Clean up on error
    } finally {
        // 5. ALWAYS turn the shadows back ON for the live page
        this.togglePageShadows(true);
    }
}

    createTearCanvas() {
        const existing = document.getElementById('tearCanvas');
        if (existing) existing.remove();

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'tearCanvas';
        this.canvas.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            z-index: 9999; pointer-events: none;
        `;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
    }

    initializeTearPoints() {
        this.tearPoints = [];
        const { direction, verticalPosition, waviness } = this.TEAR_CONTROLS;
        const steps = 150;
        
        for (let i = 0; i <= steps; i++) {
            let progress = i / steps;
            let x;

            // Use direction control to set X coordinate
            if (direction === 'right-to-left') {
                x = (1 - progress) * this.canvas.width;
            } else {
                x = progress * this.canvas.width;
            }
            
            const mainWave = Math.sin(progress * Math.PI * 3) * waviness;
            const microWave = Math.sin(progress * Math.PI * 20) * (waviness * 0.2);
            const noise = (Math.random() - 0.5) * 10;
            const y = this.canvas.height * verticalPosition + mainWave + microWave + noise;
            
            this.tearPoints.push({ x, y });
        }
    }

    animate() {
        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        const tearProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
        //draw the "new page" background first
        this.ctx.fillStyle = '#fffacd';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const separationOffset = Math.pow(progress, 2) * this.TEAR_CONTROLS.separation;

        // --- 1. Draw TOP half peeling UP ---
        this.ctx.save();
        this.ctx.translate(0, -separationOffset);
        this.drawClippedScreenshot(tearProgress, 'top');
        this.drawTornEdgeShadows(tearProgress, 'bottom-edge'); // Shadow on bottom edge
        this.ctx.restore();

        // --- 2. Draw BOTTOM half peeling DOWN ---
        this.ctx.save();
        this.ctx.translate(0, separationOffset);
        this.drawClippedScreenshot(tearProgress, 'bottom');
        this.drawTornEdgeShadows(tearProgress, 'top-edge'); // Shadow on top edge
        this.ctx.restore();

        // Clear the form data when the reveal is significant
        if (progress > 0.4 && !this.dataCleared) {
            this.dataCleared = true;
            window.app.clearCurrentEntry(true);
            showToast('Data cleared');
        }

        if (progress < 1) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.cleanup();
        }
    }

    // ✨ NEW & IMPROVED: Eliminates the "cone effect" artifact
    drawClippedScreenshot(progress, part) {
        const activePointsCount = Math.floor(progress * this.tearPoints.length);
        if (activePointsCount < 1) return;

        this.ctx.save();
        this.ctx.beginPath();
        
        const pathPoints = this.tearPoints.slice(0, activePointsCount);
        const firstPoint = pathPoints[0];
        const lastPoint = pathPoints[pathPoints.length - 1];

        if (part === 'top') {
            // Path for the top, peeling-up piece
            // Start at the top edge, above the first tear point
            this.ctx.moveTo(firstPoint.x, 0);
            // Draw along the top edge of the screen
            this.ctx.lineTo(this.canvas.width, 0);
            // Draw DOWN the right edge of the screen to meet the tear line
            this.ctx.lineTo(this.canvas.width, lastPoint.y);
            // Now draw along the tear path itself from right to left
            pathPoints.reverse().forEach(p => this.ctx.lineTo(p.x, p.y));
            // Close the shape by going up the left edge
            this.ctx.lineTo(firstPoint.x, 0);

        } else { // 'bottom'
            // Path for the bottom, peeling-down piece
            // Start at the bottom edge, below the first tear point
            this.ctx.moveTo(firstPoint.x, this.canvas.height);
            // Draw along the bottom edge of the screen
            this.ctx.lineTo(this.canvas.width, this.canvas.height);
            // Draw UP the right edge of the screen to meet the tear line
            this.ctx.lineTo(this.canvas.width, lastPoint.y);
            // Now draw along the tear path itself from right to left
            pathPoints.reverse().forEach(p => this.ctx.lineTo(p.x, p.y));
            // Close the shape by going down the left edge
            this.ctx.lineTo(firstPoint.x, this.canvas.height);
        }

        this.ctx.closePath();
        this.ctx.clip();
        
        // Draw the original screenshot inside this new, perfect shape
        this.ctx.drawImage(this.screenshot, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    // ✨ Modified to draw shadow on TOP or BOTTOM edge
    drawTornEdgeShadows(progress, edgeType) {
        const SHADOW_SETTINGS = {
            thickness: 6, opacity: 0.3, blur: 10
        };
        const activePointsCount = Math.floor(progress * this.tearPoints.length);
        if (activePointsCount < 2) return;

        this.ctx.save();
        this.ctx.strokeStyle = `rgba(0, 0, 0, ${SHADOW_SETTINGS.opacity})`;
        this.ctx.lineWidth = SHADOW_SETTINGS.thickness;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        this.ctx.shadowBlur = SHADOW_SETTINGS.blur;
        
        // Offset determines if shadow is above or below
        this.ctx.shadowOffsetY = (edgeType === 'bottom-edge') ? 4 : -4;
        
        this.ctx.beginPath();
        for (let i = 0; i < activePointsCount; i++) {
            const p = this.tearPoints[i];
            if (i === 0) this.ctx.moveTo(p.x, p.y);
            else this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.stroke();
        this.ctx.restore();
    }

    cleanup() {
        this.isActive = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
        this.canvas = this.ctx = this.screenshot = this.debris = null;
        this.tearPoints = [];
    }
}
    
    class MultiDayTracker {
constructor() {
    this.dataVersion = 3;
    this.initData();
    this.weeklyChart = null;
    this.modalCallback = null;
    this.chartDebounce = null;
    this.currentWeekIndex = 0;

    // 🔥 NEW: Track form state changes for optimized auto-save
    this.lastAutoSaveHash = null;
    this.hasUnsavedChanges = false;
    this.autoSaveInterval = null;

    // Field definitions (remains the same)
    this.fieldDefinitions = {
        sleepQuality: { name: 'Sleep Quality', section: 'Recovery Metrics', type: 'number' },
        snoozeTime: { name: 'Snooze Time', section: 'Recovery Metrics', type: 'time' },
        wakeTime: { name: 'Wake Time', section: 'Recovery Metrics', type: 'time' },
        mood: { name: 'Mood State', section: 'Recovery Metrics', type: 'select' },
        stress: { name: 'Stress Level', section: 'Physical State', type: 'number' },
        doms: { name: 'Muscle Soreness (DOMS)', section: 'Physical State', type: 'select' },
        tendons: { name: 'Tendon Condition', section: 'Physical State', type: 'select' },
        skin: { name: 'Skin Condition', section: 'Physical State', type: 'select' },
        mealBeforeTraining: { name: 'Pre-Training Meal', section: 'Physical State', type: 'select' },
        daysSince: { name: 'Days Since Last Session', section: 'Training History', type: 'number' },
        lastRPE: { name: 'Last Session RPE', section: 'Training History', type: 'number' },
        climbingType: { name: 'Climbing Type', section: 'Training History', type: 'checkbox' }
    };

    this.setInitialDate();
    this.setupEventListeners();
    this.loadDataForDate();
    this.restoreAutoSave();
    
    this.checkFirstVisit();
    
    // 🔥 UPDATED: Start optimized auto-save
    this.startOptimizedAutoSave();
    
    this.sync = new PeerSync(this);
}
        
        initData() {
            const savedData = localStorage.getItem('climbingTrackerData');
            const savedVersion = localStorage.getItem('climbSmartVersion');
            
            if (savedData && savedVersion === String(this.dataVersion)) {
                this.trainingData = JSON.parse(savedData);
            } else {
                if (savedData) localStorage.removeItem('climbingTrackerData');
                this.trainingData = {};
                this.saveData();
                localStorage.setItem('climbSmartVersion', this.dataVersion);
            }
        }
        
        
restoreAutoSave() {
    const autoSave = localStorage.getItem('climbSmartAutoSave');
    if (!autoSave) return;
    
    try {
        const data = JSON.parse(autoSave);
        
        // Check if auto-save is recent (within last 24 hours)
        const autoSaveAge = Date.now() - (data.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (autoSaveAge > maxAge) {
            localStorage.removeItem('climbSmartAutoSave');
            return;
        }
        
        this.currentDate = data.date;
        document.getElementById('currentDate').value = this.currentDate;
        
        this.setFormInputs(data.inputs);
        
        this.calculateAndDisplaySleepDuration();
        this.handleTrainingChange();
        this.calculateRecommendation();
        
        this.markAsSaved(); // Sync hash after restoring
        showToast('📱 Restored unsaved changes from previous session');
    } catch (error) {
        console.error('Failed to restore auto-save:', error);
        localStorage.removeItem('climbSmartAutoSave');
    }
}

        
        swipeTab(direction) {
            const tabs = ['daily', 'history', 'analytics', 'sync'];
            const currentTab = tabs.findIndex(tab => document.getElementById(tab).classList.contains('active'));
            let newIndex = currentTab + direction;
            
            if (newIndex < 0) newIndex = tabs.length - 1;
            if (newIndex >= tabs.length) newIndex = 0;
            
            this.switchTab(tabs[newIndex]);
        }
        
        checkFirstVisit() {
            const hasVisited = localStorage.getItem('climbSmartVisited');
            if (!hasVisited) {
                setTimeout(() => {
                    this.showWelcomeModal();
                }, 500);
            }
        }
        
        showWelcomeModal() {
            showModal('welcomeModal');
        }
        
closeWelcomeModal() {
    // Start the title dance animation
    const title = document.getElementById('appTitle');
    if (title) {
        title.classList.add('dancing');
        
        // Stop dancing after 3 seconds
        setTimeout(() => {
            title.classList.remove('dancing');
        }, 3000);
    }
    
    hideModal('welcomeModal');
    localStorage.setItem('climbSmartVisited', 'true');
}
        
        setInitialDate() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            this.currentDate = `${year}-${month}-${day}`;
            document.getElementById('currentDate').value = this.currentDate;
        }

        // --- SCORING ALGORITHMS ---
        recoveryDecay(days, halfLife = 1.5) { return 1 - Math.exp(-days * Math.log(2) / halfLife); }
        stressImpact(stress) { return 10 / (1 + Math.exp(-0.8 * (stress - 5))); }
        cumulativeFatigue(rpe, days) { 
            if (rpe === 0) return 0; // Skip fatigue calculation for rest days
            return Math.log(1 + rpe) * Math.exp(-days / 3); 
        }
        
calculateAdvancedReadiness(inputs) {
    const {sleepQuality, sleepDuration, mood, stress, doms, tendons, daysSince, lastRPE, skin, mealBeforeTraining} = inputs;
    const isRestDay = inputs.climbingType.includes('No Training');
    
    // Allow missing RPE on rest days
    const requiredFields = [sleepQuality, sleepDuration, mood, stress, doms, tendons, daysSince, skin];
    if (requiredFields.some(val => val === '' || isNaN(val)) || !mealBeforeTraining) {
        return null;
    }
    
    // Use 0 for RPE on rest days or when missing
    const effectiveRPE = isRestDay ? 0 : (lastRPE || 0);
    
    const sleepFactor = this.calculateSleepFactor();
    const injuryRiskFactor = this.calculateInjuryRiskFactor(inputs);
    
    const sleepOptimal = sleepDuration >= 7 && sleepDuration <= 9 ? 1 : Math.exp(-Math.pow((sleepDuration - 8) / 2, 2));
    const sleepScore = (sleepQuality / 10) * sleepOptimal * sleepFactor;
    const recoveryScore = this.recoveryDecay(daysSince);
    const stressScore = 1 - (1 / (1 + Math.exp(-1 * (stress - 5))));
    const physicalScore = Math.exp(-((doms - 1) + (tendons - 1)) / 5);
    const fatigueScore = 1 - this.cumulativeFatigue(effectiveRPE, daysSince);
    const moodScore = Math.exp(-Math.pow((mood - 2), 2) / 10);
    const skinScore = skin <= 3 ? 1 : skin <= 5 ? 0.7 : skin <= 7 ? 0.4 : 0.1;
    
    const mealFactor = mealBeforeTraining === 'yes' ? 1.05 : 0.95;
    
    const baseReadiness = (
        sleepScore * 0.25 + recoveryScore * 0.20 + stressScore * 0.15 + 
        physicalScore * 0.20 + fatigueScore * 0.10 + moodScore * 0.10
    ) * skinScore * mealFactor * injuryRiskFactor;
    
const interactionMultiplier = this.calculateInteractions(inputs);

// Apply hard sleep penalty override
if (sleepDuration < 3) {
    return 0.2;  // Absolute cap when sleep is dangerously low
}

// Final return with full logic
return Math.max(0, Math.min(10, baseReadiness * 10 * interactionMultiplier));
}
        
        calculateSleepFactor() {
            const entries = Object.values(this.trainingData);
            if (entries.length === 0) return 1.0;
            
            let totalSleep = 0;
            let count = 0;
            
            entries.forEach(entry => {
                if (entry.inputs.sleepDuration) {
                    totalSleep += parseFloat(entry.inputs.sleepDuration);
                    count++;
                }
            });
            
            if (count === 0) return 1.0;
            
            const avgSleep = totalSleep / count;
            
            if (avgSleep > 8) return 1.1;
            if (avgSleep > 7) return 1.0;
            if (avgSleep > 6) return 0.9;
            return 0.8;
        }
        
        
        
        calculateInjuryRiskFactor(inputs) {
            const entries = Object.values(this.trainingData);
            if (entries.length === 0) return 1.0;
            
            let tendonIssues = 0;
            let muscleIssues = 0;
            let count = 0;
            
            entries.forEach(entry => {
                if (entry.inputs.tendons && entry.inputs.doms) {
                    if (entry.inputs.tendons >= 4) tendonIssues++;
                    if (entry.inputs.doms >= 5) muscleIssues++;
                    count++;
                }
            });
            
            if (count === 0) return 1.0;
            
            const tendonRisk = tendonIssues / count;
            const muscleRisk = muscleIssues / count;
            
            let riskLevel = "Low";
            let riskFactor = 1.0;
            
            if (tendonRisk > 0.3 || muscleRisk > 0.4) {
                riskLevel = "Moderate";
                riskFactor = 0.9;
            }
            if (tendonRisk > 0.5 || muscleRisk > 0.6) {
                riskLevel = "High";
                riskFactor = 0.8;
            }
            
            document.getElementById('injuryRisk').textContent = riskLevel;
            document.getElementById('sleepFactor').textContent = this.calculateSleepFactor().toFixed(1) + "x";
            
            return riskFactor;
        }
        
        calculateInteractions(inputs) {
            const {sleepQuality, stress, doms, tendons, daysSince} = inputs;
            const sleepStressBonus = sleepQuality > 7 && stress < 4 ? 1.15 : 1.0;
            const recoveryPainPenalty = (doms > 4 || tendons > 4) && daysSince < 2 ? 0.8 : 1.0;
            const compoundStress = stress > 6 && (doms > 5 || tendons > 5) ? 0.7 : 1.0;
            return sleepStressBonus * recoveryPainPenalty * compoundStress;
        }
        
        // --- VALIDATION ---
validateFields() {
    const inputs = this.getInputs();
    const missingFields = {};
    let hasErrors = false;
    let firstErrorElement = null;
    
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    
    Object.keys(this.fieldDefinitions).forEach(fieldId => {
        if (fieldId === 'sessionNotes') return;
        
        const field = this.fieldDefinitions[fieldId];
        const value = inputs[fieldId];
        const element = document.getElementById(fieldId);
        const isRestDay = inputs.climbingType.includes('No Training');
        
        const addError = (el) => {
            hasErrors = true;
            el.classList.add('error');
            if (!firstErrorElement) firstErrorElement = el;
            if (!missingFields[field.section]) missingFields[field.section] = [];
            missingFields[field.section].push(field.name);
        };

        if (fieldId === 'climbingType') {
            // Always require at least one selection
            if (!value || value === '') {
                addError(document.getElementById('climbingTypeGroup'));
            }
        } else if (fieldId === 'lastRPE') {
            // Only require RPE if:
            // - There was a previous session (daysSince > 0)
            // - And today is NOT a rest day
            if ((value === '' || isNaN(value)) && inputs.daysSince > 0 && !isRestDay) {
                addError(element);
            }
        } else if (value === '' || (field.type === 'number' && isNaN(value))) {
            addError(element);
        } else if (field.type === 'time' && value === '') {
             addError(element);
        }
    });
    
    if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return { hasErrors, missingFields };
}
        
        showValidationModal(missingFields) {
            const errorsDiv = document.getElementById('validationErrors');
            errorsDiv.innerHTML = '';
            
            Object.keys(missingFields).forEach(section => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'validation-error-group';
                
                const title = document.createElement('h4');
                title.textContent = section;
                groupDiv.appendChild(title);
                
                const list = document.createElement('ul');
                list.className = 'validation-error-list';
                
                missingFields[section].forEach(field => {
                    const li = document.createElement('li');
                    li.textContent = field;
                    list.appendChild(li);
                });
                
                groupDiv.appendChild(list);
                errorsDiv.appendChild(groupDiv);
            });
            
            showModal('validationModal');
        }
        
        hideValidationModal() {
            hideModal('validationModal');
        }
        
        // --- RECOMMENDATIONS ---
        generateRecommendation(readinessScore, inputs) {
            const riskFactors = this.assessRiskFactors(inputs);
            const trainingVolume = this.calculateOptimalVolume(readinessScore, riskFactors);
            
            if (readinessScore >= 8.5) return { type: "HIGH INTENSITY", description: "Have fun.", volume: trainingVolume.high, risk: "Minimal", color: "#27ae60" };
            if (readinessScore >= 7) return { type: "MODERATE INTENSITY", description: "Technical, Strength.", volume: trainingVolume.moderate, risk: "Low", color: "#f39c12" };
            if (readinessScore >= 5) return { type: "LIGHT TRAINING", description: "Technique, mobility.", volume: trainingVolume.light, risk: "Moderate", color: "#e67e22" };
            if (readinessScore >= 3) return { type: "RECOVERY FOCUS", description: "Active recovery.", volume: trainingVolume.recovery, risk: "Moderate-High", color: "#e74c3c" };
            return { type: "REST DAY", description: "TAKE IT EASY", volume: "0 hours", risk: "Higher", color: "#c0392b" };
        }
        
        assessRiskFactors(inputs) {
            const risks = [];
            if (inputs.tendons > 4) risks.push("Tendon strain risk");
            if (inputs.doms > 5) risks.push("Muscle overload risk");
            if (inputs.stress > 7) risks.push("Psychological stress");
            if (inputs.sleepQuality < 6) risks.push("Insufficient recovery");
            if (inputs.skin > 5) risks.push("Skin injury risk");
            if (inputs.daysSince === 0) risks.push("Insufficient rest");
            return risks;
        }
        
        calculateOptimalVolume(readiness, risks) {
            const baseVolumes = { high: "2-3 hours", moderate: "1.5-2 hours", light: "1-1.5 hours", recovery: "30-60 minutes" };
            if (risks.length > 2) return { high: "1.5-2 hours", moderate: "1-1.5 hours", light: "45-90 minutes", recovery: "20-45 minutes" };
            return baseVolumes;
        }

        // --- DATA & UI ---
        setupEventListeners() {
            // Tab switching
            document.querySelectorAll('.tab-button').forEach(button => {
                button.addEventListener('click', () => {
                    const tabName = button.getAttribute('data-tab');
                    this.switchTab(tabName);
                });
            });
            
            // Title click
            document.getElementById('appTitle').addEventListener('click', () => this.showWelcomeModal());
            
            // Modal buttons
            document.getElementById('modalConfirmBtn').addEventListener('click', () => this.confirmModal());
            document.getElementById('modalCancelBtn').addEventListener('click', () => this.hideModal('customModal'));
            document.getElementById('validationOkBtn').addEventListener('click', () => this.hideModal('validationModal'));
            document.getElementById('closeWelcomeBtn').addEventListener('click', () => this.closeWelcomeModal());
            
            // Help modal events
            document.getElementById('helpBtn').addEventListener('click', () => showModal('helpModal'));
            document.getElementById('helpCloseBtn').addEventListener('click', () => hideModal('helpModal'));
            // Link sliders to number inputs
            this.setupSlider('sleepQuality', 'sleepQualitySlider');
            this.setupSlider('stress', 'stressSlider');
            this.setupSlider('daysSince', 'daysSinceSlider');
            this.setupSlider('lastRPE', 'lastRPESlider');

            // Time input listeners
            document.getElementById('snoozeTime').addEventListener('input', () => this.calculateAndDisplaySleepDuration());
            document.getElementById('wakeTime').addEventListener('input', () => this.calculateAndDisplaySleepDuration());

// Climbing type checkboxes
const climbingCheckboxes = ['climbingBouldering', 'climbingTopRope', 'climbingLead', 'climbingWeights', 'climbingCardio'];
const noneCheckbox = document.getElementById('climbingNone');

climbingCheckboxes.forEach(id => {
    document.getElementById(id).addEventListener('change', (e) => {
        if (e.target.checked) {
            noneCheckbox.checked = false;
            document.getElementById('climbingTypeGroup').classList.remove('error');
        }
    });
});

            noneCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    climbingCheckboxes.forEach(id => {
                        document.getElementById(id).checked = false;
                    });
                    document.getElementById('climbingTypeGroup').classList.remove('error');
                }
                this.handleTrainingChange();
            });
            
            // Form validation listeners
            Object.keys(this.fieldDefinitions).forEach(fieldId => {
                if (fieldId === 'climbingType' || fieldId === 'sessionNotes') return;
                
                const element = document.getElementById(fieldId);
                if (element) {
                    const eventType = element.tagName === 'SELECT' ? 'change' : 'input';
                    element.addEventListener(eventType, () => {
                        if (element.value !== '') element.classList.remove('error');
                    });
                }
            });
            
            // Main buttons
            document.getElementById('updateRecBtn').addEventListener('click', () => this.calculateRecommendation());
            document.getElementById('saveEntryBtn').addEventListener('click', () => this.saveEntry());
            document.getElementById('clearEntryBtn').addEventListener('click', () => this.clearDataWithTearEffect());            document.getElementById('loadDateBtn').addEventListener('click', () => {     this.showModal('This action will refresh entries or load the specified date. Do you wish to proceed?', () => {         this.loadDataForDate();     }); });
            
            // History navigation
            document.getElementById('prevWeekBtn').addEventListener('click', () => this.prevWeek());
            document.getElementById('nextWeekBtn').addEventListener('click', () => this.nextWeek());
            
            // Export/import
            document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportToCSV());
            document.getElementById('clearAllDataBtn').addEventListener('click', () => this.confirmClearAllData());
            document.getElementById('exportBackupBtn').addEventListener('click', () => this.exportBackup());
            document.getElementById('importBackupBtn').addEventListener('click', () => this.importBackup());
        }
        
        handleTrainingChange() {
            const noTraining = document.getElementById('climbingNone').checked;
            const rpeInput = document.getElementById('lastRPE');
            const rpeSlider = document.getElementById('lastRPESlider');
            
            if (noTraining) {
                // Disable and clear RPE fields
                rpeInput.classList.add('disabled-input');
                rpeSlider.classList.add('disabled-input');
                rpeInput.value = '';
                rpeSlider.value = '';
                rpeInput.disabled = true;
                rpeSlider.disabled = true;
                this.updateSliderFill(rpeSlider);
            } else {
                // Enable RPE fields
                rpeInput.classList.remove('disabled-input');
                rpeSlider.classList.remove('disabled-input');
                rpeInput.disabled = false;
                rpeSlider.disabled = false;
                if (rpeInput.value === '') {
                    rpeInput.value = '0';
                    rpeSlider.value = '0';
                }
                this.updateSliderFill(rpeSlider);
            }
        }

// ✨ REPLACE the body of your updateSliderFill function
updateSliderFill(slider) {
    if (!slider || slider.disabled) return;
    
    // --- Percentage Calculation (No changes needed here) ---
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || min;
    const clampedVal = Math.min(max, Math.max(min, val));
    const percentage = max === min ? 0 : ((clampedVal - min) / (max - min)) * 100;

    // --- Color Definitions ---
    let thumbColor = '#3498db'; // Default thumb color

    switch(slider.id) {
        case 'sleepQualitySlider': thumbColor = '#0088ff'; break;
        case 'stressSlider':       thumbColor = '#ff0080'; break;
        case 'daysSinceSlider':    thumbColor = '#00ff00'; break;
        case 'lastRPESlider':      thumbColor = '#ff4a18'; break;
    }
    
    // --- The Critical Fix ---

    // 1. Set the DYNAMIC THUMB COLOR. This works for ALL browsers.
    slider.style.setProperty('--thumb-bg', thumbColor);

    // 2. For WebKit ONLY, build the muted gradient for the track.
    //    Firefox ignores this 'background' property on the input itself.
    const mutedFill = getComputedStyle(slider).getPropertyValue('--track-fill-bg');
    const emptyFill = getComputedStyle(slider).getPropertyValue('--track-empty-bg');
    slider.style.background = `linear-gradient(to right, ${mutedFill} ${percentage}%, ${emptyFill} ${percentage}%)`;
}

setupSlider(inputId, sliderId) {
    const numberInput = document.getElementById(inputId);
    const sliderInput = document.getElementById(sliderId);

    if (!numberInput || !sliderInput) {
        console.log(`Slider setup failed: ${inputId} or ${sliderId} not found`);
        return;
    }

    const min = parseFloat(sliderInput.min) || 0;
    const max = parseFloat(sliderInput.max) || 100;
    const step = parseFloat(sliderInput.step) || 1;

    // 🔥 Block invalid characters while typing
    numberInput.addEventListener('keydown', (e) => {
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true) ||
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            return;
        }
        
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
            (e.keyCode < 96 || e.keyCode > 105) && 
            e.keyCode !== 190 && e.keyCode !== 110) {
            e.preventDefault();
        }
        
        if ((e.keyCode === 190 || e.keyCode === 110) && 
            numberInput.value.indexOf('.') !== -1) {
            e.preventDefault();
        }
        
        if ((e.keyCode === 190 || e.keyCode === 110) && step === 1) {
            e.preventDefault();
        }
    });

    // 🔥 FIXED: Update slider position as user types
    numberInput.addEventListener('input', (e) => {
        let value = numberInput.value;
        
        // Limit decimal places while typing
        if (value.includes('.')) {
            const parts = value.split('.');
            if (parts[1] && parts[1].length > 1) {
                numberInput.value = parts[0] + '.' + parts[1].substring(0, 1);
                value = numberInput.value;
            }
        }
        
        // 🔥 KEY FIX: Update slider position immediately
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            const clampedValue = Math.min(max, Math.max(min, numericValue));
            sliderInput.value = clampedValue;
            this.updateSliderFill(sliderInput); // Update visual fill
        }
    });

    // 🔥 Validate on paste
    numberInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const numericValue = parseFloat(paste);
        
        if (!isNaN(numericValue)) {
            const clampedValue = Math.min(max, Math.max(min, numericValue));
            const finalValue = this.limitDecimalPlaces(clampedValue, step);
            numberInput.value = finalValue;
            sliderInput.value = finalValue;
            this.updateSliderFill(sliderInput);
        }
    });

    // 🔥 Validate when user finishes typing
    numberInput.addEventListener('change', () => {
        let value = parseFloat(numberInput.value);
        
        if (isNaN(value) || numberInput.value === '') {
            numberInput.value = min;
            value = min;
        } else {
            value = Math.min(max, Math.max(min, value));
            value = this.limitDecimalPlaces(value, step);
        }
        
        numberInput.value = value;
        sliderInput.value = value;
        this.updateSliderFill(sliderInput);
    });

    // 🔥 Validate when user clicks away
    numberInput.addEventListener('blur', () => {
        let value = parseFloat(numberInput.value);
        
        if (isNaN(value) || numberInput.value === '') {
            numberInput.value = min;
            value = min;
        } else {
            value = Math.min(max, Math.max(min, value));
            value = this.limitDecimalPlaces(value, step);
        }
        
        numberInput.value = value;
        sliderInput.value = value;
        this.updateSliderFill(sliderInput);
    });

    // 🔥 Slider input change handler - update number input
    sliderInput.addEventListener('input', () => {
        const value = parseFloat(sliderInput.value);
        numberInput.value = value;
        this.updateSliderFill(sliderInput);
        
        // ✨ THE FIX: Manually tell the app a change happened.
        this.markAsChanged(); 
    });

    // Set initial values and fill
    if (!numberInput.value) {
        numberInput.value = min;
        sliderInput.value = min;
    } else {
        sliderInput.value = numberInput.value;
    }
    
    // Apply initial fill
    this.updateSliderFill(sliderInput);
}

// 🔥 NEW: Helper function to limit decimal places
limitDecimalPlaces(value, step) {
    if (step === 1) {
        return Math.round(value); // No decimals for integers
    } else if (step === 0.5) {
        return Math.round(value * 2) / 2; // Only .0 or .5
    } else {
        return Math.round(value * 10) / 10; // Max 1 decimal place
    }
}

loadDataForDate() {
    this.currentDate = document.getElementById('currentDate').value;
    const data = this.trainingData[this.currentDate];
    
    if (data) {
        this.setFormInputs(data.inputs);
    } else {
        this.clearCurrentEntry(false);
    }
    
    this.calculateAndDisplaySleepDuration();
    this.handleTrainingChange();
    this.calculateRecommendation();
    
    ['sleepQualitySlider', 'stressSlider', 'daysSinceSlider', 'lastRPESlider'].forEach(id => {
        const slider = document.getElementById(id);
        if (slider) this.updateSliderFill(slider);
    });
    
    // This is the crucial addition
    this.markAsSaved();
}

// --- Start: Block of New Functions ---

generateFormHash() {
    const inputs = this.getInputs();
    const dataString = JSON.stringify({
        date: this.currentDate,
        inputs: inputs
    });
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

hasFormChanged() {
    return this.generateFormHash() !== this.lastAutoSaveHash;
}

markAsChanged() {
    this.hasUnsavedChanges = true;
}
markAsSaved() {
    this.hasUnsavedChanges = false;
    this.lastAutoSaveHash = this.generateFormHash();
}

startOptimizedAutoSave() {
    this.setupChangeDetection();
    this.autoSaveInterval = setInterval(() => {
        this.performAutoSaveIfNeeded();
    }, 10000); // Check every 10 seconds
}

// ✨ REPLACEMENT for the setupChangeDetection function

setupChangeDetection() {
    // This list contains elements that should trigger a change on 'input' (while typing/sliding)
    const watchedInputs = [
        'sleepQuality', 'stress', 'daysSince', 'lastRPE', 'sessionNotes'
    ];
    
    // This list contains elements where 'change' is more reliable (after selection)
    const watchedSelects = [
        'snoozeTime', 'wakeTime', 'mood', 'doms', 'tendons', 'skin',
        'mealBeforeTraining', 'currentDate'
    ];
    
    // This list contains the checkboxes
    const watchedCheckboxes = [
        'climbingBouldering', 'climbingTopRope', 'climbingLead', 'climbingWeights', 'climbingCardio', 'climbingNone'
    ];

    const setupListener = (elementId, eventType) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(eventType, () => this.markAsChanged());
        } else {
            // This log can help you find if an ID is missing in your HTML
            console.warn(`Change detection setup warning: Element with ID "${elementId}" not found.`);
        }
    };



    // Listen for 'input' on fields that change continuously
    watchedInputs.forEach(id => setupListener(id, 'input'));
    
    // Listen for 'change' on fields that have a distinct final selection
    watchedSelects.forEach(id => setupListener(id, 'change'));
    
    // Listen for 'change' on checkboxes
    watchedCheckboxes.forEach(id => setupListener(id, 'change'));
}

performAutoSaveIfNeeded() {
    // We are keeping the old logs to see the whole story
    
    
    

    if (!this.hasUnsavedChanges || !this.hasFormChanged()) {
        return;
    }

    const inputs = this.getInputs();
    if (this.isFormEmpty(inputs)) {
        
        return;
    }

    // ✅ THIS IS THE MOST IMPORTANT NEW LOG
    
    
    localStorage.setItem('climbSmartAutoSave', JSON.stringify({
        date: this.currentDate,
        inputs: inputs,
        timestamp: Date.now()
    }));
    this.markAsSaved();
    this.showAutoSaveIndicator();
}

isFormEmpty(inputs) {
    return inputs.sleepQuality === 1 && inputs.stress === 1 && inputs.daysSince === 0 && inputs.lastRPE === 0 && !inputs.climbingType;
}

showAutoSaveIndicator() {
    let indicator = document.getElementById('autoSaveIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'autoSaveIndicator';
        indicator.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: rgba(39, 174, 96, 0.9); color: white;
            padding: 8px 16px; border-radius: 20px; font-size: 12px;
            z-index: 10000; opacity: 0;
            transition: opacity 0.3s ease-in-out; pointer-events: none;
        `;
        indicator.textContent = '💾 Auto-saved';
        document.body.appendChild(indicator);
    }
    indicator.style.opacity = '1';
    setTimeout(() => { indicator.style.opacity = '0'; }, 2000);
}

setFormInputs(inputs) {
    Object.keys(this.fieldDefinitions).forEach(id => {
        const el = document.getElementById(id);
        if (el && inputs[id] !== undefined) {
            if (id === 'snoozeTime' || id === 'wakeTime' || id === 'sessionNotes' || el.tagName === 'SELECT') {
                el.value = inputs[id];
            } else {
                el.value = inputs[id];
                if (el.type === 'number') el.dispatchEvent(new Event('input'));
            }
        }
    });

    ['climbingBouldering', 'climbingTopRope', 'climbingLead', 'climbingWeights', 'climbingCardio', 'climbingNone'].forEach(id => document.getElementById(id).checked = false);
    if (inputs.climbingType) {
        inputs.climbingType.split(', ').forEach(type => {
            const checkbox = document.querySelector(`input[value="${type}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
}

destroy() {
    if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
    }
}

// --- End: Block of New Functions ---

        calculateAndDisplaySleepDuration() {
    const snoozeTime = document.getElementById('snoozeTime').value;
    const wakeTime = document.getElementById('wakeTime').value;
    const display = document.getElementById('sleepDurationDisplay');

    if (!snoozeTime || !wakeTime) {
        display.textContent = '--:-- hours';
        return NaN;
    }

    let start = new Date(`1970-01-01T${snoozeTime}`);
    let end = new Date(`1970-01-01T${wakeTime}`);

    // Handle overnight sleep (snooze time is PM, wake time is AM)
    if (end < start) {
        end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end - start;
    const durationHours = diffMs / (1000 * 60 * 60);
    
    if (isNaN(durationHours) || durationHours < 0) {
         display.textContent = '--:-- hours';
        return NaN;
    }

    display.textContent = `${durationHours.toFixed(2)} hours`;
    return durationHours;
}

        getInputs() {
            const ids = ['sleepQuality', 'mood', 'stress', 'doms', 'tendons', 'skin', 'daysSince', 'lastRPE', 'mealBeforeTraining', 'sessionNotes', 'snoozeTime', 'wakeTime'];
            const inputs = {};
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    inputs[id] = el.type === 'number' ? parseFloat(el.value) : el.value;
                }
            });

            inputs.sleepDuration = this.calculateAndDisplaySleepDuration();

            const climbingTypes = [];
            const climbingCheckboxes = ['climbingBouldering', 'climbingTopRope', 'climbingLead', 'climbingWeights', 'climbingCardio', 'climbingNone'];
            climbingCheckboxes.forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox.checked) {
                    climbingTypes.push(checkbox.value);
                }
            });
            inputs.climbingType = climbingTypes.join(', ');

            if (inputs.sessionNotes) {
                inputs.sessionNotes = this.sanitizeNotes(inputs.sessionNotes);
            }
            
            // Clamp values to expected ranges (only if they are numbers)
            const clamp = (value, min, max) => {
                if (typeof value !== 'number' || isNaN(value)) return value;
                return Math.min(max, Math.max(min, value));
            };

            inputs.sleepQuality = clamp(inputs.sleepQuality, 1, 10);
            inputs.stress = clamp(inputs.stress, 1, 10);
            inputs.daysSince = clamp(inputs.daysSince, 0, 14);
            inputs.lastRPE = clamp(inputs.lastRPE, 0, 10);

            return inputs;
        }
        
sanitizeNotes(text) {
    // Basic HTML tag removal (your existing logic)
    let cleaned = text.replace(/<[^>]*>/g, '');
    
    // Additional XSS protection
    cleaned = cleaned.replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '')
                    .replace(/data:/gi, '');
    
    // Limit length to prevent massive notes
    if (cleaned.length > 1000) {
        cleaned = cleaned.substring(0, 1000) + '...';
    }
    
    return cleaned;
}

        calculateRecommendation() {
            const inputs = this.getInputs();
            const readinessScore = this.calculateAdvancedReadiness(inputs);
            const panel = document.getElementById('recommendationPanel');
            const titleEl = document.getElementById('recommendationTitle');
            const textEl = document.getElementById('recommendationText');
            const metricsGrid = document.getElementById('metricsGrid');

            if (readinessScore === null) {
                titleEl.innerText = "Incomplete Data";
                textEl.innerText = "Fill in all fields to generate a readiness estimation!";
                metricsGrid.innerHTML = '';
                panel.style.background = `linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)`;
                return;
            }

            const recommendation = this.generateRecommendation(readinessScore, inputs);
            panel.style.background = recommendation.color;
            titleEl.innerText = `Recommendation: ${recommendation.type}`;
            textEl.innerText = recommendation.description;
            metricsGrid.innerHTML = `
                <div class="metric-card">
                    <div class="metric-value">${readinessScore.toFixed(1)}</div>
                    <div>Readiness Score</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${recommendation.volume}</div>
                    <div>Optimal Volume</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${recommendation.risk}</div>
                    <div>Injury Risk</div>
                </div>
            `;
        }

        saveData() { 
            localStorage.setItem('climbingTrackerData', JSON.stringify(this.trainingData));
            localStorage.setItem('climbSmartVersion', this.dataVersion);
        }
        
saveEntry() {
    const date = document.getElementById('currentDate').value;
    if (!date) {
        showToast('Please select a date.');
        return;
    }
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (date > todayStr) {
        showToast('Cannot save entries for future dates.');
        return;
    }
    
    const validation = this.validateFields();
    if (validation.hasErrors) {
        this.showValidationModal(validation.missingFields);
        return;
    }
    
    document.getElementById('loader').style.display = 'flex';
    
    setTimeout(() => {
        const inputs = this.getInputs();
        const readinessScore = this.calculateAdvancedReadiness(inputs);
        const recommendation = this.generateRecommendation(readinessScore, inputs);
        
        this.trainingData[date] = { inputs, readinessScore, recommendation };
        this.saveData();
        
        localStorage.removeItem('climbSmartAutoSave');
        this.markAsSaved(); // Reset change tracking
        updateSettingsStatistics();
        document.getElementById('loader').style.display = 'none';
        showToast(`Entry for ${date} saved successfully!`);
        this.updateHistory();
        this.updateAnalytics();
    }, 1000);
}
        

clearCurrentEntry(clearDate = true) {
    // The body of this function to clear fields remains the same
    const ids = ['sleepQuality', 'mood', 'stress', 'doms', 'tendons', 'skin', 'daysSince', 'lastRPE', 'mealBeforeTraining', 'sessionNotes', 'snoozeTime', 'wakeTime'];
    ids.forEach(id => { 
        const el = document.getElementById(id);
        if (el) {
            el.value = '';
            el.classList.remove('error');
            if(el.type === 'number') el.dispatchEvent(new Event('input'));
        }
    });
    
    const sliderResets = [
        { id: 'sleepQuality', min: 1 }, { id: 'stress', min: 1 },
        { id: 'daysSince', min: 0 }, { id: 'lastRPE', min: 0 }
    ];
    sliderResets.forEach(({ id, min }) => {
        const numInput = document.getElementById(id);
        const slider = document.getElementById(id + 'Slider');
        if(numInput && slider) {
            numInput.value = min;
            slider.value = min;
            this.updateSliderFill(slider);
        }
    });
    
    document.getElementById('sleepDurationDisplay').textContent = '--:-- hours';
    ['climbingBouldering', 'climbingTopRope', 'climbingLead', 'climbingWeights', 'climbingCardio', 'climbingNone'].forEach(id => document.getElementById(id).checked = false);
    document.getElementById('climbingTypeGroup').classList.remove('error');

    if (clearDate) this.setInitialDate();
    
    this.handleTrainingChange();
    this.calculateRecommendation();
    
    // This is the crucial addition
    this.markAsSaved(); 
}
// In the MultiDayTracker class

async clearDataWithTearEffect() {
    // Create tear effect instance
    const tearEffect = new FluidTearEffect();
    
    // Button press effect
    const clearBtn = document.getElementById('clearEntryBtn');
    clearBtn.classList.add('clear-data-pressed');
    setTimeout(() => clearBtn.classList.remove('clear-data-pressed'), 100);
    
    // --- THE FIX ---
    // Introduce a tiny delay (e.g., 50 milliseconds) to allow the browser to
    // finish any pending rendering before taking the screenshot. This prevents
    // capturing a "dirty" or glitched frame.
    setTimeout(async () => {
        // Start the fluid tear animation *after* the delay
        await tearEffect.initiateTear();
    }, 150); // A small delay is usually sufficient.
}
        switchTab(tabName) {
            const currentTab = document.querySelector('.tab-content.active');
            if (currentTab && currentTab.id === tabName) return;

            if (currentTab) {
                currentTab.style.opacity = 0;
                setTimeout(() => {
                    currentTab.classList.remove('active');
                    
                    const newTab = document.getElementById(tabName);
                    newTab.classList.add('active');
                    setTimeout(() => {
                        newTab.style.opacity = 1;
                    }, 10);
                }, 300);
            } else {
                 const newTab = document.getElementById(tabName);
                 newTab.classList.add('active');
                 setTimeout(() => {
                     newTab.style.opacity = 1;
                 }, 10);
            }
            
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');
            
            if (tabName === 'history') {
                this.updateHistory();
                this.updateWeekDisplay();
            }
            if (tabName === 'analytics') {
                this.updateAnalytics();
            }
            if (tabName === 'sync' && this.sync) {
                this.sync.resetSyncState();
            }
        }
        
// Replace your existing prevWeek, nextWeek, and updateWeekDisplay functions

prevWeek() {
    this.currentWeekIndex++;
    this.updateHistory();
    this.updateWeekDisplay();
}

nextWeek() {
    this.currentWeekIndex = Math.max(0, this.currentWeekIndex - 1);
    this.updateHistory();
    this.updateWeekDisplay();
}

updateWeekDisplay() {
    const now = new Date();
    
    // Calculate the start of the current week (Sunday)
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    
    // Calculate the target week by going back currentWeekIndex weeks
    const targetWeekStart = new Date(currentWeekStart);
    targetWeekStart.setDate(currentWeekStart.getDate() - (this.currentWeekIndex * 7));
    
    const targetWeekEnd = new Date(targetWeekStart);
    targetWeekEnd.setDate(targetWeekStart.getDate() + 6);
    
    // Format the display
    const options = { month: 'short', day: 'numeric' };
    let weekText;
    
    if (this.currentWeekIndex === 0) {
        weekText = 'This Week';
    } else if (this.currentWeekIndex === 1) {
        weekText = 'Last Week';
    } else {
        const startStr = targetWeekStart.toLocaleDateString(undefined, options);
        const endStr = targetWeekEnd.toLocaleDateString(undefined, options);
        weekText = `${startStr} - ${endStr}`;
    }
    
    document.getElementById('currentWeek').textContent = weekText;
    
    // Update button states
    const nextBtn = document.getElementById('nextWeekBtn');
    const prevBtn = document.getElementById('prevWeekBtn');
    
    // Disable "Next" button if we're at current week
    if (nextBtn) {
        nextBtn.disabled = this.currentWeekIndex === 0;
        nextBtn.style.opacity = this.currentWeekIndex === 0 ? '0.5' : '1';
    }
    
    // Check if there's data beyond the current week range
    const sortedDates = Object.keys(this.trainingData).sort((a, b) => new Date(b) - new Date(a));
    const oldestDate = sortedDates.length > 0 ? new Date(sortedDates[sortedDates.length - 1]) : new Date();
    const hasOlderData = oldestDate < targetWeekStart;
    
    if (prevBtn) {
        prevBtn.style.opacity = hasOlderData ? '1' : '0.5';
    }
}

updateHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    const sortedDates = Object.keys(this.trainingData).sort((a, b) => new Date(b) - new Date(a));
    
    if (sortedDates.length === 0) {
        historyList.innerHTML = '<p style="text-align:center; color:#7f8c8d; padding: 40px;">No training history found.</p>';
        this.updateWeekDisplay();
        return;
    }
    
    let displayDates = [];
    
    if (this.currentWeekIndex === 0) {
        // Current week - show last 7 entries regardless of actual week
        displayDates = sortedDates.slice(0, 7);
    } else {
        // Historical weeks - show entries from that specific week
        const now = new Date();
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay());
        currentWeekStart.setHours(0, 0, 0, 0);
        
        const targetWeekStart = new Date(currentWeekStart);
        targetWeekStart.setDate(currentWeekStart.getDate() - (this.currentWeekIndex * 7));
        
        const targetWeekEnd = new Date(targetWeekStart);
        targetWeekEnd.setDate(targetWeekStart.getDate() + 7);
        
        displayDates = sortedDates.filter(date => {
            const dateObj = new Date(date + 'T00:00:00');
            return dateObj >= targetWeekStart && dateObj < targetWeekEnd;
        });
    }
    
    if (displayDates.length === 0) {
        historyList.innerHTML = '<p style="text-align:center; color:#7f8c8d; padding: 40px;">No entries for this week.</p>';
        this.updateWeekDisplay();
        return;
    }
    
    // 🟢 OPTIMIZED: Batch HTML creation
    let htmlFragments = [];
    
    displayDates.forEach(date => {
        const entry = this.trainingData[date];
        const notesHTML = entry.inputs.sessionNotes ? 
            `<div class="log-notes"><strong>Notes:</strong> ${entry.inputs.sessionNotes}</div>` : '';
        const sleepDuration = entry.inputs.sleepDuration ? 
            `${parseFloat(entry.inputs.sleepDuration).toFixed(1)}h` : 'N/A';
        
        const logHTML = `
            <div class="log-entry" style="border-left-color: ${entry.recommendation.color};">
                <div class="log-date">
                    <span>${new Date(date + 'T00:00:00').toLocaleDateString(undefined, { 
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                    })}</span>
                    <button class="delete-btn" onclick="app.deleteEntry('${date}')">Delete</button>
                </div>
                <div class="log-metrics">
                    <div class="log-metric"><strong>Readiness:</strong> ${entry.readinessScore.toFixed(1)}</div>
                    <div class="log-metric"><strong>Sleep:</strong> ${sleepDuration} (${entry.inputs.sleepQuality}/10)</div>
                    <div class="log-metric"><strong>Stress:</strong> ${entry.inputs.stress}/10</div>
                    <div class="log-metric"><strong>DOMS:</strong> ${entry.inputs.doms}/7</div>
                    <div class="log-metric"><strong>Tendons:</strong> ${entry.inputs.tendons}/6</div>
                    <div class="log-metric"><strong>Completed Today:</strong> ${entry.inputs.climbingType || 'N/A'}</div>
                </div>
                <div class="log-recommendation" style="color: ${entry.recommendation.color};">
                    <strong>Recommendation:</strong> ${entry.recommendation.type} - ${entry.recommendation.description}
                </div>
                ${notesHTML}
            </div>
        `;
        
        htmlFragments.push(logHTML);
    });
    
    // 🟢 SINGLE DOM operation instead of multiple +=
    historyList.innerHTML = htmlFragments.join('');
    
    this.updateWeekDisplay();
}

updateAnalytics() {
    clearTimeout(this.chartDebounce);
    
    this.chartDebounce = setTimeout(() => {
        const sortedData = Object.entries(this.trainingData).sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));
        const noDataMsg = document.getElementById('noDataMessage');
        const chartCanvas = document.getElementById('weeklyTrendChart');

        if (sortedData.length < 1) {
            noDataMsg.style.display = 'flex';
            chartCanvas.style.display = 'none';
            return;
        }
        
        noDataMsg.style.display = 'none';
        chartCanvas.style.display = 'block';

        const labels = sortedData.map(([date]) => new Date(date + 'T00:00:00').toLocaleDateString(undefined, {month: 'short', day: 'numeric'}));
        
        const readinessScores = sortedData.map(([, data]) => data.readinessScore);
        const sleepQuality = sortedData.map(([, data]) => data.inputs.sleepQuality);
        const sleepDuration = sortedData.map(([, data]) => data.inputs.sleepDuration);
        const mood = sortedData.map(([, data]) => data.inputs.mood);
        const stress = sortedData.map(([, data]) => data.inputs.stress);
        const doms = sortedData.map(([, data]) => data.inputs.doms);
        const tendons = sortedData.map(([, data]) => data.inputs.tendons);
        const skin = sortedData.map(([, data]) => data.inputs.skin);
        const lastRPE = sortedData.map(([, data]) => data.inputs.lastRPE);

        if (this.weeklyChart instanceof Chart) {
             this.weeklyChart.destroy();
    }

        const ctx = chartCanvas.getContext('2d');
        this.weeklyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { 
                        label: 'Readiness Score', 
                        data: readinessScores, 
                        borderColor: '#e74c3c',  // RED - High importance
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.1, 
                        yAxisID: 'y', 
                        borderWidth: 4,  // Thicker for importance
                        pointBackgroundColor: '#e74c3c',
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    },
                    { 
                        label: 'Sleep Quality', 
                        data: sleepQuality, 
                        borderColor: '#27ae60',  // GREEN - Healthy state
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        tension: 0.1, 
                        yAxisID: 'y', 
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#27ae60',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1
                    },
{ 
    label: 'Sleep Duration (hrs)', 
    data: sleepDuration, 
    borderColor: '#34495e',
    backgroundColor: 'rgba(52, 73, 94, 0.1)',
    tension: 0.1, 
    yAxisID: 'y', 
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 5,
    pointBackgroundColor: '#34495e',
    pointBorderColor: '#ffffff',
    pointBorderWidth: 1
},
                    { 
                        label: 'Mood', 
                        data: mood, 
                        borderColor: '#f39c12',  // YELLOW/ORANGE - Mental state
                        backgroundColor: 'rgba(243, 156, 18, 0.1)',
                        tension: 0.1, 
                        yAxisID: 'y', 
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#f39c12',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1
                    },
                    { 
                        label: 'Stress Level', 
                        data: stress, 
                        borderColor: '#e74c3c',  // RED - High importance/danger
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.1, 
                        yAxisID: 'y', 
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#e74c3c',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1,
                        borderDash: [5, 5]  // Dashed line to distinguish from Readiness
                    },
                    { 
                        label: 'DOMS (Muscle Soreness)', 
                        data: doms, 
                        borderColor: '#e67e22',  // ORANGE - Muscle strain
                        backgroundColor: 'rgba(230, 126, 34, 0.1)',
                        tension: 0.1, 
                        yAxisID: 'y3', 
                        borderWidth: 3,  // Thicker for visibility
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#e67e22',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    },
                    { 
                        label: 'Tendons', 
                        data: tendons, 
                        borderColor: '#9b59b6',  // PURPLE - Tendon issues
                        backgroundColor: 'rgba(155, 89, 182, 0.1)',
                        tension: 0.1, 
                        yAxisID: 'y4', 
                        borderWidth: 3,  // Thicker for visibility
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#9b59b6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    },
                    { 
                        label: 'Skin Condition', 
                        data: skin, 
                        borderColor: '#f1c40f',  // BRIGHT YELLOW - Skin issues
                        backgroundColor: 'rgba(241, 196, 15, 0.1)',
                        tension: 0.1, 
                        yAxisID: 'y3', 
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#f1c40f',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1
                    },
                    { 
                        label: 'Last RPE', 
                        data: lastRPE, 
                        borderColor: '#34495e',  // DARK BLUE - Professional/Training data
                        backgroundColor: 'rgba(52, 73, 94, 0.1)',
                        tension: 0.1, 
                        yAxisID: 'y', 
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#34495e',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1,
                        borderDash: [10, 5]  // Different dash pattern
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: { 
                    y: { 
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true, 
                        max: 10,
                        title: {
                            display: true,
                            text: 'Score (0-10)',
                            color: '#2c3e50',
                            font: {
                                weight: 'bold',
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y2: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        max: 12,
                        title: {
                            display: true,
                            text: 'Sleep Hours',
                            color: '#34495e',
                            font: {
                                weight: 'bold',
                                size: 12
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                    y3: {
                        type: 'linear',
                        display: false,
                        position: 'right',
                        beginAtZero: true,
                        max: 7,
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                    y4: {
                        type: 'linear',
                        display: false,
                        position: 'right',
                        beginAtZero: true,
                        max: 6,
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: { 
                    title: { 
                        display: true, 
                        text: 'Training Readiness Trends', 
                        font: { 
                            size: 18,
                            weight: 'bold'
                        },
                        color: '#2c3e50'
                    },
                    legend: {
                        display: false // We use custom controls
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(1);
                                }
                                return label;
                            },
                            labelColor: function(context) {
                                return {
                                    borderColor: context.dataset.borderColor,
                                    backgroundColor: context.dataset.borderColor,
                                    borderWidth: 2,
                                    borderRadius: 2,
                                };
                            }
                        }
                    }
                }
            }
        });
        
        this.addChartControls();
    }, 300);
}

/* ============================================
   CHART CONTROLS COLOR UPDATES
   ============================================ */

addChartControls() {
    const controlsDiv = document.getElementById('chartControls');
    controlsDiv.innerHTML = '';
    
    const datasets = this.weeklyChart.data.datasets;
    
    // Color mapping for control buttons
    const buttonColors = {
        'Readiness Score': '#e74c3c',
        'Sleep Quality': '#27ae60', 
        'Sleep Duration (hrs)': '#34495e',
        'Mood': '#f39c12',
        'Stress Level': '#e74c3c',
        'DOMS (Muscle Soreness)': '#e67e22',
        'Tendons': '#9b59b6',
        'Skin Condition': '#f1c40f',
        'Last RPE': '#34495e'
    };
    
    datasets.forEach((dataset, index) => {
        const button = document.createElement('button');
        button.className = 'chart-toggle';
        button.textContent = dataset.label;
        
        // Set button color to match dataset
        const datasetColor = buttonColors[dataset.label] || '#7f8c8d';
        button.style.setProperty('--button-color', datasetColor);
        
        // Set initial active state based on visibility
        if (!this.weeklyChart.getDatasetMeta(index).hidden) {
            button.classList.add('active');
            button.style.backgroundColor = datasetColor;
            button.style.color = 'white';
        } else {
            button.style.backgroundColor = 'transparent';
            button.style.color = datasetColor;
            button.style.border = `2px solid ${datasetColor}`;
        }
        
        button.addEventListener('click', () => {
            button.classList.toggle('active');
            const meta = this.weeklyChart.getDatasetMeta(index);
            meta.hidden = !meta.hidden;
            
            // Update button styling
            if (button.classList.contains('active')) {
                button.style.backgroundColor = datasetColor;
                button.style.color = 'white';
                button.style.border = `2px solid ${datasetColor}`;
            } else {
                button.style.backgroundColor = 'transparent';
                button.style.color = datasetColor;
                button.style.border = `2px solid ${datasetColor}`;
            }
            
            this.weeklyChart.update();
        });
        
        controlsDiv.appendChild(button);
    });
    
    // Initially hide all but the first dataset (Readiness)
    datasets.forEach((_, index) => {
         if(index > 0) {
             this.weeklyChart.getDatasetMeta(index).hidden = true;
             controlsDiv.children[index].classList.remove('active');
             const datasetColor = buttonColors[datasets[index].label] || '#7f8c8d';
             controlsDiv.children[index].style.backgroundColor = 'transparent';
             controlsDiv.children[index].style.color = datasetColor;
             controlsDiv.children[index].style.border = `2px solid ${datasetColor}`;
         } else {
              this.weeklyChart.getDatasetMeta(index).hidden = false;
              controlsDiv.children[index].classList.add('active');
              controlsDiv.children[index].style.backgroundColor = '#e74c3c';
              controlsDiv.children[index].style.color = 'white';
         }
    });
    this.weeklyChart.update();
}


        deleteEntry(date) {
            this.showModal(`Are you sure you want to delete the entry for ${date}?`, () => {
                delete this.trainingData[date];
                this.saveData();
                this.updateHistory();
                this.updateAnalytics();
                updateSettingsStatistics();
                hideModal('customModal');
                showToast('Entry deleted.');
            });
        }

        confirmClearAllData() {
            this.showModal('This will permanently delete all data. This action cannot be undone. Are you sure?', () => {
                this.trainingData = {};
                this.saveData();
                this.updateHistory();
                this.updateAnalytics();
                updateSettingsStatistics();
                hideModal('customModal');
                showToast('All data has been cleared.');
            });
        }

        exportToCSV() {
            const data = this.trainingData;
            if (Object.keys(data).length === 0) {
                showToast("No data to export.");
                return;
            }
            const headers = ['Date', 'ReadinessScore', 'SleepQuality', 'SnoozeTime', 'WakeTime', 'SleepDuration', 'Mood', 'Stress', 'DOMS', 'Tendons', 'Skin', 'DaysSinceLast', 'LastRPE', 'MealBefore', 'ClimbingType', 'SessionNotes', 'RecType', 'RecDesc'];
            let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
            const sortedDates = Object.keys(data).sort((a,b) => new Date(a) - new Date(b));
            
            sortedDates.forEach(date => {
                const entry = data[date];
                const notes = entry.inputs.sessionNotes ? `"${entry.inputs.sessionNotes.replace(/"/g, '""')}"` : '';
                const row = [
                    date,
                    entry.readinessScore.toFixed(2),
                    entry.inputs.sleepQuality, entry.inputs.snoozeTime, entry.inputs.wakeTime, entry.inputs.sleepDuration.toFixed(2),
                    entry.inputs.mood, entry.inputs.stress,
                    entry.inputs.doms, entry.inputs.tendons, entry.inputs.skin, entry.inputs.daysSince, entry.inputs.lastRPE,
                    entry.inputs.mealBeforeTraining, `"${entry.inputs.climbingType}"`, notes,
                    entry.recommendation.type, `"${entry.recommendation.description}"`
                ].join(",");
                csvContent += row + "\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "climbing_training_log.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Data exported successfully!');
        }
        
        exportBackup() {
            const backupCode = btoa(JSON.stringify(this.trainingData));
            document.getElementById('backupCode').value = backupCode;
            showToast('Backup code generated! Copy this code to save your data.');
        }
        
        importBackup() {
            const backupCode = document.getElementById('backupCode').value.trim();
            if (!backupCode) {
                showToast('Please enter a backup code.');
                return;
            }
            
            try {
                const decoded = atob(backupCode);
                // Basic validation for JSON structure
                if (!decoded.startsWith('{') && !decoded.startsWith('[')) {
                    throw new Error('Invalid data format');
                }
                
                const data = JSON.parse(decoded);
                
                // Additional validation for data structure
                if (typeof data !== 'object' || data === null) {
                    throw new Error('Invalid data structure');
                }
                
                let isValid = true;
                for (const key in data) {
                    if (!data[key].hasOwnProperty('inputs') || 
                        !data[key].hasOwnProperty('readinessScore') || 
                        !data[key].hasOwnProperty('recommendation')) {
                        isValid = false;
                        break;
                    }
                }
                
                if (!isValid) {
                    throw new Error('Invalid data structure');
                }
                
                this.trainingData = data;
                this.saveData();
                this.updateHistory();
                this.updateAnalytics();
                updateSettingsStatistics();
                showToast('Data restored successfully!');
            } catch (e) {
                console.error('Backup import error:', e);
                showToast('Invalid backup code. Please check and try again.');
            }
        }

        // --- MODAL ---
        showModal(message, callback) {
            document.getElementById('modalMessage').innerText = message;
            this.modalCallback = callback;
            showModal('customModal');
        }

        hideModal(modalId) {
            hideModal(modalId);
            this.modalCallback = null;
        }

        confirmModal() {
            if (this.modalCallback) {
                this.modalCallback();
            }
            hideModal('customModal');
        }
    }


    function loadClimbSmartSettings() {
        // Load settings from localStorage
        const settings = JSON.parse(localStorage.getItem('climbSmartSettings') || '{}');
        
        // Apply loaded settings to UI
        if (settings.autoSave) {
            document.getElementById('autoSaveFrequency').value = settings.autoSave;
        }
        if (settings.animations !== undefined) {
            document.getElementById('animationsToggle').checked = settings.animations;
        }
        if (settings.dailyReminder) {
            document.getElementById('dailyReminderToggle').checked = settings.dailyReminder;
        }
        if (settings.successNotifications !== undefined) {
            document.getElementById('successNotificationsToggle').checked = settings.successNotifications;
        }
        if (settings.autoBackup) {
            document.getElementById('autoBackupToggle').checked = settings.autoBackup;
        }
        if (settings.dataRetention) {
            document.getElementById('dataRetention').value = settings.dataRetention;
        }
    }

    function addSettingsEventListeners() {
        // Toggle switches
        document.getElementById('animationsToggle').addEventListener('change', toggleAnimations);
        document.getElementById('dailyReminderToggle').addEventListener('change', toggleDailyReminder);
        document.getElementById('successNotificationsToggle').addEventListener('change', toggleSuccessNotifications);
        document.getElementById('autoBackupToggle').addEventListener('change', toggleAutoBackup);
        
        // Select dropdowns
        document.getElementById('autoSaveFrequency').addEventListener('change', updateAutoSave);
        document.getElementById('dataRetention').addEventListener('change', updateDataRetention);
        
        // Action buttons
        document.getElementById('clearCacheBtn').addEventListener('click', clearBrowserCache);
        document.getElementById('resetSettingsBtn').addEventListener('click', resetAllSettings);
        document.getElementById('deleteAllDataBtn').addEventListener('click', deleteAllAppData);
        
        // Data retention
        document.getElementById('dataRetention').addEventListener('change', function() {
        updateDataRetention(event);
        applyDataRetention(); // Apply retention policy immediately
    });
        
    }

function updateAutoSave(event) {
    const frequency = event.target.value;
    saveSettingValue('autoSave', frequency);
    console.log('Auto-save frequency:', frequency + ' seconds');
    
    // Apply the new auto-save frequency immediately
    if (window.app && window.app.autoSaveInterval) {
        clearInterval(window.app.autoSaveInterval);
        
        if (frequency > 0) {
            window.app.autoSaveInterval = setInterval(() => {
                window.app.performAutoSaveIfNeeded();
            }, frequency * 1000);
        }
    }
}


    function toggleAnimations(event) {
        const enabled = event.target.checked;
        saveSettingValue('animations', enabled);
        console.log('Animations enabled:', enabled);
    }

    function toggleDailyReminder(event) {
        const enabled = event.target.checked;
        saveSettingValue('dailyReminder', enabled);
        console.log('Daily reminder enabled:', enabled);
    }

    function toggleSuccessNotifications(event) {
        const enabled = event.target.checked;
        saveSettingValue('successNotifications', enabled);
        console.log('Success notifications enabled:', enabled);
    }

    function toggleAutoBackup(event) {
        const enabled = event.target.checked;
        saveSettingValue('autoBackup', enabled);
        console.log('Auto backup enabled:', enabled);
    }

    function updateDataRetention(event) {
        const retention = event.target.value;
        saveSettingValue('dataRetention', retention);
        console.log('Data retention:', retention);
    }

    function clearBrowserCache() {
        // Clear temporary data but keep training data
        const confirmClear = confirm('Clear browser cache? This will reset temporary app data but keep your training entries.');
        if (confirmClear) {
            // Clear cache-like data but preserve training data
            localStorage.removeItem('tempData');
            localStorage.removeItem('chartCache');
            location.reload();
        }
    }

    function resetAllSettings() {
        const confirmReset = confirm('Reset all settings to default values? Your training data will not be affected.');
        if (confirmReset) {
            localStorage.removeItem('climbSmartSettings');
            location.reload();
        }
    }

// This can be a global function or a method inside your MultiDayTracker class.
function deleteAllAppData() {
    // 1. Use prompt() to ask the user for text input.
    const userInput = prompt('⚠️ DANGER: This will permanently delete ALL your training data. This cannot be undone!\n\nPlease type "DELETE" to confirm:');

    // 2. First, check if the user clicked "Cancel" (which returns null).
    if (userInput === null) {
        // User cancelled the action, so do nothing.
        return;
    }

    // 3. Compare the user's input to the required string.
    //    Use .trim() to remove accidental spaces and .toUpperCase() to make the check case-insensitive.
    if (userInput.trim().toUpperCase() === 'DELETE') {
        // The input is correct, proceed with deletion.
        localStorage.clear();
        location.reload();
    } else {
        // The input was incorrect.
        alert('Incorrect confirmation text. Data was not deleted.');
    }
}
    function saveSettingValue(key, value) {
        const settings = JSON.parse(localStorage.getItem('climbSmartSettings') || '{}');
        settings[key] = value;
        localStorage.setItem('climbSmartSettings', JSON.stringify(settings));
    }

    function updateSettingsStatistics() {
        // Calculate and display user statistics
        const data = JSON.parse(localStorage.getItem('climbingTrackerData') || '{}');
        const entries = Object.keys(data).length;
        
        document.getElementById('totalEntries').textContent = entries;
        
        if (entries > 0) {
            const avgReadiness = Object.values(data)
                .reduce((sum, entry) => sum + (entry.readinessScore || 0), 0) / entries;
            document.getElementById('averageReadiness').textContent = avgReadiness.toFixed(1);
        }
        
        document.getElementById('totalDays').textContent = entries;
        document.getElementById('currentStreak').textContent = calculateSettingsStreak(data);
    }

function calculateSettingsStreak(data) {
    // 1. Get entry dates and sort them from most recent to oldest.
    const sortedDates = Object.keys(data).sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length === 0) {
        return 0;
    }

    let streak = 0;
    
    // 2. Establish the starting point for the streak check (today at midnight).
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Check if the most recent entry is today or yesterday.
    const mostRecentEntryDate = new Date(sortedDates[0]);
    mostRecentEntryDate.setHours(0, 0, 0, 0);
    
    const diff = today - mostRecentEntryDate;
    const oneDay = 24 * 60 * 60 * 1000;

    // If the most recent entry is older than yesterday, the streak is 0.
    if (diff > oneDay) {
        return 0;
    }

    // 4. Iterate backwards from the most recent entry to count the streak.
    let expectedDate = mostRecentEntryDate;

    for (const dateStr of sortedDates) {
        const entryDate = new Date(dateStr);
        entryDate.setHours(0, 0, 0, 0);

        // If the entry date matches the expected date in the sequence...
        if (entryDate.getTime() === expectedDate.getTime()) {
            streak++;
            // Set the next expected date to the day before the current one.
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
            // A gap was found, so the consecutive streak is broken.
            break;
        }
    }

    return streak;
    }
    
    function applyDataRetention() {
    const policy = document.getElementById('dataRetention').value;
    
    // Skip if policy is "forever"
    if (policy === 'forever') return;
    
    const cutoffDays = parseInt(policy);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - cutoffDays);
    
    let deletedCount = 0;
    Object.keys(window.app.trainingData).forEach(date => {
        if (new Date(date + 'T00:00:00') < cutoff) {
            delete window.app.trainingData[date];
            deletedCount++;
        }
    });
    
    if (deletedCount > 0) {
        window.app.saveData();
        window.app.updateHistory();
        window.app.updateAnalytics();
        updateSettingsStatistics();
        showToast(`Deleted ${deletedCount} old entries based on retention policy.`);
    }
}
    
    
document.addEventListener('DOMContentLoaded', function() {
    // Initialize non-class features first
    initializeAnimatedTitle();
    
    // Create the one and only application instance
    window.app = new MultiDayTracker();
    
    // Now initialize the settings, which might depend on app data
    loadClimbSmartSettings();
    addSettingsEventListeners();
    updateSettingsStatistics();
    
    // Apply initial settings policies after app is fully loaded
    setTimeout(() => {
        applyDataRetention(); // Clean old data on startup
    }, 1000);
});

    
    

})(); // The parentheses at the end here are what make it run.


