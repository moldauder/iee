<?php
/**
 * 添加淘客头部输出
 *
 * http://open.taobao.com/doc/detail.htm?spm=0.0.0.0.4geeSZ&id=101617#s2
 */
function headerTaoke(){
    $config = require 'common/config.php';
    $config = $config['taoke'];
    if(!$config){ return; }

    $app_key = $config['appKey'];
    $secret = $config['appSecret'];

    $timestamp=time() . '000';
    $message = $secret . 'app_key' . $app_key . 'timestamp' . $timestamp . $secret;
    $mysign = strtoupper(hash_hmac('md5', $message, $secret));
    setcookie('timestamp', $timestamp);
    setcookie('sign', $mysign);
}

headerTaoke();
require 'tinyphp/tinyphp.php';
