/*
 * Javascript Blockchain
 * 
 * Created on: Sep 6, 2018
 * Author: C.Karreman
 */

var difficulty = 3; // number of zeros required at front of hash
var hashStart = "0".repeat(difficulty);

function Block(index, data, prevHash) {
    return {
        index: index,
        prevHash: prevHash || "0".repeat(64),
        data: data || "",
        nonce: 0,
        hash: hashBlock(this),
    
        setPrevHash: function(prev) {
            this.prevHash = prev;
            this.reHash(this);
        },
        setData: function(data) {
            this.data = data;
            this.reHash(this);
        },
        setNonce: function(nonce) {
            this.nonce = nonce;
            this.reHash(this);
        },
        reHash: function() {
            // calculate a SHA256 hash of the contents of the block
            this.hash = hashBlock(this);
        }
    };
}

function BlockChain() {
    return {
        blocks: [],

        // Add a new block to the blockchain. Before allowing the new block to 
        // the chain do checks to see if the block is intended as next block 
        // and to verify the contents.
        addBlock: function(block) {
    
            // Check last block hash is prev hash on new block
            if (this.blocks.length === 0 && block.prevHash != 0) return false;
            if (this.blocks.length > 0 && block.prevHash != this.blocks[this.blocks.length-1].hash) return false;
            // Check the hash for the new block
            if (hashBlock(block) != block.hash) return false;
            // Check if the hash is made with the right difficulty(mined)
            if (!checkHash(block)) return false;
    
            // All checks passed, push the blcok in the chain.
            this.blocks.push(block);
            return true;
        }, 
        nextIndex: function() {
            return this.blocks.length;
        },
        lastHash: function() {
            return this.blocks.length > 0 ? this.blocks[this.blocks.length-1].hash : undefined;
        }
    };
}

// Creates a hex string presentation for the number padded with zeros at the 
// start.
function numberToHex(d, padding) {
    return Number(d).toString(16).padStart(padding || 8, '0');// Standard represent 32 bit numbers
}

// Function to generate the hash value for a block. The hash is returned as a
// hex string from the calculated hash.
const hashBlock = function(block) {
    // Caclulate the hash over the index, prevHash, data and nonce values. 
    // To prevent same hashes when the data changes in size all the parts
    // in the hashing value are made with a static length. Numbers are 
    // converted to a hex presentation padded with 0 and the data is hashed
    // before inserting in the value.
    return CryptoJS.SHA256(numberToHex(block.index) + block.prevHash + CryptoJS.SHA256(block.data) + numberToHex(block.nonce)).toString(CryptoJS.enc.Hex);
}

const checkHash = function(block) {
    return block.hash.startsWith(hashStart);
}

const mine = function(block) {
    block.setNonce(0);
    while (!checkHash(block)) {
        block.setNonce(block.nonce+1);
    }
    return block;
}
