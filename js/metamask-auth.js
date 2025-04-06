(function() {
    // Wait for DOM to be fully loaded
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeWallet);
    } else {
        // DOM already loaded
        initializeWallet();
    }
    
    function initializeWallet() {
        const connectButton = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        const connectionStatus = document.getElementById('connectionStatus');
        const walletAddress = document.getElementById('walletAddress');
        
        // Add signature state variables
        let userSignature = null;
        const signatureMessage = `Welcome to Y8!\n\nClick to sign in and authenticate with your wallet.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nTimestamp: ${Date.now()}`;
        
        if (!connectButton) {
            console.error("Connect wallet button not found in DOM");
            return;
        }
        
        // Double-check ethers is available
        if (typeof ethers === 'undefined') {
            console.error("Ethers library not loaded. MetaMask integration will not work.");
            connectButton.innerText = 'Error: ethers not loaded';
            connectButton.disabled = true;
            connectButton.style.backgroundColor = '#ccc';
            return;
        }
        
        // Improved check for MetaMask that works on mobile too
        const isMetaMaskInstalled = () => {
            const { ethereum } = window;
            // Check for ethereum provider injected by MetaMask
            return Boolean(ethereum && 
                (ethereum.isMetaMask || 
                 // Check for MetaMask providers on mobile
                 (ethereum.providers && 
                  ethereum.providers.some(p => p.isMetaMask))));
        };
        
        // Detect if we're on mobile
        const isMobile = () => {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        };
        
        // Get the right provider (handles mobile MetaMask multi-provider environment)
        const getProvider = () => {
            const { ethereum } = window;
            
            // If there are multiple providers, find MetaMask
            if (ethereum.providers) {
                const metaMaskProvider = ethereum.providers.find(p => p.isMetaMask);
                if (metaMaskProvider) return new ethers.providers.Web3Provider(metaMaskProvider);
            }
            
            // Default to the window.ethereum provider
            return new ethers.providers.Web3Provider(ethereum);
        };
        
        // Enhanced connection with signature request
        const connectToMetaMask = async () => {
            try {
                const provider = getProvider();
                const accounts = await provider.send("eth_requestAccounts", []);
                
                if (accounts.length > 0) {
                    // First update UI to show connection
                    updateUIAfterConnection(accounts[0]);
                    
                    // Now request signature for authentication
                    try {
                        // Request user to sign the message
                        const signer = provider.getSigner();
                        userSignature = await signer.signMessage(signatureMessage);
                        
                        console.log("Authentication successful!");
                        updateUIAfterAuthentication(accounts[0], userSignature);
                        return true;
                    } catch (signError) {
                        console.error("Error during signature:", signError);
                        connectionStatus.innerText = 'Connected (Not Authenticated)';
                        
                        // If on mobile, we might need to show a retry button for signing
                        if (isMobile()) {
                            connectButton.innerText = 'Sign to Authenticate';
                            connectButton.addEventListener('click', requestSignatureOnly);
                        }
                    }
                }
            } catch (error) {
                console.error("Error connecting to MetaMask:", error);
                
                // Check for specific errors
                if (error.code === -32002) {
                    // Connection request already pending
                    connectButton.innerText = 'Open MetaMask app';
                    if (isMobile()) {
                        // On mobile, we should redirect to MetaMask again
                        setTimeout(openMetaMaskMobile, 1000);
                    }
                } else {
                    connectButton.innerText = 'Connection failed';
                    setTimeout(() => {
                        connectButton.innerText = isMobile() ? 'Open in MetaMask' : 'Connect Wallet';
                    }, 3000);
                }
                return false;
            }
        };
        
        // Function to only request signature (for retry)
        const requestSignatureOnly = async () => {
            try {
                const provider = getProvider();
                const signer = provider.getSigner();
                userSignature = await signer.signMessage(signatureMessage);
                
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    updateUIAfterAuthentication(accounts[0], userSignature);
                }
            } catch (error) {
                console.error("Signature request failed:", error);
                connectionStatus.innerText = 'Authentication failed';
            }
        };
        
        // Update mobile deep link to include signature request
        const openMetaMaskMobile = () => {
            // Store the current timestamp with the message for verification
            const messageToSign = signatureMessage;
            sessionStorage.setItem('authMessage', messageToSign);
            
            // Create deep link that will trigger both connection and signing
            const dappUrl = `${window.location.host}${window.location.pathname}`;
            // The action=sign parameter signals to MetaMask that we want a signature
            const deepLink = `https://metamask.app.link/dapp/${dappUrl}?action=sign`;
            
            // Store a flag in sessionStorage to check if we're returning from MetaMask
            sessionStorage.setItem('metamaskPending', 'true');
            
            // Update button text
            connectButton.innerText = 'Opening MetaMask...';
            
            // Open the deeplink
            window.location.href = deepLink;
        };
        
        // Enhanced UI update after full authentication
        const updateUIAfterAuthentication = (account, signature) => {
            connectionStatus.innerText = 'Authenticated ✓';
            walletAddress.innerText = account;
            
            // Add signature info if needed
            // walletInfo.innerHTML += `<div><strong>Authenticated:</strong> <span style="color:green">✓</span></div>`;
            
            connectButton.innerText = 'Authenticated ✓';
            connectButton.style.backgroundColor = '#4CAF50';
            
            // In a real app, you might send the signature to your server for verification
            console.log("Signature:", signature);
        };
        
        // Update UI after successful connection
        const updateUIAfterConnection = (account) => {
            connectionStatus.innerText = 'Connected (Signing...)';
            walletAddress.innerText = account;
            walletInfo.style.display = 'block';
            connectButton.innerText = 'Waiting for signature...';
        };
        
        // Enhanced initialize function with signature detection
        const initialize = async () => {
            // First check if we're returning from MetaMask mobile
            const isPending = sessionStorage.getItem('metamaskPending') === 'true';
            if (isPending) {
                // Clear the pending flag
                sessionStorage.removeItem('metamaskPending');
                
                // If we have ethereum, try to connect and sign immediately
                if (window.ethereum) {
                    try {
                        console.log("Returning from MetaMask, attempting full authentication...");
                        await connectToMetaMask();
                        return;
                    } catch (error) {
                        console.error("Failed to authenticate after returning from MetaMask", error);
                    }
                }
            }
            
            // Continue with normal initialization
            if (isMetaMaskInstalled()) {
                try {
                    // Use the correct provider
                    const provider = getProvider();
                    const accounts = await provider.listAccounts();
                    
                    if (accounts.length > 0) {
                        // User is already connected
                        updateUIAfterConnection(accounts[0]);
                    } else {
                        // MetaMask is installed but not connected
                        connectButton.innerText = 'Connect Wallet';
                        connectButton.disabled = false;
                    }
                } catch (error) {
                    console.error("Error checking connection:", error);
                    connectButton.innerText = 'Error checking connection';
                }
            } else if (isMobile()) {
                // On mobile but MetaMask not detected
                connectButton.innerText = 'Open in MetaMask';
                connectButton.disabled = false;
                
                // Change connect action to deep link to MetaMask
                connectButton.removeEventListener('click', connectToMetaMask);
                connectButton.addEventListener('click', openMetaMaskMobile);
            } else {
                // MetaMask not installed (desktop)
                connectButton.innerText = 'MetaMask not installed';
                connectButton.disabled = true;
                connectButton.style.backgroundColor = '#ccc';
            }
        };
        
        // Handle connect button click
        connectButton.addEventListener('click', connectToMetaMask);
        
        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    updateUIAfterConnection(accounts[0]);
                } else {
                    // User disconnected all accounts
                    connectionStatus.innerText = 'Disconnected';
                    walletAddress.innerText = 'Not connected';
                    connectButton.innerText = 'Connect Wallet';
                    connectButton.style.backgroundColor = ''; // Reset to default
                    walletInfo.style.display = 'none';
                }
            });
        }
        
        // Add a visibility change listener to detect when user returns from MetaMask
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && sessionStorage.getItem('metamaskPending') === 'true') {
                // User has come back from MetaMask, try to connect and authenticate
                connectToMetaMask();
            }
        });
        
        // Initialize the app
        console.log("Initializing MetaMask authentication");
        initialize();
    }
})();
