<?php
class UserBiz extends Biz{

    private $tableName = '^users';

    /**
     * 查找全部的人员列表
     */
    public function getAllUser(){
        return $this->getDBConnection()->table($this->tableName)
            ->order('id desc')
            ->select();
    }

    /**
     * 获取人员信息
     */
    public function getUserById($id){
        return $this->getDBConnection()
            ->table($this->tableName)
            ->where('id', $id)
            ->selectOne();
    }

    public function getUserByNick($nick){
        return $this->getDBConnection()
            ->table($this->tableName)
            ->where('nick', $nick)
            ->selectOne();
    }

    public function getCurrentUser(){
        return USERID ? $this->getUserById(USERID) : null;
    }

    //更新用户信息
    public function updateUser($id, $data){
        return $this->getDBConnection()
            ->table($this->tableName)
            ->where('id', $id)
            ->data($data)
            ->save();
    }

}
