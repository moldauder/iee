<?php
return array(
    '/^\d+\b/' => array('index', 'item', 'id'),     //item
    '/^author\b/' => array('index', 'author', '', 'username'),  //author
    '/^(query|about|foreverc)\b/' => array('index', '$1'),
);
