<?php
/**
 * 微信图片本地化
 */ 
class WximgAction extends AuthAction{

    private $MIMES = array(
        'gif' => 'image/gif',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg'=> 'image/jpeg'
    );

    public function _empty(){
        if(strpos($_SERVER['HTTP_REFERER'], $_SERVER['HTTP_HOST']) === false){
            exit;
        }

        list($n, $filename) = System::$queryvars;
        if(!$filename){ return; }

        $filename = APP_PATH . 'wximg/' . $filename;

        $fmt = strtolower($_GET['wx_fmt']) || 'jpog';
        header('Content-Type: ' . $$this->MIMES[$fmt]);
        header('Cache-Control: max-age=315360000');

        if(file_exists($filename)){
            print file_get_contents($filename);
        }else{
            $url = $_SERVER['REQUEST_URI'];
            if(!$url){ exit; }
            $url = 'https://mmbiz.qlogo.cn/mmbiz/' . str_replace('/wximg/', '', $url);

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $content = curl_exec($ch);
            curl_close($ch);

            file_put_contents($filename, $content);
            print $content;
        }
    }
}
