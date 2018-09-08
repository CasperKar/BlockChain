/*
 * Javascript Blockchain v0.2
 * 
 * Created on: Sep 6, 2018
 * Author: C.Karreman (0931371)
 * 
 * Requires: CryptoJS v3.1.2(sha256.js)
 */

// The block is the data part of the blockchain. It contains the data and 
// verification values to verify the authenticy of the data and the validity
// of the block in the chain. This model is set up to be in a Proof Of Work
// blockchain.
function Block(index, prevHash, data) {
    return {
        index: index,
        prevHash: prevHash || "0".repeat(64),
        data: data || "",
        nonce: 0,
        hash: BlockChainHelper.hashBlock(this),
        mineAttempts: 0, // Not used as data, only for mining statistics
    
        // Set the previous hash and recalculate the block hash.
        setPrevHash: function(prev) {
            this.prevHash = prev;
            return this.reHash(this);
        },
        // Set the data and recalculate the block hash.
        // OPTIONAL: Add checks here to verify the structure of the data.
        //           Right now there are no requirements for the data.
        setData: function(data) {
            this.data = data;
            return this.reHash(this);
        },
        // Set the nonce and recalculate the block hash.
        setNonce: function(nonce) {
            this.nonce = nonce;
            return this.reHash(this);
        },
        // Recacluate the hash for this block using the current data.
        reHash: function() {
            // calculate a SHA256 hash of the contents of the block
            this.hash = BlockChainHelper.hashBlock(this);
            return this;
        },
        // Return an exact copy of this block.
        clone: function() {
            var c = new Block(this.index, this.prevHash, this.data);
            c.nonce = this.nonce;
            c.hash = this.hash;
            c.mineAttempts = this.mineAttempts;
            return c;
        }
    };
}

// The blockchain is the class that holds all the blocks in the chain andmakes
// it possible to append new blocks to the chain using a Proof Of Work concept.
// The new blocks are checked and mined before they can be added to the chain
// to keep the chain consistent. Later alterations can be detected by checking
// the blocks hashes and references to previous blocks.
// The genesis block has a previous hash of all zeros (64).
function BlockChain() {
    return {
        blocks: [],

        // Checks the block for next in chain and integrity.
        checkBlock: function(block) {
            // Check index of new block
            if (this.blocks.length !== block.index) return false;
            // Check last block hash is prev hash on new block
            if (this.blocks.length === 0 && block.prevHash != "0".repeat(64)) return false;
            if (this.blocks.length > 0 && block.prevHash != this.lastHash()) return false;

            // TODO: Check integrety by validating the signature of the data
            //       (not yet implemented in this blockchain)

            return true;
        },

        // Submit a new block to be added to the chain. This should set miners
        // to work and the first miner that generates a valid hash should post
        // the block back with the addBlock procedure.
        submitBlock: function(block) {
            // First do block checks
            if (!this.checkBlock(block)) return false;

            // TODO: distribute block to miners
            return this.addBlock(BlockChainHelper.mine(block));
        },

        // Add a new block to the blockchain. Before allowing the new block to 
        // the chain do checks to see if the block is intended as next block 
        // and to verify the contents.
        addBlock: function(block) {
    
            // First do block checks
            if (!this.checkBlock(block)) return false;
            // Check the hash for the new block, does the has match the hash
            // of the block header and then check if the hash is made with the
            // right difficulty(mined)
            if (!BlockChainHelper.checkHash(block)) return false;
    
            // All checks passed, push the block in the chain.
            this.blocks.push(block);
            return true;
        },

        // Return the index for the next block to be added. Use this value for
        // the new block that will be added to the chain. The index of a new
        // block is checked before adding it to the chain.
        nextIndex: function() {
            return this.blocks.length;
        },

        // Return the hash of the last block in the chain. Use this value for
        // the new block that will be added to the chain. The previous hash of
        // a new block is checked before adding it to the chain. This value is 
        // also part of the data that is hashed in the new block.
        lastHash: function() {
            return this.blocks.length > 0 
                ? this.blocks[this.blocks.length-1].hash 
                : undefined;
        },

        // Return an exact copy of this blockchain. Use it to quickly create a
        // new full node.
        clone: function() {
            var bc = new BlockChain();
            // Copy all the blocks to the new chain. Use clones of the blocks
            // to be sure to have new instances.
            this.blocks.forEach(block => bc.blocks.push(block.clone()));

            return bc;
        }
    };
}

// The blockchainhelper is a constant class (static) that can be used to create
// and verify block hashes or to mine a nonce for a block that must be placed 
// in the blockchain.
const BlockChainHelper = (function() {
    var difficulty = 3, // number of zeros required at front of hash (hexadecimal presentation)
        hashStart = "0".repeat(difficulty),
        // Set minePredictable to true to be able to regenerate the same nonce
        // when you remine the block. When minePredictable is false, a random
        // generator will solve the problem and it will be hard to get the same 
        // nonce that will solve the difficulty the second time the block is 
        // mined.
        minePredictable = false, 

        // Creates a hex string presentation for the number padded with zeros at the 
        // start.
        numberToHex = function(d, padding) {
            return Number(d).toString(16).padStart(padding || 8, '0');// Standard represent 32 bit numbers
        };

    return {
        // Function to generate the hash value for a block. The hash is returned as a
        // hex string from the calculated hash.
        hashBlock: function(block) {
            // Caclulate the hash over the index, prevHash, data and nonce values. 
            // To prevent same hashes when the data changes in size all the parts
            // in the hashing value are made with a static length. Numbers are 
            // converted to a hex presentation padded with 0 and the data is hashed
            // before inserting in the value.
            return CryptoJS.SHA256(numberToHex(block.index) + block.prevHash + CryptoJS.SHA256(block.data) + numberToHex(block.nonce)).toString(CryptoJS.enc.Hex);
        },

        checkHash: function(block) {
            return (BlockChainHelper.hashBlock(block) == block.hash
                && block.hash.startsWith(hashStart)
                );
        },

        // Mine for a hash which starts with the number of leading zero's in hex 
        // presentation. The number of leading zero's is set in the difficulty 
        // variable.
        mine: function(block) {
            var attempt = 0,
                maxAttempts = 500000;

            // Use current setting for difficulty
            hashStart = "0".repeat(difficulty);
            
            if (minePredictable) {
                // Set nonce to zero and add 1 on every step. In this predictable
                // way the solution to the mining problem will result in the same 
                // nonce every time the same block is mined. 
                block.setNonce(0);
                while (++attempt < maxAttempts) {
                    if (BlockChainHelper.checkHash(block.setNonce(block.nonce+1))) break;
                }
            } else {
                // This is the crypto random implementation that should be able to
                // solve the nonce problem. It is an unpredictable way to find a 
                // valid nonce with the stated difficulty. Every time the block is
                // mined will result in a different nonce.
                var nonce = new Uint32Array(1);
                while (++attempt < maxAttempts) {
                    window.crypto.getRandomValues(nonce);
                    if (BlockChainHelper.checkHash(block.setNonce(nonce[0]))) break;
                }
            }

            // Save mining statistics
            block.mineAttempts = attempt;

            return block;
        }
    };
})();