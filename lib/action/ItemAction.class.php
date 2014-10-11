<?php
class ItemAction extends AuthAction{

    public function item(){
        list($id) = System::$queryvars;
        $this->adapterHost();

        $biz = System::B('Post');
        $postObj = $biz->getPostById($id);

        $isAjax = array_key_exists('async', $_GET);

        if(!$postObj){
            if($isAjax){
                print 'not found';
            }else{
                System::redirect();
            }
        }

        //淘宝客等信息更新, 每一小时都会触发更新
        //86400 = one day
        $needUpdateTaoke = System::config('auto_update_taoke') &&
            ('tmall' === $postObj->host || 'taobao' === $postObj->host) &&
            time() - strtotime($postObj->updated) > 3600;

        if($needUpdateTaoke || $_GET['uptaoke']){
            $updateData = array(
                'updated' => date('Y-m-d H:i:s')
            );

            $outerUrlData = $this->_parseOuterUrl($postObj->outer_url);
            if($outerUrlData && $outerUrlData['url']){
                $postObj->outer_url  = $updateData['outer_url']  = $outerUrlData['url'];
                $postObj->host       = $updateData['host']       = $outerUrlData['host'];
                $postObj->buylink    = $updateData['buylink']    = $outerUrlData['buylink'];
                $postObj->price      = $updateData['price']      = $outerUrlData['price'];
                $postObj->price_unit = $updateData['price_unit'] = $outerUrlData['price_unit'];
                $postObj->onsale     = $updateData['onsale']     = $outerUrlData['onsale'];
                $biz->updatePost($postObj->id, $updateData);
            }
        }

        //for mobile access, easy print
        if($this->getMobileDetecter()->isMobile()){
            $this->assign('postObj', $postObj);
            $this->assign('isWeChat', $this->isWeChat());
            $this->display('smart');
        }

        $isAlbum = (bool)$postObj->albumItems;

        $baseArgs = array(
            'status' => 'publish',
            'trash'  => 'n',
            'type'   => array('post', 'album')
        );

        if(!$isAlbum){
            $authorID = $postObj->author;

            $this->assign('recentPostList', $biz->find(array_merge($baseArgs, array(
                'num'    => 7,
                'author' => $authorID
            ))));

            $this->assign('postsNum', $biz->count(array_merge($baseArgs, array(
                'author' => $authorID,
            ))));
        }

        $this->assign('isAlbum', $isAlbum);

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

        if($isAjax){
            $this->display('block');
        }else{
            $this->display('item');
        }
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
            'host'    => $_GET['host'],
            'has_cat' => $_GET['has_cat']
        );

        $args['status'] = array('publish', 'draft');

        $range = $_GET['range'];
        if($range){
            if('trash' === $range){
                $args['trash'] = 'y';
            }else{
                $args['status'] = array($range);
            }
        }

        $type = $_GET['type'];
        if($type){
            $args['type'] = array($type);
        }else{
            $args['type'] = array('album', 'post');
        }

        $postBiz = System::B('Post');
        $list = $postBiz->find($args);

        //上一页、下一页判定
        $total = count($list);
        if(0 < $total){
            $args['id'] = $list[0]->id;
            $args['page'] = 'prev';
            $this->assign('hasPrev', 0 < count($postBiz->find($args)));

            $args['id'] = $list[$total - 1]->id;
            $args['page'] = 'next';
            $this->assign('hasNext', 0 < count($postBiz->find($args)));
        }

        $this->assign('postList', $list);

        $this->assign('args', array_merge($args, array(
            'range' => $_GET['range'],
            'type' => $_GET['type']
        )));

