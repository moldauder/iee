<?php
class InformationAction extends AuthAction{

    public function item(){
        list($id) = System::$queryvars;
        $id = substr($id, 1);
        $this->adapterHost();

        $biz = System::B('Information');
        $postObj = $biz->getPostById($id);

        if(!$postObj){
            if($isAjax){
                print 'not found';
            }else{
                System::redirect();
            }
        }

        //for mobile access, easy print
        if($this->getMobileDetecter()->isMobile()){
            $this->assign('postObj', $postObj);
            $this->assign('isWeChat', $this->isWeChat());
            $this->display('smart');
        }

        $baseArgs = array(
            'status' => 'publish',
            'type'   => 'post'
        );

        $realId = $postObj->id;

        $this->assign('prevPostObj', $biz->findOne(array_merge($baseArgs, array(
            'id'     => $realId,
            'page'   => 'prev'
        ))));

        $this->assign('nextPostObj', $biz->findOne(array_merge($baseArgs, array(
            'id'     => $realId,
            'page'   => 'next'
        ))));

        $this->assign('postObj', $postObj);
        $this->display('item');
    }

    public function all(){
        $this->checkLogin();

        $userBiz = System::B('User');
        $this->assign('userList', $userBiz->getAllUser());

        $author = $_GET['author'];
        if(!IS_SUPER_USER){         //强制用户ID
            $author = USERID;
        }

        $args = array(
            'id'      => $_GET['id'],
            'q'       => $_GET['q'],
            'author'  => $author,
            'page'    => $_GET['page'],
            'type'    => 'post'
        );

        $args['status'] = array('publish', 'draft');

        $informationBiz = System::B('Information');
        $list = $informationBiz->find($args);

        //上一页、下一页判定
        $total = count($list);
        if(0 < $total){
            $args['id'] = $list[0]->id;
            $args['page'] = 'prev';
            $this->assign('hasPrev', 0 < count($informationBiz->find($args)));

            $args['id'] = $list[$total - 1]->id;
            $args['page'] = 'next';
            $this->assign('hasNext', 0 < count($informationBiz->find($args)));
        }

        $this->assign('postList', $list);

        $this->assign('args', $args);

        $this->display();
    }

    public function create(){
        $this->checkLogin();
        $this->_displayCreate();
    }

    public function _empty(){
        list($actionName, $id, $field, $value) = System::$queryvars;

        if(preg_match('/^\d+$/', $id)){
            System::redirect($id);
        }

        System::redirect();
    }

    /**
     * 编辑文章
     */
    public function edit(){
        $this->checkLogin();

        list($actionName, $methodName, $id) = System::$queryvars;

        $biz = System::B('Information');

        $postObj = $biz->getPostById($id);

        if(!$postObj){
            $this->assign('errMsg', '您要编辑的资讯不存在');
            $this->display('my:err');
        }

        if('NOT_INVALID_POST' === $postObj){
            $this->assign('errMsg', '您要编辑的不是有效的资讯，它可能是专辑的一部分');
            $this->display('my:err');
        }

        $isEditable = $biz->isEditable($postObj);
        if(true !== $isEditable){
            if('NOT_YOUR_POST' === $isEditable){
                $this->assign('errMsg', '这不是你所撰写的资讯，您不能修改');
            }else if('POST_IS_LOCK' == $isEditable){
                $this->assign('errMsg', '资讯被管理员锁定，您不能修改');
            }

            $this->display('my:err');
        }

        $this->assign('postObj', $postObj);

        //查询分类信息
        $this->assign('category', $biz->getPostCatIds($postObj->id));

        $this->_displayCreate();
    }

    private function _displayCreate(){
        /* 查询分类信息 */
        $catBiz = System::B('Category');
        $this->assign('categoryList', $catBiz->find(array('view', 'inspiration')));

        $this->display('create');
    }

    /**
     * 文章状态相关操作
     *
     * http://iee.com/item/status/2731/fp/[value]
     *
     * fp 首页展现
     * lock 锁定
     */
    public function status(){
        $this->checkLogin();

        if(!IS_SUPER_USER){
            exit;
        }

        list($actionName, $methodName, $id, $field, $value) = System::$queryvars;

        if(!in_array($field, array('fp', 'lock'))){
            exit;
        }

        if('y' === $value || 'n' === $value){
            $biz = System::B('Information');
            if($biz->updatestatus($field, $id, $value)){
                $this->ajax(array(
                    'success' => true
                ), 'json');
            }else{
                $this->ajax(array(
                    'success' => false,
                    'msg' => $biz->getdberror()
                ), 'json');
            }
        }
    }

