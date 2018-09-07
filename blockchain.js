var difficulty = 3; // number of zeros required at front of hash
var hashStart = "0".repeat(difficulty);

function Block(index, data, prevHash) {
    this.index = index;
    this.prevHash = prevHash || "0".repeat(64);
    this.data = data || "";
    this.nonce = 0;
    this.hash = "";

    this.setPrevHash = function(prev) {
        this.prevHash = prev;
        this.reHash(this);
    }
    this.setData = function(data) {
        this.data = data;
        this.reHash(this);
    }
    this.setNonce = function(nonce) {
        this.nonce = nonce;
        this.reHash(this);
    }
    this.reHash = function() {
        // calculate a SHA256 hash of the contents of the block
        this.hash = hashBlock(this);
    }
    
    this.reHash(this);
}

function BlockChain() {
    this.blocks = [];

    this.addBlock = function(block) {
        // Do checks before allowing the new block in the chain

        // Check last block hash is prev hash on new block
        if (this.blocks.length > 0 && block.prevHash != this.blocks[this.blocks.length-1].hash) return false;
        // Check the hash for the new block
        if (hashBlock(block) != block.hash) return false;
        // Check if the hash is made with the right difficulty(mined)
        if (!checkHash(block)) return false;

        this.blocks.push(block);
        return true;
    }

    this.lastHash = function() {
        return this.blocks.length > 0 ? this.blocks[this.blocks.length-1].hash : undefined;
    }
}

function hashBlock(block) {
    return CryptoJS.SHA256(block.index + block.prevHash + block.data + block.nonce).toString(CryptoJS.enc.Hex);
}

function checkHash(block) {
    return block.hash.startsWith(hashStart);
}

function mine(block) {
    block.setNonce(0);
    while (!checkHash(block)) {
        block.setNonce(block.nonce+1);
    }
    return block;
}