        $this->display();
    }

    public function create(){
        $this->checkLogin();

        $submit = $_GET['submit'];
        if(preg_match('/^\d+$/', $submit)){     //来自Submit
            $biz = System::B('Submit');
            $submitObj = $biz->getSubmitById($submit);
            if($submitObj){
                $postObj = new StdClass();

                $postObj->submit     = $submit;
                $postObj->author_3rd = $submitObj->nick;
                $postObj->outer_url  = $submitObj->url;
                $postObj->content    = $submitObj->remark;
                $postObj->title      = $submitObj->title;

                $this->assign('postObj', $postObj);
            }
        }

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

        $biz = System::B('Post');

        $postObj = $biz->getPostById($id);

        if(!$postObj){
            $this->assign('errMsg', '您要编辑的文章不存在');
            $this->display('my:err');
        }

        if('NOT_INVALID_POST' === $postObj){
            $this->assign('errMsg', '您要编辑的不是有效的文章，它可能是专辑的一部分');
            $this->display('my:err');
        }

        $isEditable = $biz->isEditable($postObj);
        if(true !== $isEditable){
            if('NOT_YOUR_POST' === $isEditable){
                $this->assign('errMsg', '这不是你所撰写的文章，您不能修改');
            }else if('POST_IS_LOCK' == $isEditable){
                $this->assign('errMsg', '文章被管理员锁定，您不能修改');
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
        $this->assign('categoryList', $catBiz->find());

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
            $biz = System::B('Post');
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
    public function dotop(){
        $this->checkLogin();

        if(!IS_SUPER_USER){
            exit;
        }

        list($actionName, $methodName, $id, $value) = System::$queryvars;

        $biz = System::B('Post');

        if($biz->updateDotop($id, 'y' === $value)){
            $this->ajax(array(
                'success' => true
            ), 'json');
        }else{
            $this->ajax(array(
                'success' => false,
                'msg' => $biz->getDBError()
            ), 'json');
        }
    }

    //移入、移出回收站
    public function trash(){
        list($actionName, $methodName, $id, $value) = System::$queryvars;

        if('y' !== $value && 'n' !== $value){
            exit;
        }

        $biz = System::B('Post');

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

        $biz = System::B('Post');

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
        $postBiz = System::B('Post');
        $postObj = $postBiz->getPurePostById($id);

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
            if(false !== $postBiz->updateCategory($id, $category)){
                $this->ajax(array(
                    'success' => true
                ), 'json');
            }else{
                $this->ajax(array(
                    'msg' => $postBiz->getDBError(),
                    'success' => false
                ), 'json');
            }
        }
    }

    /**
     * 清除淘客信息
     */
    public function cleartaoke(){
        $this->checkLogin();

        $id = System::filterVar($_POST['id']);
        $postBiz = System::B('Post');
        $postObj = $postBiz->getPurePostById($id);

        if($postObj){
            if(false !== $postBiz->updatePost($id, array(
                'buylink' => ''
            ))){
                $this->ajax(array(
                    'success' => true
                ), 'json');
            }
        }

        $this->ajax(array(
            'success' => false
        ), 'json');
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
        $postBiz = System::B('Post');
        $id = System::filterVar($_POST['id']);

        $isInsert = true;
        $isAlbum = !empty($_POST['albumitem']);

        //图片信息
        $postData['img'] = System::filterVar($_POST['img']);
        if(!$this->_isValidImg($postData['img'])){
            $this->ajax(array(
                'msg'     => '请检查图片地址是否正确或者有效',
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

        //处理外部的URL地址
        $outerUrlData = $this->_parseOuterUrl($_POST['outer_url']);
        if(!$isAlbum && !$outerUrlData){    //如果是专辑，则允许不填写URL
            $this->ajax(array(
                'msg' => '错误的链接地址',
                'success' => false
            ), 'json');
        }

        if($outerUrlData){
            $postData['outer_url']  = $outerUrlData['url'];
            $postData['host']       = $outerUrlData['host'];
            $postData['buylink']    = $outerUrlData['buylink'];
            $postData['price']      = $outerUrlData['price'];
            $postData['price_unit'] = $outerUrlData['price_unit'];
            $postData['onsale']     = $outerUrlData['onsale'];
        }

        if($id){
            //编辑已有的文章
            $postObj = $postBiz->getPurePostById($id);

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

                if('y' === $postObj->lock){
                    $this->ajax(array(
                        'msg' => '文章已经被锁定，请联系管理员',
                        'success' => false
                    ), 'json');
                }
            }

            $isInsert = false;
            $postBiz->markRevision($postObj);

            $postData['lock']   = $postObj->lock;
            $postData['fp']     = $postObj->fp;
            $postData['trash']  = $postObj->trash;
            $postData['author'] = $postObj->author;
            $postData['sid']    = $postObj->sid ? $postObj->sid : $postObj->id;
        }else{
            $postData['lock']   = 'n';
            $postData['fp']     = IS_SUPER_USER ? 'y' : 'n';
            $postData['trash']  = 'n';
            $postData['author'] = USERID;
            $postData['sid']    = 0;
        }

        $postData['pid']      = 0;
        $postData['status']   = $operate;
        $postData['updated'] = $postData['modified'] = date('Y-m-d H:i:s');

        //第三方作者修订
        $postData['author_3rd'] = System::filterVar($_POST['author_3rd']);
        if($postData['author_3rd']){
            $postData['author'] = '6';  //thankyou account
        }

        $postData['content'] = $this->filterContent($_POST['content']);
        $postData['fullcontent']  = $postBiz->toDisplayContent($postData['content'], array(
            'author_3rd' => $postData['author_3rd']
        ));

        //来自于微信等渠道的内容
        $postData['wecontent'] = $_POST['wecontent'];

        //设置文章类型
        $postData['type'] = $isAlbum ? 'album' : 'post';

        $albumData = array();
        if($isAlbum){
            foreach($_POST['albumitem'] as $albumItem){
                $albumItem['pid'] = $postId;
                $albumItem['type'] ='albumitem';

                $albumItem['content'] = $this->filterContent($albumItem['content']);
                $albumItem['fullcontent']  = $postBiz->toDisplayContent($albumItem['content']);

                $outerUrlData = $this->_parseOuterUrl($albumItem['outer_url']);
                if(!$outerUrlData){
                    $this->ajax(array(
                        'msg' => '在专辑商品中存在错误的链接地址',
                        'success' => false
                    ), 'json');
                }

                $albumItem['outer_url']  = $outerUrlData['url'];
                $albumItem['buylink']    = $outerUrlData['buylink'];
                $albumItem['price']      = $outerUrlData['price'];
                $albumItem['price_unit'] = $outerUrlData['price_unit'];
                $albumItem['onsale']     = $outerUrlData['onsale'];
                $albumItem['host']       = $outerUrlData['host'];

                $albumData[] = $albumItem;
            }
        }

        //写入文章
        $postId = $postBiz->addPost($postData, array(
            'album' => $albumData,
            'category' => $_POST['category']
        ));

        if(false === $postId){
            $this->ajax(array(
                'msg' => $postBiz->getDBError(),
                'success' => false
            ), 'json');
        }

        $submit = System::filterVar($_POST['submit']);
        if(preg_match('/^\d+$/', $submit)){
            $submitBiz = System::B('Submit');
            $submitBiz->passByPost($submit, $postId, $postData->author);
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

        $biz = System::B('Post');
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

        if($host === 'taobao' ||  $host === 'tmall'){
            parse_str(strtolower($info['query']), $query);
            $item_id = $query['id'];
            if(preg_match('/^\d+$/', $item_id)){
                System::importVendor('Taoke');
                $taoke = new Taoke(System::config('taoke'));
                $iteminfo = $taoke->getItem($item_id);
                if(false !== $iteminfo){
                    $ret['url']        = $iteminfo['detail_url'];
                    $ret['buylink']    = $iteminfo['buylink'];
                    $ret['price']      = $iteminfo['price'];
                    $ret['price_unit'] = $iteminfo['price_unit'];
                    $ret['onsale']     = $iteminfo['onsale'];
                }
            }
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
    private function filterContent($content){
        $content = System::filterVar($content);
        $content = preg_replace('/[\n\r]+/', "\n\r", $content); //过多的换行变成一个
        return $content;
    }

}
