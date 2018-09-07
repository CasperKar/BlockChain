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
            return this.reHash(this);
        },
        setData: function(data) {
            this.data = data;
            return this.reHash(this);
        },
        setNonce: function(nonce) {
            this.nonce = nonce;
            return this.reHash(this);
        },
        reHash: function() {
            // calculate a SHA256 hash of the contents of the block
            this.hash = hashBlock(this);
            return this;
        },
        clone: function() {
            var c = new Block(this.index, this.data, this.prevHash);
            c.nonce = this.nonce;
            c.hash = this.hash;
            return c;
        }
    };
}

function BlockChain() {
    return {
        blocks: [],

        // Checks the block for next in chain and integrity.
        checkBlock: function(block) {
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
            return this.addBlock(mine(block));
        },

        // Add a new block to the blockchain. Before allowing the new block to 
        // the chain do checks to see if the block is intended as next block 
        // and to verify the contents.
        addBlock: function(block) {
    
            // First do block checks
            if (!this.checkBlock(block)) return false;
            // Check the hash for the new block
            if (hashBlock(block) != block.hash) return false;
            // Then check if the hash is made with the right difficulty(mined)
            if (!checkHash(block)) return false;
    
            // All checks passed, push the block in the chain.
            this.blocks.push(block);
            return true;
        }, 
        nextIndex: function() {
            return this.blocks.length;
        },
        lastHash: function() {
            return this.blocks.length > 0 ? this.blocks[this.blocks.length-1].hash : undefined;
        },
        clone: function() {
            var bc = new BlockChain();
            // Copy all the blocks
            for(i = 0; i < this.blocks.length; i++) {
                bc.blocks.push(this.blocks[i].clone());
            }
            return bc;
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

// Mine for a hash which starts with the number of leading zero's in hex 
// presentation. The number of leading zero's is set in the difficulty 
// variable.
const mine = function(block) {
    // Use current setting for difficulty
    hashStart = "0".repeat(difficulty);
    // Set nonce to zero and add 1 on every step. Should be done by a working
    // random number but that's hard in javascript and the math.random() does 
    // not solve the nonce problem in a reasonable time.
    block.setNonce(0);
    while (!checkHash(block)) {
        block.setNonce(block.nonce+1);
    }
    return block;
}
