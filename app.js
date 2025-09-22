let provider = null;
let signer = null;
let contract = null;
let userAccount = null;
let isDemoMode = false;

const DEFAULT_CONTRACT_ADDRESS = "0x636449ad5E280e88BB7178985259c91628472c5f";

const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "address", "name": "manufacturer", "type": "address"},
            {"indexed": false, "internalType": "bool", "name": "authorized", "type": "bool"}
        ],
        "name": "ManufacturerAuthorized",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "string", "name": "productId", "type": "string"},
            {"indexed": false, "internalType": "string", "name": "productName", "type": "string"},
            {"indexed": false, "internalType": "string", "name": "manufacturer", "type": "string"},
            {"indexed": true, "internalType": "address", "name": "addedBy", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "ProductAdded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "string", "name": "productId", "type": "string"},
            {"indexed": true, "internalType": "address", "name": "verifier", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "ProductVerified",
        "type": "event"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "productId", "type": "string"},
            {"internalType": "string", "name": "productName", "type": "string"},
            {"internalType": "string", "name": "manufacturer", "type": "string"},
            {"internalType": "bool", "name": "isAuthentic", "type": "bool"}
        ],
        "name": "addProduct",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "productId", "type": "string"},
            {"internalType": "string", "name": "productName", "type": "string"},
            {"internalType": "string", "name": "manufacturer", "type": "string"},
            {"internalType": "bool", "name": "isAuthentic", "type": "bool"}
        ],
        "name": "addProductSafe",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "authorizedManufacturers",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string[]", "name": "productIds", "type": "string[]"}],
        "name": "bulkVerifyProducts",
        "outputs": [{"internalType": "bool[]", "name": "", "type": "bool[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "contractPaused",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "productId", "type": "string"}],
        "name": "getEncryptedAuthenticity",
        "outputs": [{"internalType": "ebool", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "productId", "type": "string"}],
        "name": "getProduct",
        "outputs": [
            {"internalType": "string", "name": "productName", "type": "string"},
            {"internalType": "string", "name": "manufacturer", "type": "string"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "index", "type": "uint256"}],
        "name": "getProductIdByIndex",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalProducts",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bool", "name": "paused", "type": "bool"}],
        "name": "pauseContract",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "productId", "type": "string"}],
        "name": "productExists",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "productIds",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "manufacturer", "type": "address"},
            {"internalType": "bool", "name": "authorized", "type": "bool"}
        ],
        "name": "setManufacturerAuthorization",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "productId", "type": "string"}],
        "name": "verifyProduct",
        "outputs": [{"internalType": "ebool", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('transactionStatus');
    statusEl.textContent = message;
    statusEl.className = `transaction-status show ${type}`;

    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 5000);
}

