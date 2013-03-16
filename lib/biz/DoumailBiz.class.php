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
        return $this->getDBConnection()->table('^doumail_act')->where('^doumail_act')->data($data)->where('id', $id)->save();
    }

}
