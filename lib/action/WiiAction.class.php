<?php
/**
 * 用于客户端发起访问到浏览器，异步执行一些任务
 */
class WiiAction extends Action{

    private $db;
    private $douban;
    private $access_token;

    public function _empty(){
        header('Cache-Control: max-age=0');

        $hour = intval(date('G'));
        if(2 < $hour && $hour < 7){ //2点到6点之间不发豆邮
            exit;
        }

        $this->doumail();
    }

    /**
     * 发送doumail
     */
    private function doumail(){
        //获取待接收豆邮的用户列表
        $db = $this->getDBConntention();

        //获取最后一次发布的时间点，如果是在五分钟内就不再发送了
        //假设5分钟发一次，每次发5封，一小时发60封，一天能发1000封左右
        $lastPost = $db->table('^doumail_posts')->order('id desc')->selectOne();
        if($lastPost && strtotime($lastPost->pubtime) - time() <  300){
            exit;
        }

        //获取当前要发送的活动
        $act = $db->table('^doumail_act')->where('selected', 'y')->selectOne();
        if(!$act){
            exit;
        }

        $list = $db->query('select user_uid, user_name from tp_doumail_users where user_uid not in (select user_uid from tp_doumail_posts where act=' . $act->id . ') limit 5');
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
     */
    private function fetchDoubanUser(){
        $douban = $this->getDoubanInst();
        $douban->args('access_token', $this->access_token);

        $result = $douban->get('/v2/onlines');
        $onlines = $result->onlines;

        if(is_array($onlines)){
            //随机取出一个活动
            $event = $onlines[rand(0, count($onlines) - 1)];

            //写入活动组织者
            $owner = $event->owner;
            $this->addDoubanUser($owner->uid, $owner->name);

            //接取活动的参加者
            $participant = $douban->get('/v2/online/' . $event->id . '/participants');
            foreach($participant->users as $user){
                $this->addDoubanUser($user->uid, $user->name);
            }
        }
    }

    /**
     * 发送豆邮
     */
    private function sendDoumail($act, $list){
        $db = $this->getDBConntention();
        $douban = $this->getDoubanInst();

        $actId   = $act->id;
        $search  = array('{nick}','{date}');
        $date    = date('Y年m月d日');
        $pubtime = date('Y-m-d H:i:s');
        $content = $act->content;
        $title   = $act->title;

        foreach($list as $vo){
            $replace = array(
                $vo->user_name,
                $date
            );

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://api.douban.com/doumails');
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

            $xml = '<?xml version="1.0" encoding="UTF-8"?>' .
                    '   <entry xmlns="http://www.w3.org/2005/Atom" xmlns:db="http://www.douban.com/xmlns/" xmlns:gd="http://schemas.google.com/g/2005" xmlns:opensearch="http://a9.com/-/spec/opensearchrss/1.0/">' .
                    '   <db:entity name="receiver"><uri>http://api.douban.com/people/' . $vo->user_uid . '</uri></db:entity>' .
                    '   <content>' . str_replace($search, $replace, $content) . '</content>' .
                    '   <title>' . str_replace($search, $replace, $title) . '</title>' .
                    $captcha .
                '</entry>';

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
            }
        }
    }

    //不需要判断用户是否存在，数据库机保证了唯一性
    private function addDoubanUser($uid, $name){
        $this->getDBConntention()
            ->table('^doumail_users')
            ->data(array(
                'user_uid' => $uid,
                'user_name' => $name
            ))
            ->add();
    }

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
