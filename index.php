<?php
/**
 * Author: C. Karreman
 * Date: 2021-03-05
 *
 * Title: Blockchain demo
 * Description: This is a very simple javascript blockchain and an interface in html to play around with the blocks and chains.
 */

// Include the bootstrap to generate the Page class
include_once($_SERVER['DOCUMENT_ROOT'].'/includes/bootstrap.php');
redirect_direct_request(__FILE__);

$_PAGE->AddLinkedScript('jquery.min.js');
$_PAGE->AddLinkedScript('sha256.js');
$_PAGE->AddLinkedScript('blockchain.js');
$_PAGE->AddLinkedScript('demo.js');
$_PAGE->AddLinkedFile('nested_demo.css')

?>

<div class="flexbox row">
    <div class="content-section fullwidth no-maxwidth">
        <h1><?php echo htmlentities($_PAGE->GetPageTitle()) ?></h1>
        <div id="chainDemo"></div>
        <div class="footer">
            &lt;&lt; <a href="/">Back home</a> &gt;&gt;
        </div>
    </div>
</div>