async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed');
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });

        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAccount = await signer.getAddress();

        const network = await provider.getNetwork();

        document.getElementById('walletAddress').textContent =
            `${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
        document.getElementById('networkName').textContent = network.name;
        document.getElementById('walletInfo').style.display = 'block';
        document.getElementById('connectWallet').textContent = 'Connected';
        document.getElementById('connectWallet').disabled = true;

        showStatus('Wallet connected successfully', 'success');

        // Auto-load the default contract
        document.getElementById('contractAddress').value = DEFAULT_CONTRACT_ADDRESS;
        await loadContract();

    } catch (error) {
        console.error('Connection error:', error);
        showStatus(`Connection failed: ${error.message}`, 'error');
    }
}

async function loadContract() {
    try {
        const contractAddress = document.getElementById('contractAddress').value;

        if (!contractAddress) {
            throw new Error('Please enter contract address');
        }

        if (!signer) {
            throw new Error('Please connect wallet first');
        }

        contract = new ethers.Contract(contractAddress, contractABI, signer);

        const owner = await contract.owner();
        const isAuthorized = await contract.authorizedManufacturers(userAccount);
        const isOwner = userAccount.toLowerCase() === owner.toLowerCase();
        const isPaused = await contract.contractPaused();

        let statusHtml = `<div class="status-success">Contract loaded successfully.<br>`;
        statusHtml += `Owner: ${owner.substring(0, 6)}...${owner.substring(38)}<br>`;
        statusHtml += `Your Status: ${isOwner ? 'Contract Owner' : isAuthorized ? 'Authorized Manufacturer' : 'Not Authorized'}<br>`;
        statusHtml += `Contract Status: ${isPaused ? 'Paused' : 'Active'}`;
        statusHtml += `</div>`;

        document.getElementById('contractStatus').innerHTML = statusHtml;

        if (!isAuthorized && !isOwner) {
            showStatus('Contract loaded but you are not authorized to add products', 'error');
        } else if (isPaused) {
            showStatus('Contract loaded but is currently paused', 'error');
        } else {
            showStatus('Contract loaded successfully - you can add products', 'success');
        }

    } catch (error) {
        console.error('Contract loading error:', error);
        document.getElementById('contractStatus').innerHTML =
            `<div class="status-error">Failed to load contract: ${error.message}</div>`;
        showStatus(`Contract loading failed: ${error.message}`, 'error');
    }
}

async function addProduct() {
    const productId = document.getElementById('productId').value;
    const productName = document.getElementById('productName').value;
    const manufacturer = document.getElementById('manufacturer').value;
    const isAuthentic = document.getElementById('isAuthentic').checked;

    if (!productId || !productName || !manufacturer) {
        showStatus('Please fill all fields', 'error');
        return;
    }

    if (isDemoMode) {
        return addProductDemo(productId, productName, manufacturer, isAuthentic);
    }

    try {
        if (!contract) {
            enableDemoMode();
            return addProductDemo(productId, productName, manufacturer, isAuthentic);
        }

        showStatus('Adding product to blockchain...', 'loading');

        // Try blockchain transaction
        const tx = await contract.addProduct(productId, productName, manufacturer, isAuthentic);
        const receipt = await tx.wait();

        showStatus(`Product added successfully! Transaction: ${tx.hash}`, 'success');

        // Clear form
        document.getElementById('productId').value = '';
        document.getElementById('productName').value = '';
        document.getElementById('manufacturer').value = '';
        document.getElementById('isAuthentic').checked = false;

        // Add to UI
        addProductToUI({
            productId,
            productName,
            manufacturer,
            isAuthentic,
            timestamp: new Date().toISOString(),
            txHash: tx.hash
        });

    } catch (error) {
        console.log('Blockchain transaction failed, switching to demo mode:', error);
        enableDemoMode();
        return addProductDemo(productId, productName, manufacturer, isAuthentic);
    }
}

async function addProductDemo(productId, productName, manufacturer, isAuthentic) {
    showStatus('Adding product in demo mode...', 'loading');

    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const demoProduct = {
        productId: `${productId}_${Date.now()}`,
        productName,
        manufacturer,
        isAuthentic,
        timestamp: new Date().toISOString(),
        txHash: `0xdemo${Date.now()}`,
        isDemo: true
    };

    addProductToUI(demoProduct);

    showStatus('Product added successfully in demo mode!', 'success');

    // Clear form
    document.getElementById('productId').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('manufacturer').value = '';
    document.getElementById('isAuthentic').checked = false;
}

function enableDemoMode() {
    if (isDemoMode) return;

    isDemoMode = true;

    // Update contract status to show demo mode
    document.getElementById('contractStatus').innerHTML =
        `<div class="status-info empty">🔄 Demo Mode Active - Transactions are simulated locally</div>`;

    showStatus('Switched to demo mode - all transactions will be simulated', 'loading');

    console.log('Demo mode enabled - all transactions will be simulated');
}

async function verifyProduct() {
    try {
        if (!contract) {
            throw new Error('Please load contract first');
        }

        const productId = document.getElementById('verifyProductId').value;
        if (!productId) {
            throw new Error('Please enter product ID');
        }

        showStatus('Verifying product...', 'loading');

        const exists = await contract.productExists(productId);

        let resultHtml = '';
        if (exists) {
            const encryptedAuth = await contract.verifyProduct(productId);
            resultHtml = `
                <div class="status-success">
                    <h4>Product Found</h4>
                    <p><strong>Product ID:</strong> ${productId}</p>
                    <p><strong>Encrypted Authenticity:</strong> ${encryptedAuth.toString()}</p>
                    <p><em>Note: Authenticity is encrypted using FHE and can only be decrypted by authorized parties.</em></p>
                </div>
            `;
        } else {
            resultHtml = `<div class="status-error">Product not found in the system</div>`;
        }

        document.getElementById('verificationResult').innerHTML = resultHtml;
        showStatus('Product verification completed', 'success');

    } catch (error) {
        console.error('Verify product error:', error);
        document.getElementById('verificationResult').innerHTML =
            `<div class="status-error">Verification failed: ${error.message}</div>`;
        showStatus(`Verification failed: ${error.message}`, 'error');
    }
}

async function getProduct() {
    try {
        if (!contract) {
            throw new Error('Please load contract first');
        }

        const productId = document.getElementById('verifyProductId').value;
        if (!productId) {
            throw new Error('Please enter product ID');
        }

        showStatus('Getting product information...', 'loading');

        const exists = await contract.productExists(productId);

        if (!exists) {
            throw new Error('Product does not exist');
        }

        const productInfo = await contract.getProduct(productId);

        const resultHtml = `
            <div class="status-success">
                <h4>Product Information</h4>
                <p><strong>Product ID:</strong> ${productId}</p>
                <p><strong>Product Name:</strong> ${productInfo.productName}</p>
                <p><strong>Manufacturer:</strong> ${productInfo.manufacturer}</p>
                <p><strong>Timestamp:</strong> ${new Date(productInfo.timestamp * 1000).toLocaleString()}</p>
            </div>
        `;

        document.getElementById('verificationResult').innerHTML = resultHtml;
        showStatus('Product information retrieved', 'success');

    } catch (error) {
        console.error('Get product error:', error);
        document.getElementById('verificationResult').innerHTML =
            `<div class="status-error">Failed to get product info: ${error.message}</div>`;
        showStatus(`Failed to get product info: ${error.message}`, 'error');
    }
}

async function loadProducts() {
    try {
        if (!contract) {
            throw new Error('Please load contract first');
        }

        showStatus('Loading all products...', 'loading');

        const totalProducts = await contract.getTotalProducts();
        const productListEl = document.getElementById('productList');

        if (totalProducts.toNumber() === 0) {
            productListEl.innerHTML = '<div class="status-info empty">No products found in the system</div>';
            return;
        }

        let productsHtml = '';

        for (let i = 0; i < totalProducts; i++) {
            try {
                const productId = await contract.getProductIdByIndex(i);
                const productInfo = await contract.getProduct(productId);

                productsHtml += `
                    <div class="product-item">
                        <h4>${productInfo.productName}</h4>
                        <p><strong>ID:</strong> ${productId}</p>
                        <p><strong>Manufacturer:</strong> ${productInfo.manufacturer}</p>
                        <p><strong>Added:</strong> ${new Date(productInfo.timestamp * 1000).toLocaleString()}</p>
                    </div>
                `;
            } catch (error) {
                console.error(`Error loading product ${i}:`, error);
            }
        }

        productListEl.innerHTML = productsHtml;
        showStatus(`Loaded ${totalProducts} products`, 'success');

    } catch (error) {
        console.error('Load products error:', error);
        document.getElementById('productList').innerHTML =
            `<div class="status-error">Failed to load products: ${error.message}</div>`;
        showStatus(`Failed to load products: ${error.message}`, 'error');
    }
}

async function setAuthorization() {
    try {
        if (!contract) {
            throw new Error('Please load contract first');
        }

        const manufacturerAddress = document.getElementById('manufacturerAddress').value;
        const authorized = document.getElementById('authorizeManufacturer').checked;

        if (!manufacturerAddress) {
            throw new Error('Please enter manufacturer address');
        }

        showStatus('Setting manufacturer authorization...', 'loading');

        const tx = await contract.setManufacturerAuthorization(manufacturerAddress, authorized);
        await tx.wait();

        showStatus(`Manufacturer authorization ${authorized ? 'granted' : 'revoked'} successfully`, 'success');

        document.getElementById('manufacturerAddress').value = '';
        document.getElementById('authorizeManufacturer').checked = false;

    } catch (error) {
        console.error('Set authorization error:', error);
        showStatus(`Failed to set authorization: ${error.message}`, 'error');
    }
}

async function updatePauseStatus() {
    try {
        if (!contract) {
            throw new Error('Please load contract first');
        }

        const paused = document.getElementById('pauseContract').checked;

        showStatus('Updating contract pause status...', 'loading');

        const tx = await contract.pauseContract(paused);
        await tx.wait();

        showStatus(`Contract ${paused ? 'paused' : 'unpaused'} successfully`, 'success');

    } catch (error) {
        console.error('Pause contract error:', error);
        showStatus(`Failed to update pause status: ${error.message}`, 'error');
    }
}

async function transferOwnership() {
    try {
        if (!contract) {
            throw new Error('Please load contract first');
        }

        const newOwner = document.getElementById('newOwner').value;

        if (!newOwner) {
            throw new Error('Please enter new owner address');
        }

        showStatus('Transferring ownership...', 'loading');

        const tx = await contract.transferOwnership(newOwner);
        await tx.wait();

        showStatus('Ownership transferred successfully', 'success');
        document.getElementById('newOwner').value = '';

    } catch (error) {
        console.error('Transfer ownership error:', error);
        showStatus(`Failed to transfer ownership: ${error.message}`, 'error');
    }
}

function addProductToUI(productData) {
    const productListEl = document.getElementById('productList');

    // Create product item
    const productItem = document.createElement('div');
    productItem.className = 'product-item';

    const statusBadge = productData.isDemo ?
        '<span style="background: #f39c12; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">DEMO</span>' :
        '<span style="background: #27ae60; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">BLOCKCHAIN</span>';

    productItem.innerHTML = `
        <h4>${productData.productName} ${statusBadge}</h4>
        <p><strong>ID:</strong> ${productData.productId}</p>
        <p><strong>Manufacturer:</strong> ${productData.manufacturer}</p>
        <p><strong>Authentic:</strong> ${productData.isAuthentic ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Added:</strong> ${new Date(productData.timestamp).toLocaleString()}</p>
        ${productData.txHash && !productData.isDemo ?
            `<p><strong>Transaction:</strong> <a href="https://sepolia.etherscan.io/tx/${productData.txHash}" target="_blank">${productData.txHash.substring(0, 10)}...</a></p>` :
            productData.isDemo ?
                `<p><strong>Demo ID:</strong> ${productData.txHash}</p>` : ''
        }
    `;

    // Add to top of list
    productListEl.insertBefore(productItem, productListEl.firstChild);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.getElementById('loadContract').addEventListener('click', loadContract);
    document.getElementById('addProduct').addEventListener('click', addProduct);
    document.getElementById('verifyProduct').addEventListener('click', verifyProduct);
    document.getElementById('getProduct').addEventListener('click', getProduct);
    document.getElementById('loadProducts').addEventListener('click', loadProducts);
    document.getElementById('setAuthorization').addEventListener('click', setAuthorization);
    document.getElementById('pauseBtn').addEventListener('click', updatePauseStatus);
    document.getElementById('transferOwnership').addEventListener('click', transferOwnership);
});