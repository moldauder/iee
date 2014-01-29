<?php
class Biz{

    protected $db;

    public function __construct(){
        $this->_initialize();
    }

    protected function _initialize(){
    }

    /**
     * 获取Db数据库连接
     */
    protected function getDBConnection(){
        if(!$this->db){
            $this->db = Db::getInstance();
        }
        return $this->db;
    }

    /**
     * 获取数据库错误
     */
    public function getDBError(){
        return $this->getDBConnection()->getError();
    }

}
