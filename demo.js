/*
 * Blockchain demo
 * 
 * Creates a blockchain node and dosplays it in the current html page.
 * 
 * Created on: Sep 7, 2018
 * Author: C.Karreman
 */
;(function($) {

    $.demo = (function() {

        var chainNodes = [],
            createChainDOM = function(parent, blockchain) {
                var index = chainNodes.indexOf(blockchain),
                    chainDOM = $('#chain'+index);

                if (chainDOM.length === 0) {
                    // create html DOM
                    chainDOM = $('\
                        <div id="chain'+index+'" class="chain-div">\
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
                                        <input name="nonce" type="text">\
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
                                        <input name="mine" type="button" value="Mine">\
                                    </div>\
                                </div>\
                            </li>');
                        blockDOM.data('index', i).appendTo(parent);

                        // And add events
                        blockDOM.find('input[name=nonce], textarea[name=data]').keyup(updateBlock);
                        blockDOM.find('input[name=mine]').click(mineBlock);
                    }
                    
                    showBlockValues(block, blockDOM);
                });
            },
            showBlockValues = function(block, blockDOM) {
                blockDOM.find('textarea[name="data"]').val(block.data);
                blockDOM.find('input[name="nonce"]').val(block.nonce);
                blockDOM.find('input[name="prev"]').val(block.prevHash);
                // And show the hash and validation result
                showBlockHash(block, blockDOM);
            },
            showBlockHash = function(block, blockDOM) {
                blockDOM.find('input[name="hash"]').val(block.hash);
                if (checkHash(block)) {
                    blockDOM.removeClass('error').addClass('correct');
                } else {
                    blockDOM.removeClass('correct').addClass('error');
                }
            },
            // Call when changes are made in the block, this reflects the state
            // of the block and updates all the chained hashes.
            refreshHash = function(blockchain, idx, blockDOM) {
                var block = blockchain.blocks[idx];
                // First show the hash and validation result
                showBlockHash(block, blockDOM);
            
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
            
            getBlockChain = function(elem) {
                var chainDOM = $(elem).closest('.chain-div'),
                    chainIndex = chainDOM.data('index');

                return chainNodes[chainIndex];
            },
            // Append a new block to the chain.
            newBlock = function(e) {
                // Create a new block using the values from the last block in the blockchain.
                var bc = getBlockChain(e.target),
                    chainDOM = $(e.target).closest('.chain-div'),
                    newBlock = new Block(bc.blocks.length, "", bc.lastHash());
                // And mine the hash to get a valid Proof Of Work.
                mine(newBlock);
                // When mining is done we can add the block to the blockchain.
                bc.addBlock(newBlock);
                // And create the DOM for the new block
                createBlocksDOM(chainDOM, bc);
            },

            // Set the current values from the editors in the block. Calls refreshHash
            // to show the effects of changes in the block data.
            updateBlock = function(ev) {
                // First find the right block and chain-index of the block
                var blockDOM = $(ev.target).closest('li'),
                    idx = blockDOM.data('index'),
                    bc = getBlockChain(blockDOM);
                block = bc.blocks[idx];
                block.setData(blockDOM.find('textarea[name="data"]').val());
                block.setNonce(blockDOM.find('input[name="nonce"]').val());
            
                refreshHash(bc, idx, blockDOM);
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
                mine(block);
                // Show the result nonce
                blockDOM.find('input[name="nonce"]').val(block.nonce);
                // And update block states
                refreshHash(bc, idx, blockDOM);
            };
            
      

        return {
            init: function() {
                // Create an initial BlockChain and add some blocks
                var bc = new BlockChain();
                // Initialize a few blocks
                bc.addBlock(mine(new Block(bc.nextIndex(), "test", bc.lastHash())));
                bc.addBlock(mine(new Block(bc.nextIndex(), "the", bc.lastHash())));
                bc.addBlock(mine(new Block(bc.nextIndex(), "blockchain", bc.lastHash())));
                // Failing adds
                bc.addBlock(mine(new Block(100, "failed wrong index")));
                bc.addBlock(mine(new Block(bc.nextIndex(), "failed wrong last hash")));
                bc.addBlock(new Block(bc.nextIndex(), "failed wrong hash difficulty", bc.lastHash()));
                var changedBlock = mine(new Block(bc.nextIndex(), "failed wrong hash difficulty", bc.lastHash()));
                changedBlock.data = "Something else";
                bc.addBlock(changedBlock);

                chainNodes.push(bc);

                // Create the demo element where all the chains will be shown
                $(document.body).append($('<div class="chainDemo"></div>'));

                $chain = createChainDOM($('.chainDemo'), bc);
            }
        };
    })();


    // Init script
    $(document)
        .ready(function(){
            $.demo.init();
        });
})(jQuery);
