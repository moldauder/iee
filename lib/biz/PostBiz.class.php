<?php
/**
 * 封装了文章的相关业务
 */
class PostBiz extends Biz{

    private $tableName = '^posts';

    /**
     * 批量查询文章
     */
    public function find($args = array()){
        $db = $this->getDBConnection();

        $db->table($this->tableName . ' post');

        //搜索标题
        if($args['q']){
            $db->where('post.title', '%' . $args['q'] . '%', 'like');
        }

        //指定状态、作者、类型等
        foreach(array('status', 'author', 'type') as $arrKey){
            $arrVal = $args[$arrKey];
            if(!empty($arrVal)){
                $arrVal = is_string($arrVal) ? explode(',', $arrVal) : $arrVal;
                $db->where('post.' . $arrKey, $arrVal, 'in');
            }
        }

        //是否回收站、首页等参数
        foreach(array('trash', 'fp', 'pid', 'host') as $strKey){
            $strVal = $args[$strKey];
            if($strVal){
                $db->where('post.' . $strKey, $strVal);
            }
        }

        //未分类特别处理
        if('n' === $args['has_cat']){
            $db->where('post.has_cat', 'n');
        }

        //处理分类
        if($args['cat']){
            unset($args['dotop']);    //在有分类的情况下强制移除置顶
            $db->where('post.id in (select post from ' . System::config('db_prefix') . 'post_category where category=' . $args['cat'] . ')');
        }

        //置顶
        $dotop = false;
        if(array_key_exists('dotop', $args)){
            if($args['dotop']){
                $dotop = true;
                $db->where('post.dotop>0');
            }else{
                $db->where('post.dotop=0');
            }
        }

        $isPrev = 'prev' === $args['page'] ? true : false;

        $id = $args['id'];
        if($id){
            $db->where('post.id' . ($isPrev ? '>' : '<') . $id);
        }

        if($dotop){
            $db->order('post.dotop asc');
        }else{
            $db->order('post.id ' . ($isPrev ? 'asc' : 'desc'))->limit($args['limit'] ? $args['limit'] : 15);
        }

        if($args['count']){
            return $db->count();
        }else{
            $db->join('^users user on user.id=post.author');
            $db->field('post.*, user.nick');
            $list = $db->select();

            if($isPrev){
                $list = array_reverse($list);
            }

            return $list;
        }
    }

    public function count($args = array()){
        $args['count'] = true;
        return $this->find($args);
    }

    public function findOne($args = array()){
        $args['limit'] = 1;
        $list = $this->find($args);
        return empty($list) ? null : $list[0];
    }

    /**
     * 根据ID查找文章(最终找到的事最新版本的文章)
     */
    public function getPostById($id){
        $db = $this->getDBConnection();

        $postObj = $db->field('posts.*,users.nick')
            ->table($this->tableName . ' posts')
            ->join('^users users on users.id=posts.author')
            ->where('(posts.id=' . $id . ' or posts.sid=' . $id . ") and posts.type in ('post','album')")
            ->order('posts.id desc')
            ->selectOne();

        if(!$postObj){
            return null;
        }

        $type = $postObj->type;
        if('albumitem' === $type){
            return 'NOT_INVALID_POST';
        }

        if('album' === $type){
            $postObj->albumItems = $this->findAlbumItem($postObj->id);
        }

        return $postObj;
    }

    public function getPostCatIds($postId){
        $list = $this->getDBConnection()->table('^post_category')
            ->where('post=' . $postId)
            ->select();

        $val = array();

        foreach($list as $vo){
            $val[] = $vo->category;
        }

        return implode(',', $val);
    }

    public function findAlbumItem($postId){
        return $this->getDBConnection()->table($this->tableName)
                ->field('title,buylink,outer_url,img,content,fullcontent')
                ->where('pid=' . $postId . " and type='albumitem'")
                ->order('id asc')
                ->select();
    }

    /**
     * 对于当前用户来说是否可以修改
     */
    public function isEditable($postObj){
        if(IS_SUPER_USER){
            return true;
        }

        //不是作者本人
        if($postObj->author !== USERID){
            return 'NOT_YOUR_POST';
        }

        //是否被锁定
        if('y' === $postObj->lock){
            return 'POST_IS_LOCK';
        }

        return true;
    }

