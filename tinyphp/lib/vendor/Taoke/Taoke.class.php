<?php
class Taoke{

    private $config;

    /**
     * 初始化
     */
    public function __construct($config = array()){
        $this->config = $config;
    }

    /**
     * 获取商品信息
     *
     * 返回price、onsale、buylink、detail_url、title、pic_url
     */
    public function getItem($item_id){
        //先按照淘宝客去查询
        $result = $this->getTaobaokItem($item_id);

        if(false !== $result){
            return $result;
        }

        $params = $this->createParam(array(
            'method' => 'taobao.item.get',
            'fields' => 'num_iid,price,approve_status,pic_url,title,detail_url',
            'num_iid' => $item_id
        ));

        $data = $this->sendRequest($params);
        $error = $data['error_response'];

        if($error){
            Logger::record('Taoke.getItem error, item_id=' . $item_id . ', msg=' . $error['msg'] . ', sub_code=' . $error['sub_code'], Logger::ERR);
        }else{
            $data = $data['item_get_response']['item'];

            return array(
                'price'      => $data['price'],
                'price_unit' => 'rmb',
                'onsale'     => 'instock' === $data['approve_status'] ? 'n' : 'y',
                'detail_url' => $data['detail_url'],
                'title'      => $data['title'],
                'pic_url'    => $data['pic_url']
            );
        }

        return false;
    }

    /**
     * 获取淘宝客商品信息
     *
     * 值查询单个商品
     */
    private function getTaobaokItem($item_id){
        $params = $this->createParam(array(
            'method' => 'taobao.taobaoke.items.detail.get ',
            'num_iids' => $item_id,
            'fields' => 'click_url,price,approve_status,detail_url,title,pic_url',
            'nick' => $this->config['userNick']
        ));

        $data = $this->sendRequest($params);
        $error = $data['error_response'];

        if($error){
            Logger::record('Taoke.getItem error, item_id=' . $item_id . ', msg=' . $error['msg'] . ', sub_code=' . $error['sub_code'], Logger::ERR);
        }else{
            $data =  $data['taobaoke_items_detail_get_response']['taobaoke_item_details']['taobaoke_item_detail'];

            if($data){
                $data = $data[0];
                $itemData = $data['item'];

                return array(
                    'price'      => $itemData['price'],
                    'price_unit' => 'rmb',
                    'onsale'     => 'instock' === $itemData['approve_status'] ? 'n' : 'y',
                    'detail_url' => $itemData['detail_url'],
                    'title'      => $itemData['title'],
                    'pic_url'    => $itemData['pic_url'],
                    'buylink'    => $data['click_url']
                );
            }
        }

        return false;
    }


    //创建请求所需用到的参数
    private function createParam($params){
        $baseArr = array(
            'v' => '2.0',
            'sign_method' => 'md5',
            'timestamp' => date('Y-m-d H:i:s'),
            'format' => 'json',
            'app_key' => $this->config['appKey']
        );

        $params = array_merge($params, $baseArr);
        ksort($params);

        return $params;
    }

    //发送请求
    private function sendRequest($params){
        $strParam = '?';

        foreach($params as $key => $val){
            if($key !== '' && $val !==''){
                $strParam .= $key . '=' . urlencode($val) . '&';
            }
        }

        $url = $this->config['url'] . $strParam . 'sign=' . $this->createSign($params);

        $ch = curl_init();
        curl_setopt ($ch, CURLOPT_URL, $url);
        curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
        $result = curl_exec($ch);
        curl_close($ch);

        return json_decode($result, true);
    }

    private function createSign($params){
        $sign = '';

        foreach($params as $key => $val){
            if($key !=='' && $val !==''){
                $sign .= $key . $val;
            }
        }

        $appSecret = $this->config['appSecret'];
        $sign = strtoupper(md5($appSecret . $sign . $appSecret));
        return $sign;
    }
}
