<?php
/**
 * base on douban v2 api, with oatuth2
 */
class DoumailAction extends AuthAction{

    private $authURL = 'https://www.douban.com/service/auth2/';
    private $apiURL = 'https://api.douban.com/v2/';

    public function _empty(){
    }


    /**
     * 显示豆瓣授权页面
     */
    public function authorization(){
        $this->display('authorization');
    }

    /**
     * 处理豆瓣回传的授权响应，接受code参数
     */
    private function handleAuth(){
        $error = $_GET['error'];
        if($error){
        }

        $code = $_GET['code'];
        if($code){
            //try to get access_token
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $this->authURL . 'token');
            curl_setopt($ch, CURLOPT_POST, true);
        }
    }
}
