<?php
class PostModel extends Model{

    /*
     * 常量 文章类型
     */
    const TYPE_POST = 'post';                   //普通文章
    const TYPE_RELATE_POST = 'relateitem';      //关联文章

    /**
     * 属性定义
     */
    const ATTR_RELATE_POST = -1;                //包含专辑
    const ATTR_SUBMITURL = -2;                  //由submit生成


    /**
     * 查询文章
     *
     * @param array $args 查询参数
     *
     * $param string $args['id']                    起始id
     * $param number $args['num']                   数量，默认15。小于1则表示不限制
     * @param string $args['type']                  查询的类型，默认post
     * $param string $args['page']                  翻页方向 next 下一页, prev 上一页，默认next
     * $param string $args['q']                     关键字
     * $param string $args['sid']                   父ID
     * $param string $args['status']                文章状态
     * $param string $args['author']                作者ID
     * $param string $args['trash']                 是否回收站
     *
     * $param string $args['orderBy']               排序依据，默认是按照修改时间排布，对于专辑等还是要按照id排序
     *
     * @param boolean $args['queryRelateInfo']      是否查询关联专辑项目，默认false
     * @param boolean $args['queryPageInfo']        是否查询翻页信息，默认false
     * $param boolean $args['returnAllFields']      返回全部的字段，供后台使用
     *
     * @return array $postDatas 返回查询结果集
     */
    public function select($args = array()){
        $args = array_merge(array(
            'num'               => 15,
            'type'              => self::TYPE_POST,
            'page'              => 'next',
            'queryPageInfo'     => false,
            'queryRelateInfo'   => false,
        ), $args);

        $this->_processArgs($args);

        $list = $this->db->select();

        //if('prev' === $args['page']){    //要反转顺序
            //$list = array_reverse($list);
        //}

        $ret = array();
        $size = count($list);

        if(0 < $size && $args['queryPageInfo']){
            $args['queryPageInfo'] = false;

            $args['page'] = 'prev';
            $args['modified'] = $list[0]->modified;
            $this->_processArgs($args);
            $ret['prev'] = (bool)$this->db->selectOne($args);

            $args['page'] = 'next';
            $args['modified'] = $list[$size - 1]->modified;
            $this->_processArgs($args);
            $ret['next'] = (bool)$this->db->selectOne($args);
        }

        $ret['list'] = $list;
        $ret['size'] = $size;

        if($args['queryRelateInfo']){
            //要查找关联商品信息
            foreach($ret['list'] as $postData){
                if('1' === $this->attr($postData->attr, self::ATTR_RELATE_POST)){
                    $postData->relateitem = $this->findRelateItems($postData->id);
                }
            }
        }

        //不返回给前端的字段
        $noReturnfields = $args['returnAllFields'] ? array() : array(
            'sid',
            'attr',
            'type',
            'status',
            'trash',
            'img_key',
            'img_crop',
            'fp',
            'lock',
            'price_unit',
            'host'
        );

        //移除空白的属性，减少传输的内容
        foreach($ret['list'] as $postData){
            foreach($postData as $property => $val){
                if(is_null($val) || '' === $val || in_array($property, $noReturnfields)){
                    unset($postData->$property);
                }
            }
        }

        return $ret;
    }

    /**
     * 查询一篇文章
     *
     * @param string|array $args id或者查询参数，格式同select方法
     *
     * @return object $postData 文章信息
     */
    public function selectOne($args = array()){
        if(is_string($args)){
            $args = array('id' => $args);
        }

        $ret = $this->select(array_merge(array(
            'queryPageInfo' => false,
            'page' => 'current'
        ), $args));

        return 0 === $ret['size'] ? null : $ret['list'][0];
    }

    /**
     * 查询文章的关联文章
     */
    public function findRelateItems($parentID){
        return $this->select(array(
            'sid'           => $parentID,
            'type'          => self::TYPE_RELATE_POST,
            'num'           => -1,
            'page'          => 'next',
            'orderBy'       => 'id',
            'queryPageInfo' => false,
        ));
    }

    /**
     * 彻底移除文章
     */
    public function remove($args = array()){
    }

    /**
     * 数量查询，参数见select的参数
     */
    public function count($args = array()){
        $this->_processArgs($args);
        return $this->db->count();
    }

    /**
     * 属性操作
     */
    public function attr($exp, $val, $newval = null){
        $len = strlen($exp);
        $diff = $val + $len; //如果pos没有越界，那么$diff >= 0

        if(is_null($newval)){   //查询
            //这里不能越界--substr的$val允许越界，需要自己额外判断
            return ($diff >= 0) ? substr($exp, $val, 1) : null;
        }else{
            //返回更新后的$exp
            if($diff < 0){
                //如果长度不够就要补全，也正说明要加上的位置在最左边
                return $newval . str_pad($exp, -1 - $val, '0', STR_PAD_LEFT);
            }else{
                //更新指定位置
                return substr($exp, 0, $diff) . $newval . substr($exp, $diff + 1);
            }
        }
    }


    private function _processArgs($args = array()){
        $whereCond = array();

        $type = safe_input($args['type']);
        if($type){
            $whereCond[] = "posts.type='" . $type . "'";
        }

        $q = safe_input($args['q']);
        if($q){
            $whereCond[] = "posts.title like '%" . $q . "%'";
        }

        $author = safe_input($args['author']);
        if($author){
            $whereCond[] = "posts.author=" . $author . "";
        }

        $status = safe_input($args['status']);
        if($status){
            $whereCond[] = "posts.status='" . $status . "'";
        }

        $trash = safe_input($args['trash']);
        if($trash){
            $whereCond[] = "posts.trash='" . $trash . "'";
        }

        $fp = safe_input($args['fp']);
        if($fp){
            $whereCond[] = "posts.fp='" . $fp . "'";
        }

        $sid = safe_input($args['sid']);
        if($sid){
            $whereCond[] = "posts.sid=" . $sid;
        }

        $page = $args['page'];

        $id = $args['id'];
        $modified = $args['modified'];

        if($id){
            //if(false === strpos($id, ',')){
                //$whereCond[] = 'posts.id ' . ('prev' === $page ? '>' : ('next' === $page ? '<' : '=')) . $id;
            //}else{
            $whereCond[] = 'posts.id in (' . $id . ')';
            //}
        }else if($modified){
            $whereCond[] = 'posts.modified ' . ('prev' === $page ? '>' : ('next' === $page ? '<' : '=')) . " '" . $modified . "'";
        }


        $this->db->table('^posts posts')->join('^users users on users.id=posts.author')
            ->field('posts.*, users.nick, users.username')
            ->where(implode(' AND ', $whereCond))
            ->order('posts.modified ' . ('prev' === $page ? 'asc' : 'desc'));

        if($args['num'] > 0){
            $this->db->limit($args['num']);
        }
    }

}
