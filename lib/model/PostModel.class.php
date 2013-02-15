<?php
class PostModel extends Model{

    /*
     * 常量 文章类型
     */
    const TYPE_POST = 'post';                   //普通文章
    const TYPE_ALBUM_POST = 'album';            //专辑
    const TYPE_RELATE_POST = 'relateitem';      //关联文章
    const TYPE_REVISION_POST = 'revision';      //修订版本

    /**
     * 查询文章
     *
     * @param array $args 查询参数
     *
     * $param string $args['id']                    起始id
     * $param number $args['num']                   数量，默认15。小于1则表示不限制
     * @param array $args['type']                   查询的类型，默认post
     * $param string $args['page']                  翻页方向 next 下一页, prev 上一页，默认next
     * $param string $args['q']                     关键字
     * $param array $args['pid']                    父ID
     * $param array $args['status']                 文章状态
     * $param array $args['author']                 作者ID
     * $param string $args['trash']                 是否回收站
     *
     * @param boolean $args['queryRelateInfo']      是否查询关联专辑项目，默认false
     * @param boolean $args['queryPageInfo']        是否查询翻页信息，默认false
     * $param boolean $args['returnAllFields']      返回全部的字段，供后台使用
     *
     * @return array $postDatas 返回查询结果集
     */
    public function find($args = array()){
        $args = array_merge(array(
            'num'               => 15,
            'type'              => array(self::TYPE_POST, self::TYPE_ALBUM_POST),
            'page'              => 'next',
            'queryPageInfo'     => false,
            'queryRelateInfo'   => false,
            'returnAllFields'   => false,
            'excludeTopPost'    => false
        ), $args);

        $this->_processArgs($args);

        $list = $this->db->join('^users user on user.id=post.author')->field('post.*, user.nick, user.username')->select();

        if('prev' === $args['page']){
            $list = array_reverse($list);
        }

        if($args['queryRelateInfo']){
            foreach($list as $postData){
                if(self::TYPE_ALBUM_POST === $postData->type){
                    $postData->relateitem = $this->findRelateItems($postData->id);
                }
            }
        }

        $size = count($list);
        $ret = array(
            'list' => $list,
            'size' => $size
        );

        if(0 < $size && $args['queryPageInfo']){
            $args['page'] = 'prev';
            $args['id'] = $list[0]->id;
            $ret['prev'] = (bool)$this->findOne($args);

            if($size < $num){
                $ret['next'] = false;
            }else{
                $args['page'] = 'next';
                $args['id'] = $list[$size - 1]->id;
                $ret['next'] = (bool)$this->findOne($args);
            }
        }

        foreach($ret['list'] as $postObj){
            $this->_filterResult($postObj, $args['returnAllFields']);
        }

        return $ret;
    }

    public function _filterResult($postObj, $returnAllFields = false){
        $noReturnfields = $returnAllFields ? array() : array(
            'pid',
            'attr',
            'status',
            'trash',
            'img_key',
            'img_crop',
            'fp',
            'lock',
            'price_unit',
            'host'
        );

        foreach($postObj as $property => $val){
            if(is_null($val) || '' === $val || in_array($property, $noReturnfields)){
                unset($postObj->$property);
            }
        }
    }

    public function findOne($args = array()){
        $args['queryPageInfo'] = false;
        $args['num'] = 1;
        $ret = $this->find($args);
        return 0 === $ret['size'] ? null : $ret['list'][0];
    }

    public function findTopPosts($args = array()){
        $list = $this->db->table('^posts post')->join('^users user on user.id=post.author')
            ->field('post.*, user.username, user.nick')
            ->where('post.dotop > 0')
            ->where('post.trash', 'n')
            ->where('post.status', 'publish')
            ->order('post.dotop desc')
            ->select();

        foreach($list as $postObj){
            $this->_filterResult($postObj);
        }

        if($args['queryRelateInfo']){
            foreach($list as $postObj){
                if(self::TYPE_ALBUM_POST === $postObj->type){
                    $postObj->relateitem = $this->findRelateItems($postObj->id);
                }
            }
        }

        return $list;
    }

    /**
     * id <=== sid or id
     */
    public function getPostById($id, $args = array()){
        $args = array_merge(array(
            'returnAllFields' => false,
            'queryRelateInfo' => false
        ), $args);

        if($args['status']){
            $this->db->where('status', $args['status']);
        }

        if($args['trash']){
            $this->db->where('trash', $args['trash']);
        }

        $postObj = $this->db->table('^posts post')->join('^users user on user.id=post.author')
            ->field('post.*, user.username, user.nick')
            ->where('post.sid', $id)
            ->logic('or')
            ->where('post.id', $id)
            ->order('post.id desc')
            ->selectOne();

        $this->_filterResult($postObj, $args['returnAllFields']);

        if($args['queryRelateInfo']){
            $postObj->relateitem = $this->findRelateItems($postObj->id);
        }

        return $postObj;
    }

    public function findRelateItems($parentID){
        $data = $this->find(array(
            'pid'           => $parentID,
            'type'          => self::TYPE_RELATE_POST,
            'num'           => -1,
            'page'          => 'next'
        ));
        return $data['size'] > 0 ? $data['list'] : null;
    }

    public function delete($id){
        if(is_string($id)){
            $id = explode(',', $id);
        }
        return $this->db->table('^posts')->where('id', $id, 'in')->delete();
    }

    public function count($args){
        $this->_processArgs($args);
        return $this->db->count();
    }

    public function save($args = array(), $data){
        $this->_processArgs($args);
        $this->db->data($data);
        return $this->db->save();
    }

    private function _processArgs($args){
        $q = System::filterVar($args['q']);
        if($q){
            $this->db->where('post.title', '%' . $q . '%', 'like');
        }

        foreach(array('status', 'author', 'type') as $arrArg){
            $arrVal = $args[$arrArg];
            if(!empty($arrVal)){
                if(is_string($arrVal)){
                    $arrVal = explode(',', $arrVal);
                }
                $this->db->where('post.' . $arrArg, $arrVal, 'in');
            }
        }

        foreach(array('trash', 'fp', 'pid') as $strArg){
            $strVal = $args[$strArg];
            if($strVal){
                $this->db->where('post.' . $strArg, $strVal);
            }
        }

        if($args['excludeTopPost']){
            $this->db->where('post.dotop=0');
        }

        $page = $args['page'];
        $id = $args['id'];
        if($id){
            if(is_string($id)){
                $id = explode(',', $id);
            }
            $this->db->where('post.id', $id, 'prev' === $page ? '>' : ('current' === $page ? 'in' : '<'));
        }
        $this->db->order('post.id ' . ('prev' === $page ? 'asc' : 'desc'));

        $num = $args['num'];
        if($num > 0){
            $this->db->limit($num);
        }

        $this->db->table('^posts post');
        return $this;
    }

}
