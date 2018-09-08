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
                            <button class="new-block">New block</button>\
                            <div class="chain-view">\
                                <ul class="chain"></ul>\
                            </div>\
                        </div>');
                    // Add chain DOM to parent
                    chainDOM.data('index', index).appendTo(parent);

                    // Assign events
                    chainDOM.find('button.new-block').click(newBlock);
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
                blockDOM.find('textarea[name="data"]').val(block.data);
                blockDOM.find('input[name="nonce"]').val(block.nonce);
                blockDOM.find('span.mineStats').text(block.mineAttempts+' attempts');
                blockDOM.find('input[name="prev"]').val(block.prevHash);
                // And show the hash and validation result
                showBlockState(block, blockDOM);
                preventChangeEvent--;
            },
            showBlockState = function(block, blockDOM) {
                preventChangeEvent++;
                blockDOM.find('input[name="hash"]').val(block.hash);
                if (BlockChainHelper.checkHash(block)) {
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
                    // First upfate the prev
                    blockchain.blocks[i].setPrevHash(block.hash);
                    // then set the current index as previous block
                    block = blockchain.blocks[i];
                    showBlockValues(block, parent.find('.blockitem.index_'+i));
                }
            },
            
            // Returns the blockchain node for the DOM element.
            getBlockChain = function(elem) {
                var chainDOM = $(elem).closest('.chain-div'),
                    chainIndex = chainDOM.data('index');

                return chainNodes[chainIndex];
            },
            // Create a new block and add is to the chain.
            newBlock = function(e) {
                // Create a new block using the values from the last block in the blockchain.
                var bc = getBlockChain(e.target),
                    chainDOM = $(e.target).closest('.chain-div'),
                    newBlock = new Block(bc.blocks.length, bc.lastHash());
                // And mine the hash to get a valid Proof Of Work.
                BlockChainHelper.mine(newBlock);
                // When mining is done we can add the block to the blockchain.
                bc.submitBlock(newBlock);
                // And create the DOM for the new block
                createBlocksDOM(chainDOM, bc);
            },

            // Set the current values from the editors in the block. Calls refreshHash
            // to show the effects of changes in the block data.
            updateBlock = function(ev) {
                if (preventChangeEvent != 0) return;

                // First find the right block and chain-index of the block
                var blockDOM = $(ev.target).closest('li'),
                    idx = blockDOM.data('index'),
                    bc = getBlockChain(blockDOM),
                    block = bc.blocks[idx];

                // With generating new hash for the block
                //block.setData(blockDOM.find('textarea[name="data"]').val());
                //block.setNonce(blockDOM.find('input[name="nonce"]').val());
                // Without generating new hash for the block.
                block.data = blockDOM.find('textarea[name="data"]').val();
                block.nonce = blockDOM.find('input[name="nonce"]').val();

                refreshBlockState(bc, idx, blockDOM);
            },
            
            // Manually trigger the rehash for the block. Calls refreshHash to show
            // the effects of changes in the block data.
            hashBlock = function(ev) {
                // First find the right block and chain-index of the block
                var blockDOM = $(ev.target).closest('li'),
                    idx = blockDOM.data('index'),
                    bc = getBlockChain(blockDOM);
                block = bc.blocks[idx];
                // Call rehash
                block.reHash();
                // Show the result nonce
                preventChangeEvent++;
                blockDOM.find('input[name="nonce"]').val(block.nonce);
                blockDOM.find('span.mineStats').text(block.mineAttempts+' attempts');
                preventChangeEvent--;
                // And update block states
                refreshBlockState(bc, idx, blockDOM);
            },
            
            // Manually trigger the mining for the block. Calls refreshHash to show
            // the effects of changes in the block data.
            mineBlock = function(ev) {
                // First find the right block and chain-index of the block
                var blockDOM = $(ev.target).closest('li'),
                    idx = blockDOM.data('index'),
                    bc = getBlockChain(blockDOM);
                block = bc.blocks[idx];
                // Start the mining
                BlockChainHelper.mine(block);
                // Show the result nonce
                preventChangeEvent++;
                blockDOM.find('input[name="nonce"]').val(block.nonce);
                blockDOM.find('span.mineStats').text(block.mineAttempts+' attempts');
                preventChangeEvent--;
                // And update block states
                refreshBlockState(bc, idx, blockDOM);
            };
            
        return {
            init: function() {
                // Create an initial BlockChain and add some blocks
                var bc = new BlockChain();
                // Initialize a few blocks
                bc.submitBlock(new Block(bc.nextIndex(), bc.lastHash(), "test"));
                bc.submitBlock(new Block(bc.nextIndex(), bc.lastHash(), "the"));
                bc.submitBlock(new Block(bc.nextIndex(), bc.lastHash(), "blockchain"));
                // Failing blocks
                bc.submitBlock(new Block(100, bc.lastHash(), "failed wrong index"));
                bc.submitBlock(new Block(bc.nextIndex(), null, "failed wrong last hash"));
                bc.addBlock(new Block(bc.nextIndex(), bc.lastHash(), "failed wrong hash difficulty").reHash());
                var changedBlock = BlockChainHelper.mine(new Block(bc.nextIndex(), bc.lastHash(), "Original data"));
                changedBlock.data = "Something else";
                bc.addBlock(changedBlock);

                chainNodes.push(bc);
                chainNodes.push(bc.clone());

                // Create the demo element where all the chains will be shown
                $(document.body).append($('<div class="chainDemo"></div>'));

                chainNodes.forEach(function(bc) { 
                    createChainDOM($('.chainDemo'), bc); 
                });
            }
        };
    })();


    // Init script
    $(document)
        .ready(function(){
            $.demo.init();
        });
})(jQuery);