    /**
     * 转换文章内容为存储用
     */
    public function toDisplayContent($content, $data = array()){
        //$content = trim($content);  //移除掉多余的换行、空
        $content .= $data['author_3rd'] ?  (' (来自 ' . $data['author_3rd'] . ')') : '';

        return '<p>' . preg_replace('/[\n\r]+/', '</p><p>', $content) . '</p>';
    }

    //批量调整fp、lock
    public function updateStatus($field, $id, $value){
        return $this->getDBConnection()->table($this->tableName)
            ->where('id in (' . $id . ')')
            ->data(array($field => $value))
            ->save();
    }

    //调整置顶状态
    public function updateDotop($id, $isDotop){
        $obj = $this->getPurePostById($id);
        if(!$obj){
            return null;
        }

        return $this->getDBConnection()
            ->table($this->tableName)
            ->where('id', $id)
            ->data(array('dotop' => $isDotop ? time() : 0))
            ->save();
    }

    //移入、移出回收站
    public function trash($id, $value){
        return $this->updateStatus('trash', $id, $value);
    }

    public function removePost($postObj){
        $where = array();

        $id = $postObj->id;
        $where[] = 'id=' . $id;         //本身
        $where[] = 'pid=' . $id;        //附属的项目（专辑等情况）

        //删除过去的版本
        $sid = $postObj->sid;
        if('0' !== $sid){
            $where[] = 'sid=' . $sid;
            $where[] = 'id=' . $sid;
        }

        return $this->getDBConnection()->table($this->tableName)->where(implode(' or ', $where))->delete();
    }

    public function hasRightToEdit($id){
        if(IS_SUPER_USER){
            return true;
        }

        //查找是否有作者不是自己的文章，或者被锁定的文章
        $list = $this->getDBConnection()
            ->table($this->tableName)
            ->where('id in (' . $id . ') and (`lock` = \'y\' or author <> ' . USERID . ')')
            ->select();

        return empty($list);
    }

    //只读取文章信息，不读取关联的作者、专辑商品等信息
    public function getPurePostById($id){
        return $this->getDBConnection()
            ->table($this->tableName)
            ->where('id', $id)
            ->selectOne();
    }

    //过滤掉不需要传递给前台的字段
    public function filterResult($list, $leftFields = ''){
        $leftFields = $leftFields ? $leftFields : array(
            'id',
            'sid',
            'author',
            'modified',
            'type',
            'title',
            'fullcontent',
            'img',
            'outer_url',
            'buylink',
            'nick',
            'price',
            'onsale'
        );

        foreach($list as $postObj){
            foreach($postObj as $property => $val){
                if(is_null($val) || '' === $val || !in_array($property, $leftFields)){
                    unset($postObj->$property);
                }
            }
        }

        return $list;
    }

    //将文章的类型标记为revision
    //@todo 此方法名不好
    public function markRevision($postObj){
        $db = $this->getDBConnection();
        $db->table($this->tableName);

        $source = $postObj->sid;
        if(empty($source)){
            $db->where('id=' . $postObj->id);
            $source = $id;
        }else{
            $db->where('sid=' . $source);
        }

        //更新之前版本的文章类型
        $db->data(array(
            'type' => 'revision'
        ))->save();
    }

    public function addPost($postData, $data = array()){
        $db = $this->getDBConnection();
        if($db->table($this->tableName)->data($postData)->add()){
            $id = $db->getLastInsID();

            if($data['album']){
                foreach($data['album'] as $item){
                    $item['pid'] = $id;
                    $db->table($this->tableName)->data($item)->add();
                }
            }

            if($data['category']){
                $this->updateCategory($id, $data['category']);
            }

            return $id;
        }

        return false;
    }

    public function updateCategory($postId, $category){
        $db = $this->getDBConnection();

        //remove已有的数据
        $db->table('^post_category')->where('post', $postId)->delete();

        $hasCat = false;
        foreach(explode(',', $category) as $cat){
            if(!preg_match('/^\d[1-9]*$/', $cat)){
                continue;
            }

            if($db->table('^post_category')->data(array(
                'post' => $postId,
                'category' => $cat
            ))->add()){
                $hasCat = true;
            }
        }

        $db->table($this->tableName)->data(array(
            'has_cat' => $hasCat ? 'y' : 'n'
        ))->where('id=' . $postId)->save();
    }

    public function updatePost($id, $data){
        return $this->getDBConnection()
            ->table($this->tableName)
            ->data($data)
            ->where('id', $id)
            ->save();
    }

}
