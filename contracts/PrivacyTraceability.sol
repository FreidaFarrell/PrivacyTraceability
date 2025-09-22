// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";

contract PrivacyTraceability {

    struct Product {
        string productId;
        string productName;
        string manufacturer;
        ebool isAuthentic; // FHE encrypted boolean
        uint256 timestamp;
        address addedBy;
        bool exists;
    }

    mapping(string => Product) private products;
    mapping(address => bool) public authorizedManufacturers;
    string[] public productIds;

    address public owner;

    event ProductAdded(
        string indexed productId,
        string productName,
        string manufacturer,
        address indexed addedBy,
        uint256 timestamp
    );

    event ProductVerified(
        string indexed productId,
        address indexed verifier,
        uint256 timestamp
    );

    event ManufacturerAuthorized(address indexed manufacturer, bool authorized);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedManufacturers[msg.sender] || msg.sender == owner,
            "Not authorized to add products"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedManufacturers[msg.sender] = true;
    }

    /**
     * @dev Add a new product to the traceability chain
     * @param _productId Unique identifier for the product
     * @param _productName Name of the product
     * @param _manufacturer Manufacturer name
     * @param _isAuthentic Boolean indicating if product is authentic (encrypted with FHE)
     */
    function addProduct(
        string memory _productId,
        string memory _productName,
        string memory _manufacturer,
        bool _isAuthentic
    ) public onlyAuthorized {
        require(bytes(_productId).length > 0, "Product ID cannot be empty");
        require(bytes(_productName).length > 0, "Product name cannot be empty");
        require(bytes(_manufacturer).length > 0, "Manufacturer cannot be empty");
        require(!products[_productId].exists, "Product already exists");

        // Convert boolean to FHE encrypted boolean
        ebool encryptedAuthenticity = FHE.asEbool(_isAuthentic);

        products[_productId] = Product({
            productId: _productId,
            productName: _productName,
            manufacturer: _manufacturer,
            isAuthentic: encryptedAuthenticity,
            timestamp: block.timestamp,
            addedBy: msg.sender,
            exists: true
        });

        productIds.push(_productId);

        emit ProductAdded(
            _productId,
            _productName,
            _manufacturer,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Get encrypted authenticity status for verification
     * @param _productId Product ID to verify
     * @return Encrypted boolean indicating authenticity
     */
    function verifyProduct(string memory _productId)
        public
        view
        returns (ebool)
    {
        require(products[_productId].exists, "Product does not exist");

        // Return encrypted authenticity for verification
        return products[_productId].isAuthentic;
    }

    /**
     * @dev Get encrypted authenticity status (for authorized parties)
     * @param _productId Product ID to check
     * @return Encrypted boolean indicating authenticity
     */
    function getEncryptedAuthenticity(string memory _productId)
        public
        view
        returns (ebool)
    {
        require(products[_productId].exists, "Product does not exist");
        return products[_productId].isAuthentic;
    }

    /**
     * @dev Get basic product information (non-sensitive data)
     * @param _productId Product ID to query
     * @return productName Name of the product
     * @return manufacturer Manufacturer name
     * @return timestamp When product was added
     */
    function getProduct(string memory _productId)
        public
        view
        returns (
            string memory productName,
            string memory manufacturer,
            uint256 timestamp
        )
    {
        require(products[_productId].exists, "Product does not exist");

        Product memory product = products[_productId];
        return (product.productName, product.manufacturer, product.timestamp);
    }

    /**
     * @dev Check if a product exists in the system
     * @param _productId Product ID to check
     * @return Boolean indicating if product exists
     */
    function productExists(string memory _productId) public view returns (bool) {
        return products[_productId].exists;
    }

    /**
     * @dev Get the total number of products in the system
     * @return Total number of products
     */
    function getTotalProducts() public view returns (uint256) {
        return productIds.length;
    }

    /**
     * @dev Get product ID by index
     * @param _index Index of the product
     * @return Product ID at the given index
     */
    function getProductIdByIndex(uint256 _index) public view returns (string memory) {
        require(_index < productIds.length, "Index out of bounds");
        return productIds[_index];
    }

    /**
     * @dev Authorize or deauthorize a manufacturer
     * @param _manufacturer Address of the manufacturer
     * @param _authorized Authorization status
     */
    function setManufacturerAuthorization(address _manufacturer, bool _authorized)
        public
        onlyOwner
    {
        authorizedManufacturers[_manufacturer] = _authorized;
        emit ManufacturerAuthorized(_manufacturer, _authorized);
    }

    /**
     * @dev Transfer ownership of the contract
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
        authorizedManufacturers[_newOwner] = true;
    }

    /**
     * @dev Bulk verify multiple products (gas optimized)
     * @param _productIds Array of product IDs to verify
     * @return Array of booleans indicating product existence
     */
    function bulkVerifyProducts(string[] memory _productIds)
        public
        view
        returns (bool[] memory)
    {
        bool[] memory results = new bool[](_productIds.length);

        for (uint256 i = 0; i < _productIds.length; i++) {
            results[i] = products[_productIds[i]].exists;
        }

        return results;
    }

    /**
     * @dev Emergency function to pause contract (only owner)
     */
    bool public contractPaused = false;

    function pauseContract(bool _paused) public onlyOwner {
        contractPaused = _paused;
    }

    modifier whenNotPaused() {
        require(!contractPaused, "Contract is paused");
        _;
    }

    /**
     * @dev Add product with pause check
     */
    function addProductSafe(
        string memory _productId,
        string memory _productName,
        string memory _manufacturer,
        bool _isAuthentic
    ) public onlyAuthorized whenNotPaused {
        addProduct(_productId, _productName, _manufacturer, _isAuthentic);
    }
}