// --- INITIALIZE APP ---
(function() {
    // This function runs immediately.
    // All the code inside here is in its own "private" world.
    
    
    
    // --- TOAST NOTIFICATIONS ---
    function showToast(message, duration = 3000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // --- MODAL MANAGEMENT ---
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
    }

    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
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
       
