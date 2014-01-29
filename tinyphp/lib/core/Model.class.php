<?php
class Model implements Iterator{

    protected $db;

    public function __construct(){
        $this->db = Db::getInstance();
        $this->_initialize();
    }

    protected function _initialize(){
    }

    public function current(){
        return $this->db->current();
    }

    public function rewind(){
        $this->db->rewind();
    }

    public function key(){
        return $this->db->key();
    }

    public function next(){
        $this->db->next();
    }

    public function valid(){
        return $this->db->valid();
    }

    public function getLastSql(){
        return $this->db->getLastSql();
    }

}
