<?php
class UserModel extends Model{

    public function find($args = array()){
        $args = array_merge(array(
            'num'           => 15,
            'page'          => 'next',
            'queryPageInfo' => false
        ), $args);

        $list = $this->db->table('^users')
            ->where(implode(' AND ', $this->_buildWhereConds($args)))
            ->order('id desc')
            ->limit($args['num'])
            ->select();

        if($args['queryOneItem']){
            return count($list) ? $list[0] : null;
        }

        return $list;
    }

    public function getUserByName($username){
        return $this->db->table('^users')->where('username', $username)->selectOne();
    }

}