    /**
     * 把文章置顶
     */
    // public function dotop(){
    //     $this->checkLogin();
    //
    //     if(!IS_SUPER_USER){
    //         exit;
    //     }
    //
    //     list($actionName, $methodName, $id, $value) = System::$queryvars;
    //
    //     $biz = System::B('Information');
    //
    //     if($biz->updateDotop($id, 'y' === $value)){
    //         $this->ajax(array(
    //             'success' => true
    //         ), 'json');
    //     }else{
    //         $this->ajax(array(
    //             'success' => false,
    //             'msg' => $biz->getDBError()
    //         ), 'json');
    //     }
    // }

    //移入、移出回收站
    public function trash(){
        list($actionName, $methodName, $id, $value) = System::$queryvars;

        if('y' !== $value && 'n' !== $value){
            exit;
        }

        $biz = System::B('Information');

        if(!$biz->hasRightToEdit($id)){
            $this->ajax(array(
                'success' => false,
                'msg' => '您没权足够的权限调整这些文章，请联系管理员'
            ), 'json');
        }

        if($biz->trash($id, $value)){
            $this->ajax(array(
                'success' => true
            ), 'json');
        }else{
            $this->ajax(array(
                'success' => false,
                'msg' => $biz->getdberror()
            ), 'json');
        }
    }

    //删除
    public function remove(){
        list($actionName, $methodName, $id) = System::$queryvars;

        $biz = System::B('Information');

        $postObj = $biz->getPurePostById($id);

        if(!$postObj){
            $this->ajax(array(
                'success' => false,
                'msg' => '文章不存在'
            ), 'json');
        }

        if(!$biz->isEditable($postObj)){
            $this->ajax(array(
                'success' => false,
                'msg' => '您没权足够的权限删除这些文章，请联系管理员'
            ), 'json');
        }

        if($biz->removePost($postObj)){
            $this->ajax(array(
                'success' => true
            ), 'json');
        }else{
            $this->ajax(array(
                'success' => false,
                'msg' => $biz->getdberror()
            ), 'json');
        }
    }

    /**
     * 更新文章，而不影响排序
     */
    public function put(){
        $this->checkLogin();

        $id = System::filterVar($_POST['id']);
        $informationBiz = System::B('Information');
        $postObj = $informationBiz->getPurePostById($id);

        if(!IS_SUPER_USER){
            if($postObj->author !== USERID){
                $this->ajax(array(
                    'msg' => '您没有权限编辑这篇文章',
                    'success' => false
                ), 'json');
            }

            if('y' === $postObj->lock){
                $this->ajax(array(
                    'msg' => '文章已经被锁定，请联系管理员',
                    'success' => false
                ), 'json');
            }
        }

        //准备更新数据，目前只支持cateogry更新
        $category = System::filterVar($_POST['category']);
        if($category){
            if(false !== $informationBiz->updateCategory($id, $category)){
                $this->ajax(array(
                    'success' => true
                ), 'json');
            }else{
                $this->ajax(array(
                    'msg' => $informationBiz->getDBError(),
                    'success' => false
                ), 'json');
            }
        }
    }


