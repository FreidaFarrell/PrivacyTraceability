// Privacy Product Traceability System
const CONTRACT_ADDRESS = '0xD2BF97b3D170fde0ef4c20249D31A88F9FA915AC';

// Contract ABI - Privacy Traceability Contract
const CONTRACT_ABI = [
    "function owner() view returns (address)",
    "function nextProductId() view returns (uint256)",
    "function nextBatchId() view returns (uint256)",
    "function authorizedTrackers(address) view returns (bool)",
    "function authorizedManufacturers(address) view returns (bool)",
    "function addAuthorizedTracker(address tracker)",
    "function removeAuthorizedTracker(address tracker)",
    "function addAuthorizedManufacturer(address manufacturer)",
    "function removeAuthorizedManufacturer(address manufacturer)",
    "function createBatch(uint32 supplierCount, uint32 quantity) returns (uint256)",
    "function registerProduct(uint32 manufacturerId, uint32 qualityScore, uint32 cost, uint256 batchId, string memory category) returns (uint256)",
    "function addTraceRecord(uint256 productId, uint32 locationId, uint32 handlerId, bool qualityCheckPassed, string memory eventType)",
    "function sealBatch(uint256 batchId)",
    "function verifyProductAuthenticity(uint256 productId) view returns (bool)",
    "function getProductInfo(uint256 productId) view returns (address manufacturer, uint256 batchId, string memory category, uint256 traceRecordCount)",
    "function getBatchInfo(uint256 batchId) view returns (bool isSealed, address batchOwner, uint256 productCount)",
    "function getTraceRecordCount(uint256 productId) view returns (uint256)",
    "function getPublicTraceInfo(uint256 productId, uint256 recordIndex) view returns (address recorder, string memory eventType)",
    "function requestProductDecryption(uint256 productId)",
    "function getTotalProducts() view returns (uint256)",
    "function getTotalBatches() view returns (uint256)",
    "event ProductRegistered(uint256 indexed productId, address indexed manufacturer, uint256 batchId)",
    "event BatchCreated(uint256 indexed batchId, address indexed owner)",
    "event TraceRecordAdded(uint256 indexed productId, address indexed recorder, string eventType)",
    "event QualityCheckPerformed(uint256 indexed productId, address indexed checker)",
    "event BatchSealed(uint256 indexed batchId)"
];

class PrivacyTraceabilityApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.isConnected = false;

        this.initializeApp();
    }

    async initializeApp() {
        this.bindEvents();
        await this.checkConnection();
        await this.loadStatistics();
    }

    bindEvents() {
        // Wallet connection
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());

        // Manufacturer actions
        document.getElementById('addManufacturer').addEventListener('click', () => this.addManufacturer());
        document.getElementById('createBatch').addEventListener('click', () => this.createBatch());
        document.getElementById('registerProduct').addEventListener('click', () => this.registerProduct());
        document.getElementById('sealBatch').addEventListener('click', () => this.sealBatch());

        // Tracker actions
        document.getElementById('addTracker').addEventListener('click', () => this.addTracker());
        document.getElementById('addTraceRecord').addEventListener('click', () => this.addTraceRecord());

        // Query actions
        document.getElementById('queryProduct').addEventListener('click', () => this.queryProduct());
        document.getElementById('queryBatch').addEventListener('click', () => this.queryBatch());
        document.getElementById('getTraceHistory').addEventListener('click', () => this.getTraceHistory());
        document.getElementById('verifyProduct').addEventListener('click', () => this.verifyProduct());

        // Statistics
        document.getElementById('refreshProducts').addEventListener('click', () => this.refreshProducts());
        document.getElementById('refreshBatches').addEventListener('click', () => this.refreshBatches());
    }

    async checkConnection() {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await this.connectWallet();
                }
            } catch (error) {
                console.log('No previous connection');
            }
        }
    }

    async connectWallet() {
        try {
            if (!window.ethereum) {
                this.showStatus('Please install MetaMask!', 'error');
                return;
            }

            this.showStatus('Connecting wallet...', 'info');

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
            this.userAddress = accounts[0];
            this.isConnected = true;

            const network = await this.provider.getNetwork();

            document.getElementById('walletAddress').textContent =
                `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
            document.getElementById('networkName').textContent = network.name || `Chain ID: ${network.chainId}`;
            document.getElementById('walletInfo').classList.remove('hidden');
            document.getElementById('connectWallet').style.display = 'none';

            this.showStatus('Wallet connected successfully!', 'success');
            await this.loadStatistics();

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else {
                    this.userAddress = accounts[0];
                    document.getElementById('walletAddress').textContent =
                        `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
                }
            });

        } catch (error) {
            console.error('Connection failed:', error);
            this.showStatus('Failed to connect wallet: ' + error.message, 'error');
        }
    }

    disconnectWallet() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.isConnected = false;

        document.getElementById('walletInfo').classList.add('hidden');
        document.getElementById('connectWallet').style.display = 'block';
        this.showStatus('Wallet disconnected', 'info');
    }

    async addManufacturer() {
        if (!this.ensureConnected()) return;

        try {
            this.showStatus('Adding manufacturer authorization...', 'info');
            const tx = await this.contract.addAuthorizedManufacturer(this.userAddress);
            await tx.wait();
            this.showStatus('Successfully authorized as manufacturer!', 'success');
        } catch (error) {
            console.error('Add manufacturer failed:', error);
            if (error.message.includes('Not authorized owner')) {
                this.showStatus('Error: Only the contract owner can authorize manufacturers. Contact the contract owner to get authorization.', 'error');
            } else {
                this.showStatus('Failed to add manufacturer: ' + this.getErrorMessage(error), 'error');
            }
        }
    }

    async addTracker() {
        if (!this.ensureConnected()) return;

        try {
            this.showStatus('Adding tracker authorization...', 'info');
            const tx = await this.contract.addAuthorizedTracker(this.userAddress);
            await tx.wait();
            this.showStatus('Successfully authorized as tracker!', 'success');
        } catch (error) {
            console.error('Add tracker failed:', error);
            if (error.message.includes('Not authorized owner')) {
                this.showStatus('Error: Only the contract owner can authorize trackers. Contact the contract owner to get authorization.', 'error');
            } else {
                this.showStatus('Failed to add tracker: ' + this.getErrorMessage(error), 'error');
            }
        }
    }

    async createBatch() {
        if (!this.ensureConnected()) return;

        const supplierCount = parseInt(document.getElementById('supplierCount').value);
        const quantity = parseInt(document.getElementById('batchQuantity').value);

        if (!supplierCount || !quantity) {
            this.showStatus('Please enter valid supplier count and quantity', 'error');
            return;
        }

        try {
            this.showStatus('Creating batch...', 'info');
            const tx = await this.contract.createBatch(supplierCount, quantity);
            const receipt = await tx.wait();

            // Extract batch ID from events
            const event = receipt.events?.find(e => e.event === 'BatchCreated');
            const batchId = event ? event.args.batchId.toString() : 'Unknown';

            this.showStatus(`Batch created successfully! Batch ID: ${batchId}`, 'success');

            // Clear form
            document.getElementById('supplierCount').value = '';
            document.getElementById('batchQuantity').value = '';

            await this.refreshBatches();
        } catch (error) {
            console.error('Create batch failed:', error);
            this.showStatus('Failed to create batch: ' + this.getErrorMessage(error), 'error');
        }
    }

    async registerProduct() {
        if (!this.ensureConnected()) return;

        const manufacturerId = parseInt(document.getElementById('manufacturerId').value);
        const qualityScore = parseInt(document.getElementById('qualityScore').value);
        const cost = parseInt(document.getElementById('productCost').value);
        const batchId = parseInt(document.getElementById('productBatchId').value);
        const category = document.getElementById('productCategory').value;

        if (!manufacturerId || qualityScore === undefined || !cost || !batchId || !category) {
            this.showStatus('Please fill all product registration fields', 'error');
            return;
        }

        if (qualityScore < 0 || qualityScore > 100) {
            this.showStatus('Quality score must be between 0 and 100', 'error');
            return;
        }

        try {
            this.showStatus('Registering product...', 'info');
            const tx = await this.contract.registerProduct(manufacturerId, qualityScore, cost, batchId, category);
            const receipt = await tx.wait();

            // Extract product ID from events
            const event = receipt.events?.find(e => e.event === 'ProductRegistered');
            const productId = event ? event.args.productId.toString() : 'Unknown';

            this.showStatus(`Product registered successfully! Product ID: ${productId}`, 'success');

            // Clear form
            document.getElementById('manufacturerId').value = '';
            document.getElementById('qualityScore').value = '';
            document.getElementById('productCost').value = '';
            document.getElementById('productBatchId').value = '';
            document.getElementById('productCategory').value = '';

            await this.refreshProducts();
        } catch (error) {
            console.error('Register product failed:', error);
            this.showStatus('Failed to register product: ' + this.getErrorMessage(error), 'error');
        }
    }

    async sealBatch() {
        if (!this.ensureConnected()) return;

        const batchId = parseInt(document.getElementById('sealBatchId').value);

        if (!batchId) {
            this.showStatus('Please enter a valid batch ID', 'error');
            return;
        }

        try {
            this.showStatus('Sealing batch...', 'info');
            const tx = await this.contract.sealBatch(batchId);
            await tx.wait();
            this.showStatus(`Batch ${batchId} sealed successfully!`, 'success');

            document.getElementById('sealBatchId').value = '';
        } catch (error) {
            console.error('Seal batch failed:', error);
            this.showStatus('Failed to seal batch: ' + this.getErrorMessage(error), 'error');
        }
    }

    async addTraceRecord() {
        if (!this.ensureConnected()) return;

        const productId = parseInt(document.getElementById('traceProductId').value);
        const locationId = parseInt(document.getElementById('locationId').value);
        const handlerId = parseInt(document.getElementById('handlerId').value);
        const qualityCheck = document.getElementById('qualityCheck').value === 'true';
        const eventType = document.getElementById('eventType').value;

        if (!productId || !locationId || !handlerId || !eventType) {
            this.showStatus('Please fill all trace record fields', 'error');
            return;
        }

        try {
            this.showStatus('Adding trace record...', 'info');
            const tx = await this.contract.addTraceRecord(productId, locationId, handlerId, qualityCheck, eventType);
            await tx.wait();
            this.showStatus(`Trace record added successfully for Product ID: ${productId}`, 'success');

            // Clear form
            document.getElementById('traceProductId').value = '';
            document.getElementById('locationId').value = '';
            document.getElementById('handlerId').value = '';
            document.getElementById('qualityCheck').value = 'true';
            document.getElementById('eventType').value = '';
        } catch (error) {
            console.error('Add trace record failed:', error);
            this.showStatus('Failed to add trace record: ' + this.getErrorMessage(error), 'error');
        }
    }

    async queryProduct() {
        if (!this.ensureConnected()) return;

        const productId = parseInt(document.getElementById('queryProductId').value);

        if (!productId) {
            this.showStatus('Please enter a valid product ID', 'error');
            return;
        }

        try {
            this.showStatus('Querying product...', 'info');
            const result = await this.contract.getProductInfo(productId);

            const productInfo = document.getElementById('productInfo');
            productInfo.innerHTML = `
                <h4>Product ID: ${productId}</h4>
                <p><strong>Manufacturer:</strong> ${result.manufacturer}</p>
                <p><strong>Batch ID:</strong> ${result.batchId.toString()}</p>
                <p><strong>Category:</strong> ${result.category}</p>
                <p><strong>Trace Records:</strong> ${result.traceRecordCount.toString()}</p>
            `;
            productInfo.classList.remove('hidden');

            this.showStatus('Product information retrieved successfully!', 'success');
        } catch (error) {
            console.error('Query product failed:', error);
            this.showStatus('Failed to query product: ' + this.getErrorMessage(error), 'error');
        }
    }

    async queryBatch() {
        if (!this.ensureConnected()) return;

        const batchId = parseInt(document.getElementById('queryBatchId').value);

        if (!batchId) {
            this.showStatus('Please enter a valid batch ID', 'error');
            return;
        }

        try {
            this.showStatus('Querying batch...', 'info');
            const result = await this.contract.getBatchInfo(batchId);

            const batchInfo = document.getElementById('batchInfo');
            batchInfo.innerHTML = `
                <h4>Batch ID: ${batchId}</h4>
                <p><strong>Status:</strong> ${result.isSealed ? 'Sealed' : 'Open'}</p>
                <p><strong>Owner:</strong> ${result.batchOwner}</p>
                <p><strong>Product Count:</strong> ${result.productCount.toString()}</p>
            `;
            batchInfo.classList.remove('hidden');

            this.showStatus('Batch information retrieved successfully!', 'success');
        } catch (error) {
            console.error('Query batch failed:', error);
            this.showStatus('Failed to query batch: ' + this.getErrorMessage(error), 'error');
        }
    }

    async getTraceHistory() {
        if (!this.ensureConnected()) return;

        const productId = parseInt(document.getElementById('traceHistoryId').value);

        if (!productId) {
            this.showStatus('Please enter a valid product ID', 'error');
            return;
        }

        try {
            this.showStatus('Getting trace history...', 'info');
            const recordCount = await this.contract.getTraceRecordCount(productId);

            if (recordCount.eq(0)) {
                this.showStatus('No trace records found for this product', 'info');
                return;
            }

            let historyHtml = `<h4>Trace History for Product ID: ${productId}</h4>`;

            for (let i = 0; i < recordCount.toNumber(); i++) {
                try {
                    const record = await this.contract.getPublicTraceInfo(productId, i);
                    historyHtml += `
                        <div class="trace-record">
                            <p><strong>Record ${i + 1}:</strong></p>
                            <p><strong>Recorder:</strong> ${record.recorder}</p>
                            <p><strong>Event Type:</strong> ${record.eventType}</p>
                        </div>
                    `;
                } catch (recordError) {
                    historyHtml += `
                        <div class="trace-record">
                            <p><strong>Record ${i + 1}:</strong> Failed to load</p>
                        </div>
                    `;
                }
            }

            const traceHistory = document.getElementById('traceHistory');
            traceHistory.innerHTML = historyHtml;
            traceHistory.classList.remove('hidden');

            this.showStatus('Trace history retrieved successfully!', 'success');
        } catch (error) {
            console.error('Get trace history failed:', error);
            this.showStatus('Failed to get trace history: ' + this.getErrorMessage(error), 'error');
        }
    }

    async verifyProduct() {
        if (!this.ensureConnected()) return;

        const productId = parseInt(document.getElementById('verifyProductId').value);

        if (!productId) {
            this.showStatus('Please enter a valid product ID', 'error');
            return;
        }

        try {
            this.showStatus('Verifying product authenticity...', 'info');
            const isAuthentic = await this.contract.verifyProductAuthenticity(productId);

            const verifyResult = document.getElementById('verifyResult');
            verifyResult.innerHTML = `
                <h4>Verification Result for Product ID: ${productId}</h4>
                <p class="status ${isAuthentic ? 'success' : 'error'}">
                    <strong>${isAuthentic ? '✅ AUTHENTIC' : '❌ NOT AUTHENTIC'}</strong>
                </p>
                <p>${isAuthentic ? 'This product is verified as authentic.' : 'This product could not be verified as authentic.'}</p>
            `;
            verifyResult.classList.remove('hidden');

            this.showStatus(`Product verification completed: ${isAuthentic ? 'Authentic' : 'Not Authentic'}`,
                isAuthentic ? 'success' : 'error');
        } catch (error) {
            console.error('Verify product failed:', error);
            this.showStatus('Failed to verify product: ' + this.getErrorMessage(error), 'error');
        }
    }

    async loadStatistics() {
        await this.refreshProducts();
        await this.refreshBatches();
        await this.checkAuthorizations();
    }

    async checkAuthorizations() {
        if (!this.isConnected) return;

        try {
            const owner = await this.contract.owner();
            const isAuthorizedManufacturer = await this.contract.authorizedManufacturers(this.userAddress);
            const isAuthorizedTracker = await this.contract.authorizedTrackers(this.userAddress);

            // Display contract owner info
            let ownerInfoHtml = `
                <div class="product-info">
                    <h4>📋 Contract Information</h4>
                    <p><strong>Contract Owner:</strong> ${owner}</p>
                    <p><strong>Your Address:</strong> ${this.userAddress}</p>
                    <p><strong>Are you the owner?</strong> ${this.userAddress.toLowerCase() === owner.toLowerCase() ? 'Yes ✅' : 'No ❌'}</p>
                    <p><strong>Manufacturer Status:</strong> ${isAuthorizedManufacturer ? 'Authorized ✅' : 'Not Authorized ❌'}</p>
                    <p><strong>Tracker Status:</strong> ${isAuthorizedTracker ? 'Authorized ✅' : 'Not Authorized ❌'}</p>
                </div>
            `;

            // Update the wallet section with authorization info
            const walletInfo = document.getElementById('walletInfo');
            let existingAuthInfo = walletInfo.querySelector('.auth-info');
            if (!existingAuthInfo) {
                existingAuthInfo = document.createElement('div');
                existingAuthInfo.className = 'auth-info';
                walletInfo.appendChild(existingAuthInfo);
            }
            existingAuthInfo.innerHTML = ownerInfoHtml;

            let statusMsg = `Contract Owner: ${owner.slice(0, 6)}...${owner.slice(-4)}`;
            if (this.userAddress.toLowerCase() === owner.toLowerCase()) {
                statusMsg += ' (You are the owner)';
                this.showStatus('✅ You are the contract owner! You can authorize manufacturers and trackers.', 'success');
            } else {
                this.showStatus('ℹ️ You are not the contract owner. Only the owner can authorize users.', 'info');
            }

            console.log(`Full contract owner address: ${owner}`);
            console.log(`Your address: ${this.userAddress}`);
        } catch (error) {
            console.error('Failed to check authorizations:', error);
        }
    }

    async refreshProducts() {
        if (!this.isConnected) {
            document.getElementById('totalProducts').textContent = 'Connect wallet to view';
            return;
        }

        try {
            const total = await this.contract.getTotalProducts();
            document.getElementById('totalProducts').textContent = total.toString();
        } catch (error) {
            document.getElementById('totalProducts').textContent = 'Error loading';
            console.error('Failed to load total products:', error);
        }
    }

    async refreshBatches() {
        if (!this.isConnected) {
            document.getElementById('totalBatches').textContent = 'Connect wallet to view';
            return;
        }

        try {
            const total = await this.contract.getTotalBatches();
            document.getElementById('totalBatches').textContent = total.toString();
        } catch (error) {
            document.getElementById('totalBatches').textContent = 'Error loading';
            console.error('Failed to load total batches:', error);
        }
    }

    ensureConnected() {
        if (!this.isConnected) {
            this.showStatus('Please connect your wallet first', 'error');
            return false;
        }
        return true;
    }

    showStatus(message, type) {
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
        statusElement.classList.remove('hidden');

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                statusElement.classList.add('hidden');
            }, 5000);
        }
    }

    getErrorMessage(error) {
        if (error.data?.message) {
            return error.data.message;
        } else if (error.message) {
            return error.message;
        } else {
            return 'An unknown error occurred';
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new PrivacyTraceabilityApp();
});