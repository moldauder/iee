<?php
class DoumailBiz extends Biz{

    /**
     * 查找全部的活动
     */
    public function findActs(){
        $db = $this->getDBConnection();

        $db->table('^doumail_act');
        return $db->select();
    }

    /**
     * 根据id获取活动信息
     */
    public function getActById($id){
        return $this->getDBConnection()->table('^doumail_act')->where('id', $id)->selectOne();
    }

    /**
     * 保存豆邮活动
     */
    public function addAct($data){
        $db = $this->getDBConnection();
        if($db->table('^doumail_act')->where('^doumail_act')->data($data)->add()){
            return $db->getLastInsID();
        }

        return null;
    }

    public function updateAct($id, $data){
        return $this->getDBConnection()->table('^doumail_act')->data($data)->where('id', $id)->save();
    }

    /**
     * 找到全部用户
     */
    public function findAuths(){
        $db = $this->getDBConnection();
        $db->table('^doumail_auth auth')
           ->field('auth.*, user.nick')
           ->join('^users user on user.id=auth.uid');
        return $db->select();
    }

    /**
     * 获取当前认证用户信息
     */
    public function getCurAuth(){
        return $this->getDBConnection()
            ->table('^doumail_auth')
            ->where('uid', USERID)
            ->selectOne();
    }

}
