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
        
        // Check if MetaMask is installed
        const isMetaMaskInstalled = () => {
            const { ethereum } = window;
            return Boolean(ethereum && ethereum.isMetaMask);
        };
        
        // Initialize the app
        const initialize = async () => {
            // If MetaMask is not installed, disable the button
            if (!isMetaMaskInstalled()) {
                connectButton.innerText = 'MetaMask not installed';
                connectButton.disabled = true;
                connectButton.style.backgroundColor = '#ccc';
                return;
            }
            
            // Check if we're already connected
            try {
                // Create provider
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const accounts = await provider.listAccounts();
                
                if (accounts.length > 0) {
                    // User is already connected
                    updateUIAfterConnection(accounts[0]);
                }
            } catch (error) {
                console.error("Error checking connection:", error);
                connectButton.innerText = 'Error checking connection';
            }
        };
        
        // Connect to MetaMask
        const connectToMetaMask = async () => {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                
                if (accounts.length > 0) {
                    updateUIAfterConnection(accounts[0]);
                }
            } catch (error) {
                console.error("Error connecting to MetaMask:", error);
                connectButton.innerText = 'Connection failed';
            }
        };
        
        // Update UI after successful connection
        const updateUIAfterConnection = (account) => {
            connectionStatus.innerText = 'Connected';
            walletAddress.innerText = account;
            walletInfo.style.display = 'block';
            connectButton.innerText = 'Connected';
            connectButton.style.backgroundColor = '#4CAF50';
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
                    connectButton.style.backgroundColor = '#F6851B';
                    walletInfo.style.display = 'none';
                }
            });
        }
        
        // Initialize the app
        console.log("Initializing MetaMask integration");
        initialize();
    }
})();
