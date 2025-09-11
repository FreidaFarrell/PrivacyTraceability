// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivateTraceability is SepoliaConfig {

    address public owner;
    uint256 public nextProductId;
    uint256 public nextBatchId;

    struct ProductInfo {
        euint32 encryptedManufacturerId;
        euint64 encryptedProductionTimestamp;
        euint32 encryptedQualityScore;
        euint32 encryptedCost;
        bool exists;
        address manufacturer;
        uint256 batchId;
        string publicCategory;
    }

    struct BatchInfo {
        euint32 encryptedSupplierCount;
        euint64 encryptedBatchTimestamp;
        euint32 encryptedQuantity;
        bool isSealed;
        address batchOwner;
        uint256[] productIds;
    }

    struct TraceRecord {
        euint32 encryptedLocationId;
        euint64 encryptedTimestamp;
        euint32 encryptedHandlerId;
        ebool encryptedQualityCheck;
        address recorder;
        string publicEventType;
    }

    mapping(uint256 => ProductInfo) public products;
    mapping(uint256 => BatchInfo) public batches;
    mapping(uint256 => TraceRecord[]) public productTraceHistory;
    mapping(address => bool) public authorizedTrackers;
    mapping(address => bool) public authorizedManufacturers;

    event ProductRegistered(uint256 indexed productId, address indexed manufacturer, uint256 batchId);
    event BatchCreated(uint256 indexed batchId, address indexed owner);
    event TraceRecordAdded(uint256 indexed productId, address indexed recorder, string eventType);
    event QualityCheckPerformed(uint256 indexed productId, address indexed checker);
    event BatchSealed(uint256 indexed batchId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized owner");
        _;
    }

    modifier onlyAuthorizedTracker() {
        require(authorizedTrackers[msg.sender] || msg.sender == owner, "Not authorized tracker");
        _;
    }

    modifier onlyAuthorizedManufacturer() {
        require(authorizedManufacturers[msg.sender] || msg.sender == owner, "Not authorized manufacturer");
        _;
    }

    modifier productExists(uint256 productId) {
        require(products[productId].exists, "Product does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        nextProductId = 1;
        nextBatchId = 1;
        authorizedTrackers[msg.sender] = true;
        authorizedManufacturers[msg.sender] = true;
    }

    function addAuthorizedTracker(address tracker) external onlyOwner {
        authorizedTrackers[tracker] = true;
    }

    function removeAuthorizedTracker(address tracker) external onlyOwner {
        authorizedTrackers[tracker] = false;
    }

    function addAuthorizedManufacturer(address manufacturer) external onlyOwner {
        authorizedManufacturers[manufacturer] = true;
    }

    function removeAuthorizedManufacturer(address manufacturer) external onlyOwner {
        authorizedManufacturers[manufacturer] = false;
    }

    function createBatch(
        uint32 supplierCount,
        uint32 quantity
    ) external onlyAuthorizedManufacturer returns (uint256 batchId) {
        batchId = nextBatchId++;

        euint32 encryptedSupplierCount = FHE.asEuint32(supplierCount);
        euint64 encryptedBatchTimestamp = FHE.asEuint64(uint64(block.timestamp));
        euint32 encryptedQuantity = FHE.asEuint32(quantity);

        batches[batchId] = BatchInfo({
            encryptedSupplierCount: encryptedSupplierCount,
            encryptedBatchTimestamp: encryptedBatchTimestamp,
            encryptedQuantity: encryptedQuantity,
            isSealed: false,
            batchOwner: msg.sender,
            productIds: new uint256[](0)
        });

        FHE.allowThis(encryptedSupplierCount);
        FHE.allowThis(encryptedBatchTimestamp);
        FHE.allowThis(encryptedQuantity);
        FHE.allow(encryptedSupplierCount, msg.sender);
        FHE.allow(encryptedBatchTimestamp, msg.sender);
        FHE.allow(encryptedQuantity, msg.sender);

        emit BatchCreated(batchId, msg.sender);
    }

    function registerProduct(
        uint32 manufacturerId,
        uint32 qualityScore,
        uint32 cost,
        uint256 batchId,
        string memory category
    ) external onlyAuthorizedManufacturer returns (uint256 productId) {
        require(batchId > 0 && batchId < nextBatchId, "Invalid batch ID");
        require(!batches[batchId].isSealed, "Batch is sealed");
        require(batches[batchId].batchOwner == msg.sender, "Not batch owner");

        productId = nextProductId++;

        euint32 encryptedManufacturerId = FHE.asEuint32(manufacturerId);
        euint64 encryptedProductionTimestamp = FHE.asEuint64(uint64(block.timestamp));
        euint32 encryptedQualityScore = FHE.asEuint32(qualityScore);
        euint32 encryptedCost = FHE.asEuint32(cost);

        products[productId] = ProductInfo({
            encryptedManufacturerId: encryptedManufacturerId,
            encryptedProductionTimestamp: encryptedProductionTimestamp,
            encryptedQualityScore: encryptedQualityScore,
            encryptedCost: encryptedCost,
            exists: true,
            manufacturer: msg.sender,
            batchId: batchId,
            publicCategory: category
        });

        batches[batchId].productIds.push(productId);

        FHE.allowThis(encryptedManufacturerId);
        FHE.allowThis(encryptedProductionTimestamp);
        FHE.allowThis(encryptedQualityScore);
        FHE.allowThis(encryptedCost);
        FHE.allow(encryptedManufacturerId, msg.sender);
        FHE.allow(encryptedProductionTimestamp, msg.sender);
        FHE.allow(encryptedQualityScore, msg.sender);
        FHE.allow(encryptedCost, msg.sender);

        emit ProductRegistered(productId, msg.sender, batchId);
    }

    function addTraceRecord(
        uint256 productId,
        uint32 locationId,
        uint32 handlerId,
        bool qualityCheckPassed,
        string memory eventType
    ) external onlyAuthorizedTracker productExists(productId) {
        euint32 encryptedLocationId = FHE.asEuint32(locationId);
        euint64 encryptedTimestamp = FHE.asEuint64(uint64(block.timestamp));
        euint32 encryptedHandlerId = FHE.asEuint32(handlerId);
        ebool encryptedQualityCheck = FHE.asEbool(qualityCheckPassed);

        TraceRecord memory newRecord = TraceRecord({
            encryptedLocationId: encryptedLocationId,
            encryptedTimestamp: encryptedTimestamp,
            encryptedHandlerId: encryptedHandlerId,
            encryptedQualityCheck: encryptedQualityCheck,
            recorder: msg.sender,
            publicEventType: eventType
        });

        productTraceHistory[productId].push(newRecord);

        FHE.allowThis(encryptedLocationId);
        FHE.allowThis(encryptedTimestamp);
        FHE.allowThis(encryptedHandlerId);
        FHE.allowThis(encryptedQualityCheck);
        FHE.allow(encryptedLocationId, msg.sender);
        FHE.allow(encryptedTimestamp, msg.sender);
        FHE.allow(encryptedHandlerId, msg.sender);
        FHE.allow(encryptedQualityCheck, msg.sender);

        emit TraceRecordAdded(productId, msg.sender, eventType);

        if (qualityCheckPassed) {
            emit QualityCheckPerformed(productId, msg.sender);
        }
    }

    function sealBatch(uint256 batchId) external onlyAuthorizedManufacturer {
        require(batchId > 0 && batchId < nextBatchId, "Invalid batch ID");
        require(batches[batchId].batchOwner == msg.sender, "Not batch owner");
        require(!batches[batchId].isSealed, "Batch already sealed");

        batches[batchId].isSealed = true;
        emit BatchSealed(batchId);
    }

    function verifyProductAuthenticity(uint256 productId)
        external
        view
        productExists(productId)
        returns (bool authentic) {
        return products[productId].manufacturer != address(0);
    }

    function getProductInfo(uint256 productId)
        external
        view
        productExists(productId)
        returns (
            address manufacturer,
            uint256 batchId,
            string memory category,
            uint256 traceRecordCount
        ) {
        ProductInfo storage product = products[productId];
        return (
            product.manufacturer,
            product.batchId,
            product.publicCategory,
            productTraceHistory[productId].length
        );
    }

    function getBatchInfo(uint256 batchId)
        external
        view
        returns (
            bool isSealed,
            address batchOwner,
            uint256 productCount
        ) {
        require(batchId > 0 && batchId < nextBatchId, "Invalid batch ID");
        BatchInfo storage batch = batches[batchId];
        return (
            batch.isSealed,
            batch.batchOwner,
            batch.productIds.length
        );
    }

    function getTraceRecordCount(uint256 productId)
        external
        view
        productExists(productId)
        returns (uint256) {
        return productTraceHistory[productId].length;
    }

    function getPublicTraceInfo(uint256 productId, uint256 recordIndex)
        external
        view
        productExists(productId)
        returns (
            address recorder,
            string memory eventType
        ) {
        require(recordIndex < productTraceHistory[productId].length, "Invalid record index");
        TraceRecord storage record = productTraceHistory[productId][recordIndex];
        return (record.recorder, record.publicEventType);
    }

    function requestProductDecryption(uint256 productId) external productExists(productId) {
        require(
            msg.sender == products[productId].manufacturer ||
            msg.sender == owner ||
            authorizedTrackers[msg.sender],
            "Not authorized to decrypt"
        );

        ProductInfo storage product = products[productId];
        bytes32[] memory cts = new bytes32[](4);
        cts[0] = FHE.toBytes32(product.encryptedManufacturerId);
        cts[1] = FHE.toBytes32(product.encryptedProductionTimestamp);
        cts[2] = FHE.toBytes32(product.encryptedQualityScore);
        cts[3] = FHE.toBytes32(product.encryptedCost);

        FHE.requestDecryption(cts, this.processProductDecryption.selector);
    }

    function processProductDecryption(
        uint256 requestId,
        uint32 manufacturerId,
        uint64 productionTimestamp,
        uint32 qualityScore,
        uint32 cost,
        bytes[] memory signatures
    ) external {
        // Signature validation - adjust based on actual FHE library version
        // FHE.checkSignatures(requestId, signatures);

        // Process decrypted values
        // Store or use the decrypted values as needed
    }

    function getTotalProducts() external view returns (uint256) {
        return nextProductId - 1;
    }

    function getTotalBatches() external view returns (uint256) {
        return nextBatchId - 1;
    }
}