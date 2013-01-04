<?php
class UserModel extends Model{


    public function select($args = array()){
        $args = array_merge(array(
            'num'               => 15,
            'page'              => 'next',
            'queryPageInfo'     => false,
            'queryOneItem'      => false,
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

    /**
     * 找到某个用户的信息
     */
    public function selectOne($args = array()){
        return $this->select(array_merge(array(
            'num'           => 1,
            'queryOneItem'  => true
        ), $args));
    }

    private function _buildWhereConds($args = array()){
        $whereCond = array();

        $username = safe_input($args['username']);
        if($username){
            $whereCond[] = "username='" . $username . "'";
        }

        return $whereCond;
    }

}
