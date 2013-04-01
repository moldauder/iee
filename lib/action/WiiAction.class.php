<?php
/**
 * 用于客户端发起访问到浏览器，异步执行一些任务
 */
class WiiAction extends Action{

    private $db;
    private $douban;
    private $access_token;

    public function _empty(){
    }

    /**
     * 发送doumail
     */
    public function doumail(){
        $cache = $this->readDoubanCache();

        //还不在有效时间里，这个时间去拉些用户吧
        if($cache['availtime'] && $cache['availtime'] > time()){
            $this->fetchDoubanUser();
            return;
        }

        $cache['availtime'] = false;
        $this->writeDoubanCache($cache);

        //获取待接收豆邮的用户列表
        $db = $this->getDBConntention();

        //获取当前要发送的活动
        $act = $db->table('^doumail_act')->where('selected', 'y')->selectOne();
        if(!$act){
            exit;
        }

        $list = $db->query('select user_uid, user_name from tp_doumail_users where user_uid not in (select user_uid from tp_doumail_posts where act=' . $act->id . ') limit 2');
        if(count($list)){
            $this->sendDoumail($act, $list);
        }else{
            $this->fetchDoubanUser();
        }
    }

    /**
     * 获取用户
     *
     * 从线上活动中拉取参加用户
     * 为了能有效抓取用户，采取以下策略：
     * 1、每次抓取到的活动保存到数据库中
     * 2、设定当前在遍历的活动
     */
    public function fetchDoubanUser(){
        $curOnline = $this->getCurDoubanOnline();

        if(!$curOnline){
            $this->fetchDoubanOnline();
            return;
        }

        //接取活动的参加者
        $participant = $this->getDoubanInst()->get('/v2/online/' . $curOnline->id . '/participants', array(
            'start' => $curOnline->start,
            'count' => 20
        ));

        foreach($participant->users as $user){
            $this->addDoubanUser($user->uid, $user->name);
        }

        $data = array(
            'start' => $participant->count + $participant->start
        );

        //返回的数量不足20个，则说明当前活动的参与者信息已经全部抓取完成
        if($participant->count < 20){
            $data['finished'] = 'y';
        }

        $this->updateCurOnline($curOnline->id, $data);
    }

    /**
     * 发送豆邮
     */
    public function sendDoumail($act, $list){
        $db = $this->getDBConntention();
        $douban = $this->getDoubanInst();

        $actId   = $act->id;
        $search  = array('{nick}','{date}');
        $date    = date('Y年m月d日');
        $pubtime = date('Y-m-d H:i:s');
        $content = $act->content;
        $title   = $act->title;

        $err = 0;

        foreach($list as $vo){
            $replace = array(
                $vo->user_name,
                $date
            );

            $xml = '<?xml version="1.0" encoding="UTF-8"?>' .
                    '   <entry xmlns="http://www.w3.org/2005/Atom" xmlns:db="http://www.douban.com/xmlns/" xmlns:gd="http://schemas.google.com/g/2005" xmlns:opensearch="http://a9.com/-/spec/opensearchrss/1.0/">' .
                    '   <db:entity name="receiver"><uri>http://api.douban.com/people/' . $vo->user_uid . '</uri></db:entity>' .
                    '   <content>' . str_replace($search, $replace, $content) . '</content>' .
                    '   <title>' . str_replace($search, $replace, $title) . '</title>' .
                    $captcha .
                '</entry>';

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://api.douban.com/doumails');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            curl_setopt($ch, CURLOPT_HEADER, 0);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Authorization: Bearer ' . $this->access_token,
                'Content-Length: ' . strlen($xml),
                'Content-Type: application/atom+xml'
            ));
            curl_setopt($ch, CURLOPT_POSTFIELDS, $xml);

            $result = curl_exec($ch);
            curl_close($ch);

            if('ok' === $result){ //发送成功
                $db->table('^doumail_posts')->data(array(
                    'act'      => $actId,
                    'user_uid' => $vo->user_uid,
                    'pubtime'  => $pubtime
                ))->add();

                $db->query('update tp_doumail_act set amount=amount+1 where id=' . $actId);
            }else{
                //发送失败，意味着需要输入验证码等，延长下次豆邮发送时间在15分钟后
                Logger::record('send doumail failed', Logger::ERR);
                $this->writeDoubanCache(array(
                    'availtime' => time() + 900
                ));

                $err++;
            }
        }

        return 0 === $err;
    }

    /**
     * 保存豆瓣用户到数据库中
     */
    private function addDoubanUser($uid, $name){
        $db = $this->getDBConntention();

        if($db->table('^doumail_users')->where('user_uid', $uid)->selectOne()){
            return;
        }

        $db->table('^doumail_users')
           ->data(array(
               'user_uid' => $uid,
               'user_name' => $name
           ))
           ->add();
    }

    /**
     * 获取当前正在进行抓取的活动
     */
    private function getCurDoubanOnline(){
        return $this->getDBConntention()->table('^doumail_onlines')->where('finished', 'n')->selectOne();
    }

    /**
     * 更新当前活动信息
     */
    private function updateCurOnline($id, $data){
        $this->getDBConntention()->table('^doumail_onlines')
            ->data($data)
            ->where('id', $id)
            ->save();
    }

    /**
     * 抓取豆瓣线上活动
     */
    private function fetchDoubanOnline(){
        $douban = $this->getDoubanInst();
        $result = $douban->get('/v2/onlines');
        $onlines = $result->onlines;

        if(is_array($onlines)){
            $db = $this->getDBConntention();

            foreach($onlines as $online){
                if($db->table('^doumail_onlines')->where('id', $online->id)->selectOne()){
                    continue;
                }

                $db->table('^doumail_onlines')
                   ->data(array(
                       'id' => $online->id,
                       'finished' => 'n',
                       'start' => 0
                   ))
                   ->add();
            }
        }
    }

    /**
     * 获取豆瓣的缓存
     */
    private function readDoubanCache(){
        $file = APP_PATH . 'content/douban';
        if(is_file($file)){
            return unserialize(file_get_contents($file));
        }
        return array();
    }

    /**
     * 写入豆瓣缓存
     */
    private function writeDoubanCache($data){
        $cur = $this->readDoubanCache();

        $fp = fopen(APP_PATH . 'content/douban', 'w');
        if($fp){
            fwrite($fp, serialize(array_merge($cur, $data)));
            fclose($fp);
        }else{
            Logger::record('can not open content/douban cache file', Logger::ERR);
        }
    }

    /**
     * 获取豆瓣实例
     */
    private function getDoubanInst(){
        if(!$this->douban){
            $db = $this->getDBConntention();
            //随机取出一个access_token
            //考虑到数据量少，直接全部取出，然后从里面随机拿一条
            $auths = $db->table('^doumail_auth')->where("expire>'" . date('Y-m-d H:i:s') . "'")->select();
            $count = count($auths);

            if(0 === $count){
                exit;
            }

            $auth = $auths[rand(0, $count - 1)];
            $this->access_token = $auth->access_token;

            System::importVendor('Douban');
            $this->douban = new Douban(System::config('doumail'));
            $this->douban->args('access_token', $this->access_token);
        }

        return $this->douban;
    }

    private function getDBConntention(){
        if(!$this->db){
            $this->db = Db::getInstance();
        }
        return $this->db;
    }

}
