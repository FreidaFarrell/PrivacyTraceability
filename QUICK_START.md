# Quick Start Guide - Hello FHEVM

🚀 **Get your first confidential application running in 5 minutes!**

## 🎯 What You'll Run

A **Privacy Product Traceability System** demonstrating FHEVM encryption in action.

**🔗 Live Version**: [https://privacy-traceability.vercel.app/](https://privacy-traceability.vercel.app/)

---

## ⚡ 5-Minute Setup

### Step 1: Access the Application 🌐
Visit: [https://privacy-traceability.vercel.app/](https://privacy-traceability.vercel.app/)

### Step 2: Connect Your Wallet 🦊
1. Click "Connect MetaMask"
2. Switch to **Sepolia Testnet**
3. Get test ETH from [Sepolia Faucet](https://faucets.chain.link/sepolia)

### Step 3: Explore Features 🔍

**Query Functions (No Authorization Required):**
- 📊 Check total products and batches
- 🔍 Query product information by ID
- 📋 View batch information
- ✅ Verify product authenticity
- 📈 View trace history

**Try These Example Queries:**
- Product ID: `1` (if it exists)
- Batch ID: `1` (if it exists)

### Step 4: Understand What You See 👀

**🔒 Encrypted Data** (Hidden from public view):
- Manufacturer IDs
- Production costs
- Quality scores
- Location details

**👁️ Public Data** (Visible to everyone):
- Product categories
- Event types
- Batch existence
- Authentication results

---

## 🎓 Learning Objectives

After this quick start, you'll understand:

1. **How FHEVM works** - Computation on encrypted data
2. **Data mixing strategy** - What to encrypt vs. keep public
3. **Permission systems** - Who can see what
4. **Real-world applications** - Privacy-preserving supply chains

---

## 🔧 Want to Modify the Code?

### Option 1: Use Our Code
```bash
git clone https://github.com/FreidaFarrell/PrivacyTraceability
cd PrivacyTraceability
# Open index.html in browser
```

### Option 2: Start from Scratch
Follow our complete [Hello FHEVM Tutorial](HELLO_FHEVM_TUTORIAL.md)

---

## 🤔 Common Questions

**Q: Why can't I authorize myself as a manufacturer?**
A: Only the contract owner can authorize users. This prevents unauthorized access to sensitive functions.

**Q: Where is the encrypted data?**
A: It's stored on the blockchain but encrypted! You can verify this by checking transaction data on Etherscan.

**Q: How do I see the encrypted values?**
A: Only authorized users can request decryption through specific contract functions.

---

## 🚀 Next Steps

1. **Experiment** with the live application
2. **Read** the [complete tutorial](HELLO_FHEVM_TUTORIAL.md)
3. **Build** your own confidential application
4. **Share** your creations with the community

---

**Ready to dive deeper?** 👉 [Read the Full Tutorial](HELLO_FHEVM_TUTORIAL.md)