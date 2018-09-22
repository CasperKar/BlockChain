/*
 * Blockchain demo
 * 
 * Creates a blockchain node and dosplays it in the current html page.
 * 
 * Created on: Sep 7, 2018
 * Author: C.Karreman (0931371)
 * 
 * Requires: jQuery v2.1.4, blockchain v0.2
 */
;(function($) {

    $.demo = (function() {

        var chainNodes = [],
            preventChangeEvent = 0,
            createChainDOM = function(parent, blockchain) {
                var index = chainNodes.indexOf(blockchain),
                    chainDOM = $('#chain'+index);

                if (chainDOM.length === 0) {
                    // create html DOM
                    chainDOM = $('\
                        <div id="chain'+index+'" class="chain-div">\
                            <h2>Node '+index+'</h2>\
                            <div class="chain-actions">\
                                <button class="new-block">New block</button>\
                                <button class="dist-blocks">Distribute blocks</button>\
                            </div>\
                            <div class="chain-view">\
                                <ul class="chain"></ul>\
                            </div>\
                        </div>');
                    // Add chain DOM to parent
                    chainDOM.data('index', index).appendTo(parent);

                    // Assign events
                    chainDOM.find('button.new-block').click(newBlock);
                    chainDOM.find('button.dist-blocks').click(distributeChain);
                }

                // And create the chain nodes
                createBlocksDOM(chainDOM, blockchain)
            
                return chainDOM;
            },
            createBlocksDOM = function(chainDOM, blockchain) {
                // Prepare the width of the parent so we can stack all the blocks horizontal
                var parent = chainDOM.find('ul.chain');
                $(parent).width(blockchain.blocks.length * 440);
                // Walk the blocks and create a DOM for each block when it does not yet exists
                $(blockchain.blocks).each(function(i, block) {
                    var blockDOM = $(parent).find('li.blockitem.index_'+i);
                    
                    if (blockDOM.length === 0) {
                        // Create html 
                        blockDOM = $('\
                            <li class="blockitem index_'+i+'">\
                                <div class="block">\
                                    <h3>Block '+block.index+'</h3>\
                                    <div class="input-row">\
                                        <label>Data:</label>\
                                        <textarea name="data" rows="5"></textarea>\
                                    </div>\
                                    <div class="input-row">\
                                        <label>Nonce:</label>\
                                        <input name="nonce" type="number">\
                                        <span class="mineStats"></span>\
                                    </div>\
                                    <div class="input-row">\
                                        <label>Prev:</label>\
                                        <input name="prev" type="text" disabled="disabled">\
                                    </div>\
                                    <div class="input-row">\
                                        <label>Hash:</label>\
                                        <input name="hash" type="text" disabled="disabled">\
                                    </div>\
                                    <div class="input-row">\
                                    <input name="rehash" type="button" value="Hash">\
                                    <input name="mine" type="button" value="Mine">\
                                    </div>\
                                </div>\
                            </li>');
                        blockDOM.data('index', i).appendTo(parent);

                        // And add events
                        blockDOM.find('textarea[name=data]').keyup(updateBlock);
                        blockDOM.find('input[name=nonce]').change(updateBlock);
                        blockDOM.find('input[name=rehash]').click(hashBlock);
                        blockDOM.find('input[name=mine]').click(mineBlock);
                    }
                    
                    showBlockValues(block, blockDOM);
                });
            },
            showBlockValues = function(block, blockDOM) {
                preventChangeEvent++;
                try {
                    blockDOM.find('textarea[name="data"]').val(block.data);
                    blockDOM.find('input[name="nonce"]').val(block.nonce);
                    blockDOM.find('span.mineStats').text(block.mineAttempts+' attempts');
                    blockDOM.find('input[name="prev"]').val(block.prevHash);
                    // And show the hash and validation result
                    showBlockState(block, blockDOM);
                }
                finally {
                    preventChangeEvent--;
                }
            },
            showBlockState = function(block, blockDOM) {
                preventChangeEvent++;
                blockDOM.find('input[name="hash"]').val(block.hash);
                if (BlockchainHelper.checkMerkleRoot(block) && 
                    BlockchainHelper.checkHash(block)) {
                    blockDOM.removeClass('error').addClass('correct');
                } else {
                    blockDOM.removeClass('correct').addClass('error');
                }
                preventChangeEvent--;
            },
            // Call when changes are made in the block, this reflects the state
            // of the block and updates all the chained hashes.
            refreshBlockState = function(blockchain, idx, blockDOM) {
                var block = blockchain.blocks[idx];
                // First show the hash and validation result
                showBlockState(block, blockDOM);
            
                // Then walk all following blocks to update their state
                var parent = blockDOM.closest('ul');
                for (i = idx+1; i < blockchain.blocks.length; i++) {
                    // Update the previous hash and remember the current block
                    // for the next step.
                    block = blockchain.blocks[i].setPrevHash(block.hash);
                    showBlockValues(block, parent.find('.blockitem.index_'+i));
                }
            },

            // Change event for the blockchain
            blockchainChanged = function(blockchain, idx) {
                var nodeId = chainNodes.indexOf(blockchain),
                    chainDOM = $('#chain'+nodeId);

                // And create the DOM for the new block
                createBlocksDOM(chainDOM, blockchain);

                // Now skip distribution when preventchanges is set
                if (preventChangeEvent != 0) return;

                // And delayed distribute the new block, this way it looks real 
                // with local nodes.
                setTimeout(function() { distributeBlocks(blockchain, idx); }, 400);
            },

            distributeBlocks = function(blockchain, idx) {
                if (preventChangeEvent != 0) return;

                // Prevent event storm
                preventChangeEvent++;
                try {
                    var nodeId = chainNodes.indexOf(blockchain);

                    // Distribute to other Nodes
                    chainNodes.forEach(function(item, index) {
                        // Check not triggering node
                        if (index != nodeId) {
                            // Add blocks while new are still available
                            while(item.nextIndex() <= idx && idx < blockchain.nextIndex()) {
                                if (item.addBlock(blockchain.blocks[item.nextIndex()]) === false) {
                                    // Adding block failed, probably inconsistant data. 
                                    // Check the longest chain and flag the other bad.
                                    if (item.sumChain() < blockchain.sumChain()) {
                                        $('#chain'+index).addClass('bad');
                                    } else if (item.sumChain() > blockchain.sumChain()) {
                                        $('#chain'+nodeId).addClass('bad');
                                    }

                                    break;
                                }
                            }
                        }
                    });
                } 
                finally {
                    preventChangeEvent--;
                }
            },

            
            // Returns the blockchain node for the DOM element.
            getBlockchain = function(elem) {
                var chainDOM = $(elem).closest('.chain-div'),
                    chainIndex = chainDOM.data('index');

                return chainNodes[chainIndex];
            },

            // Create a new node and show it in the browser.
            addNode = function(ev) {
                var bc = new Blockchain();
                bc.changed = blockchainChanged;
                chainNodes.push(bc);
                createChainDOM($(ev.target).parent(), bc);
                // And call distribute to fill the blocks
                setTimeout(function() { distributeBlocks(chainNodes[0], chainNodes[0].nextIndex()-1); }, 400);
            }

            // Ask for the data to put in the block
            newBlock = function(ev) {
                var chainDOM = $(ev.target).closest('.chain-div'),
                    dataDialog = $('\
                    <div class="dialog overlay">\
                        <div class="blockitem block">\
                            <h3>New block</h3>\
                            <div class="input-row">\
                                <label>Data:</label>\
                                <textarea name="data" rows="5"></textarea>\
                            </div>\
                            <div class="input-row">\
                                <label>Distribute:</label>\
                                <input name="distribute" type="checkbox" checked="checked" value="1">\
                            </div>\
                            <div class="input-row center">\
                                <input name="cancel" type="button" value="Cancel">\
                                <input name="ok" type="button" value="OK">\
                            </div>\
                        </div>\
                    </div>\
                    ');

                dataDialog.appendTo(chainDOM);
                dataDialog.find('input[name="cancel"]').click(cancelBlock);
                dataDialog.find('input[name="ok"]').click(addBlock);
            },
            // Cancel the data request dialog
            cancelBlock = function(ev) {
                var chainDOM = $(ev.target).closest('.chain-div');
                chainDOM.find('.dialog.overlay').remove();
            },
            // Create a new block and add is to the chain.
            addBlock = function(ev) {
                // Create a new block using the values from the last block in the blockchain.
                var bc = getBlockchain(ev.target),
                    chainDOM = $(ev.target).closest('.chain-div'),
                    data = chainDOM.find('.dialog textarea[name="data"]').val(),
                    distribute = chainDOM.find('.dialog input[name="distribute"]').is(':checked'),
                    newBlock = new Block(bc.nextIndex(), bc.lastHash(), data);

                // Submit block to the blockchain, it will be mined and added to the chain.
                if (distribute) {
                    bc.submitBlock(newBlock);
                } else {
                    // Prevent handling the change event
                    preventChangeEvent++;
                    try {
                        bc.submitBlock(newBlock);
                    } 
                    finally {
                        preventChangeEvent--;
                    }
      
                }

                // Remove the dialog
                chainDOM.find('.dialog.overlay').remove();
            },

            // Set the current values from the editors in the block. Calls refreshHash
            // to show the effects of changes in the block data.
            updateBlock = function(ev) {
                if (preventChangeEvent != 0) return;

                // First find the right block and chain-index of the block
                var blockDOM = $(ev.target).closest('li'),
                    idx = blockDOM.data('index'),
                    bc = getBlockchain(blockDOM),
                    block = bc.blocks[idx];

                // With generating new hash for the block
                //block.setData(blockDOM.find('textarea[name="data"]').val());
                //block.setNonce(blockDOM.find('input[name="nonce"]').val());
                // Without generating new hash for the block.
                block.data = blockDOM.find('textarea[name="data"]').val();
                // And set the new merkle root
                block.merkleRoot = BlockchainHelper.merkleTree(block.data).root;
                block.nonce = blockDOM.find('input[name="nonce"]').val();

                refreshBlockState(bc, idx, blockDOM);
            },
            
            // Manually trigger the rehash for the block. Calls refreshHash to show
            // the effects of changes in the block data.
            hashBlock = function(ev) {
                // First find the right block and chain-index of the block
                var blockDOM = $(ev.target).closest('li'),
                    idx = blockDOM.data('index'),
                    bc = getBlockchain(blockDOM);
                block = bc.blocks[idx];
                // Call rehash
                block.reHash();
                // Show the result nonce
                preventChangeEvent++;
                try {
                    blockDOM.find('input[name="nonce"]').val(block.nonce);
                    blockDOM.find('span.mineStats').text(block.mineAttempts+' attempts');
                }
                finally {
                    preventChangeEvent--;
                }
                // And update block states
                refreshBlockState(bc, idx, blockDOM);
            },
            
            // Manually trigger the mining for the block. Calls refreshHash to show
            // the effects of changes in the block data.
            mineBlock = function(ev) {
                // First find the right block and chain-index of the block
                var blockDOM = $(ev.target).closest('li'),
                    idx = blockDOM.data('index'),
                    bc = getBlockchain(blockDOM);
                block = bc.blocks[idx];
                // Start the mining
                BlockchainHelper.mine(block);
                // Show the result nonce
                preventChangeEvent++;
                try {
                    blockDOM.find('input[name="nonce"]').val(block.nonce);
                    blockDOM.find('span.mineStats').text(block.mineAttempts+' attempts');
                }
                finally {
                    preventChangeEvent--;
                }
                // And update block states
                refreshBlockState(bc, idx, blockDOM);
            },
            
            // Manually trigger the distribution of the block in the chain.
            distributeChain = function(ev) {
                var bc = getBlockchain(ev.target);
                distributeBlocks(bc, bc.nextIndex()-1);
            };
            
        return {
            init: function() {
                // Create an initial Blockchain and add some blocks
                var bc = new Blockchain();
                // Initialize a few blocks
                bc.submitBlock(new Block(bc.nextIndex(), bc.lastHash(), "test"));
                bc.submitBlock(new Block(bc.nextIndex(), bc.lastHash(), "the"));
                bc.submitBlock(new Block(bc.nextIndex(), bc.lastHash(), "blockchain"));
                // Failing blocks
                bc.submitBlock("not an object");
                bc.submitBlock({data: "fake object", hash: "817f87314fe87fe1e91ef1ef9f8e"})
                bc.submitBlock(new Block(100, bc.lastHash(), "failed wrong index"));
                bc.submitBlock(new Block(bc.nextIndex(), null, "failed wrong last hash"));
                bc.addBlock(new Block(bc.nextIndex(), bc.lastHash(), "failed wrong hash difficulty").reHash());

                var changedBlock = BlockchainHelper.mine(new Block(bc.nextIndex(), bc.lastHash(), "Original data"));
                changedBlock.data = "Something else";
                bc.addBlock(changedBlock);

                chainNodes.push(bc);
                //chainNodes.push(bc.clone());

                // Create the demo element where all the chains will be shown
                $(document.body).append($('<div class="chainDemo"><button id="add-node">Add node</button></div>'));
                
                chainNodes.forEach(function(bc) { 
                    createChainDOM($('.chainDemo'), bc);
                    bc.changed = blockchainChanged;
                });

                $('#add-node').click(addNode);
            }
        };
    })();


    // Init script
    $(document)
        .ready(function(){
            $.demo.init();
        });
})(jQuery);
