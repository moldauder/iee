<?php
class SubmitBiz extends Biz{

    private $tableName = '^submit_url';

    /**
     * 查找submit
     *
     * 查找条件：status、agency
     * 翻页参数：page、id
     */
    public function find($args = array()){
        $db = $this->getDBConnection();

        $db->table($this->tableName . ' submit');
        $db->join('^users user on user.id=submit.agency');
        $db->field('submit.*, user.nick agencyNick');

        $status = $args['status'];
        if($status){
            $db->where('submit.status', $status);
        }

        $agency = $args['agency'];
        if($agency){
            $db->where('submit.agency', $agency);
        }

        $isPrev = 'prev' === $args['page'] ? true : false;

        $id = $args['id'];
        if($id){
            $db->where('submit.id' . ($isPrev ? '>' : '<') . $id);
        }

        $db->order('submit.id ' . ($isPrev ? 'asc' : 'desc'))->limit(15);

        $list = $db->select();

        if($isPrev){
            $list = array_reverse($list);
        }

        return $list;
    }

    public function getSubmitById($id){
        $db = $this->getDBConnection();

        return $db->table($this->tableName . ' submit')
            ->field('submit.*, user.nick agencyNick')
            ->join('^users user on user.id=submit.agency')
            ->where('submit.id', $id)
            ->selectOne();
    }

    public function pass($id){
        return $this->getDBConnection()->table($this->tableName)
            ->where('id', $id)
            ->data(array('status' => 'p', 'agency' => USERID))
            ->save();
    }

    //通过发表文章使得submit通过
    public function passByPost($id, $postId, $agency){
        return $this->getDBConnection()->table($this->tableName)
            ->where('id', $id)
            ->data(array(
                'status' => 'p',
                'postid' => $postId,
                'agency' => $agency
            ))->save();
    }

    public function remove($id){
        $db = $this->getDBConnection();

        return $db->table($this->tableName)
            ->where('id', $id)
            ->delete();
    }

}