    /**
     * 保存文章
     */
    public function save(){
        $operate = System::filterVar($_POST['operate']);
        if('publish' !== $operate && 'draft' !== $operate){
            exit;
        }

        $this->checkLogin();

        $postData = array();
        $informationBiz = System::B('Information');
        $id = System::filterVar($_POST['id']);

        $isInsert = true;

        //图片信息
        $postData['cover'] = System::filterVar($_POST['cover']);
        if(!$this->_isValidImg($postData['cover'])){
            $this->ajax(array(
                'msg'     => '请检查封面图片地址是否正确或者有效',
                'success' => false
            ), 'json');
        }

        //详情首图
        $postData['banner'] = System::filterVar($_POST['banner']);
        if($postData['banner'] && !$this->_isValidImg($postData['banner'])){
            $this->ajax(array(
                'msg'     => '请检查详情首图地址是否正确或者有效',
                'success' => false
            ), 'json');
        }

        //标题信息
        $postData['title']    = System::filterVar($_POST['title']);
        if(empty($postData['title'])){
            $this->ajax(array(
                'msg'     => '请填写标题',
                'success' => false
            ), 'json');
        }

        //没有分类信息
        if(!$_POST['category']){
            $this->ajax(array(
                'msg'     => '请至少选择一个分类',
                'success' => false
            ), 'json');
        }

        $postData['good_serial'] = System::filterVar($_POST['good_serial']);
        $postData['writer'] = System::filterVar($_POST['writer']);
        $postData['photographer'] = System::filterVar($_POST['photographer']);

        if($id){
            //编辑已有的文章
            $postObj = $informationBiz->getPurePostById($id);

            if(!$postObj){
                $this->ajax(array(
                    'msg' => '文章不存在',
                    'success' => false
                ), 'json');
            }

            if(!IS_SUPER_USER){
                if($postObj->author !== USERID){
                    $this->ajax(array(
                        'msg' => '您没有权限编辑这篇文章',
                        'success' => false
                    ), 'json');
                }

                // if('y' === $postObj->lock){
                //     $this->ajax(array(
                //         'msg' => '文章已经被锁定，请联系管理员',
                //         'success' => false
                //     ), 'json');
                // }
            }

            $isInsert = false;
            $informationBiz->markRevision($postObj);

            // $postData['lock']   = $postObj->lock;
            // $postData['fp']     = $postObj->fp;
            // $postData['trash']  = $postObj->trash;
            $postData['author'] = $postObj->author;
            $postData['sid'] = $postObj->sid ? $postObj->sid : $postObj->id;
        }else{
            // $postData['lock']   = 'n';
            // $postData['fp']     = IS_SUPER_USER ? 'y' : 'n';
            // $postData['trash']  = 'n';
            $postData['author'] = USERID;
            $postData['sid'] = 0;
        }

        $postData['status']   = $operate;
        $postData['type'] = 'post';
        $postData['updated'] = $postData['modified'] = date('Y-m-d H:i:s');

        $postData['desc'] = $this->filterDesc($_POST['desc']);

        $good_desc = $this->filterDesc($_POST['good_desc']);
        $postData['good_desc'] = $good_desc;
        $postData['good_fulldesc'] = $informationBiz->toDisplayContent($good_desc);

        $postData['content'] = $_POST['content'];

        //写入文章
        $postId = $informationBiz->addPost($postData, array(
            'category' => $_POST['category'],
            'goodsitem' => $_POST['goodsitem']
        ));

        if(false === $postId){
            $this->ajax(array(
                'msg' => $informationBiz->getDBError(),
                'success' => false
            ), 'json');
        }

        $this->ajax(array(
            'success' => true,
            'id'      => $postId,
            'sid'     => $postData['sid']
        ), 'json');
    }

    /**
     * 模糊搜索接口
     *
     * 用于专辑搜索等
     */
    public function fuzzy(){
        $q = $_GET['q'];
        if(!$q){ exit; }

        $this->checkLogin();

        $biz = System::B('Information');
        $list = $biz->find(array(
            'q'      => $q,
            'status' => 'publish',
            'type'   => array('post', 'album'),
            'trash'  => 'n',
            'limit'  => 10
        ));

        $list = $biz->filterResult($list, array(
            'title',
            'content',
            'outer_url',
            'img'
        ));

        $this->ajax($list, 'json');
    }

    /**
     * 处理外部URL链接
     */
    private function _parseOuterUrl($url){
        $url = str_replace('&amp;', '&', System::filterVar($url));
        $info = parse_url($url);

        if(!$info || !$info['host']){
            return null;
        }

        $ret = array(
            'url' => $url
        );

        $hostname = strtolower($info['host']);
        $host = '';

        if(false !== strpos($hostname, '.taobao.')){
            $host = 'taobao';
        }else if(false !== strpos($hostname, '.tmall.')){
            $host = 'tmall';
        }else if(false !== strpos($hostname, '.douban.')){
            $host = 'douban';
        }else if(false !== strpos($hostname, '.xiami.')){
            $host = 'xiami';
        }else if(false !== strpos($hostname, '.youku.')){
            $host = 'youku';
        }

        if($host){
            $ret['host'] = $host;
        }

        return $ret;
    }

    /**
     * 检查是否是有效的图片
     *
     * @todo 如果是相对于本机的地址？
     */
    private function _isValidImg($img){
        $headers = get_headers($img);
        if(!$headers){
            return false;
        }

        $headers = implode(';', $headers);
        //目前所知的图片，content-type应该都是image/xxxx的形式，根据这个来判断图片是否有效
        return preg_match('/\bimage\/\w+/', $headers);
    }

    //调整内容，去掉多余的换行
    private function filterDesc($content){
        $content = System::filterVar($content);
        $content = preg_replace('/[\n\r]+/', "\n\r", $content); //过多的换行变成一个
        return $content;
    }

}
