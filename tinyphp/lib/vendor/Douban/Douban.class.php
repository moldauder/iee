<?php
/**
 * 豆瓣API接口操作封装
 *
 * 链式调用
 */
class Douban{

    private $args = array();
    private $info = array();    //请求后服务器返回的相关信息 即curl_getinfo返回结果

    /**
     * 构造函数
     *
     * @param {Array} $args
     * @param {String} $args['apikey']
     * @param {String} $args['callback'] 回调URL
     */
    public function __construct($args = array()){
        $this->args = $args;
    }

    /**
     * 设置或者获取参数
     */
    public function arg($name, $value){
        if($value){
            $this->args[$name] = $value;
        }
        return $this->args[$name];
    }

    /**
     * 授权用户授权
     */
    public function auth($params){
        $data = array(
            'client_id'     => $this->args['apikey'],
            'redirect_uri'  => $this->args['callback'],
            'response_type' => 'code',
            'scope'         => $params['scope']
        );

        header('Location: https://www.douban.com/service/auth2/auth?' . http_build_query($data));
    }

    /**
     * 处理auth的回调
     */
    public function handlerAuth(){
        $error = $_GET['error'];
        if($error){
            //@todo
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://www.douban.com/service/auth2/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, array(
            'client_id'     => $this->args['apikey'],
            'client_secret' => $this->args['secret'],
            'redirect_uri'  => $this->args['callback'],
            'grant_type'    => 'authorization_code',
            'code'          => $_GET['code']
        ));

        $result = json_decode(curl_exec($ch));
        curl_close($ch);

        $token = $result->access_token;

        if(!$token){
            //@todo
        }

        $this->args['access_token'] = $token;
        return $result;
    }


    public function __call($name, $arguments){
        $size = count($arguments);

        if(in_array($name, array('post', 'get')) && $size > 0){
            $this->args['method'] = $name;
            $this->args['url'] = $arguments[0];

            if($size > 1){
                $this->args['data'] = $arguments[1];
            }

            return $this->execute();
        }
    }

    public function info($opt){
        return array_key_exists($opt, $this->info) ? $this->info[$opt] : '';
    }

    /**
     * 执行curl请求
     */
    private function execute(){
        $url    = 'https://api.douban.com' . $this->args['url'];
        $data   = $this->args['data'];
        $method = $this->args['method'];

        $ch = curl_init();

        //设定URL
        if('get' === $method){
            if(count($data)){
                $url .= '?' . http_build_query($data);
            }
        }

        curl_setopt($ch, CURLOPT_URL, $url);

        if('post' === $method){
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $this->args['data']);
        }

        //加上header
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Authorization: Bearer ' . $this->args['access_token']
        ));

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $result =  json_decode(curl_exec($ch));
        $this->info = curl_getinfo($ch);

        curl_close($ch);
        return $result;
    }
}
