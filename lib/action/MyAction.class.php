<?php
/**
 * 我的一味
 */
class MyAction extends Action{

    private $userId;

    public function _initialize(){
        //重置主题
        C('theme', 'my');

        //session
        //session_start会导致发送pragma: no-cache 等，导致缓存设置失效
        //后续需要区分，对于静态服务，不开启session
        session_name('t');
        session_start();

        $method = C('method_name');
        if('login' !== $method && 'auth' !== $method && !$this->isLogin()){  //这两个方法不执行登录校验
            $this->login();
        }
    }

    /**
     * 登录校验
     */
    private function isLogin(){
        //登录校验
        $this->userId = $_SESSION['userId'];
        if(!$this->userId){
            return false;
        }else{
            $this->assign('curUserId', $this->userId);
            $this->assign('curUserName', $_SESSION['userName']);
            $this->assign('curUserNick', $_SESSION['userNick']);

            //是否超级用户
            defined('IS_SUPER_USER') or define('IS_SUPER_USER', in_array($_SESSION['role'], array('admin', 'editor')));
            return true;
        }
    }

    public function index(){
        $this->display();
    }

    /**
     * 读取某个模板的内容
     */
    public function tmpl(){
        $name = $_GET['name'];

        if(!IS_SUPER_USER && in_array($name, 'submiturl')){
            exit;
        }

        $this->assign('db', F('db'));
        $this->display($_GET['name']);
    }

    /**
     * 查询控制
     */
    public function query(){
        $method = $_GET['action'] . 'Query';
        if(method_exists($this, $method)){
            $this->$method();
        }else{
            $this->ajax('不支持的操作');
        }
    }

    /**
     * 文章查询
     *
     * $_GET['type'] 指定是查询单个文章（item），还是批量查询（默认）
     */
    private function postQuery(){
        $model = F('PostModel');

        if('item' === $_GET['type']){
            $result = $model->selectOne(array(
                'id' => $_GET['id'],
                'queryRelateInfo' => true
            ));
        }else{
            $author = $_GET['author'];

            //强制用户ID
            if(!IS_SUPER_USER){
                $author = $this->userId;
            }

            $args = array(
                'modified'        => $_GET['modified'],
                'num'             => $_GET['num'],
                'q'               => $_GET['q'],
                'author'          => $author,
                'page'            => $_GET['page'],
                'queryPageInfo'   => true,
                'returnAllFields' => true,
            );

            $range = $_GET['range'];
            if('publish' === $range || 'draft' === $range){
                $args['status'] = $range;
            }else if('trash' === $range){
                $args['trash'] = 'y';
            }

            $result = $model->select($args);
        }

        $this->ajax($result, 'json');
    }

    /**
     * submiturl查询
     */
    public function submiturlQuery(){
        if(!IS_SUPER_USER){
            exit;
        }

        $whereArr = array('1=1');
        /**
         * status 取值
         * s 待审核(store)
         * p 跟进中(process)
         * a 已处理(archive 存档)
         *
         * 默认1
         */
        $status = $_GET['status'];
        $status = $status ? $status : 's';

        if('all' !== $status){
            $whereArr[] = "su.status='" . $status . "' ";
        }

        $agency = $_GET['agency'];
        if($agency && 'all' !== $agency){
            $whereArr[] = 'su.agency=' . $agency;
        }

        $whereStr = implode(' and ', $whereArr);

        //翻页方向 默认下一页 -- next
        $isPagePrev = 'prev' === $_GET['page'];

        $num = $_GET['num'];
        $num = $num ? $num : 12;

        $db = F('db');
        $id = intval($_GET['id']);
        if($id){
            $db->where($whereStr . " and su.id" . ($isPagePrev ? '>' : '<') . $id);
        }else{
            $db->where($whereStr);
        }

        $list = $db->table('^submit_url su')
            ->field('su.*, u.nick userNick')
            ->join('^users u on u.id=su.agency')
            ->order('su.id ' . ($isPagePrev ? 'asc' : 'desc'))
            ->limit($num)
            ->select();

        if($isPagePrev){    //要反转顺序
            $list = array_reverse($list);
        }

        $size = count($list);
        $ret = array();

        if(0 < $size){
            //注意排序，排在前面的时ID大的，按id降序排的
            $ret['prev'] = (bool)$db->table('^submit_url su')->where($whereStr . ' and su.id>' . $list[0]->id)->selectOne();
            $ret['next'] = (bool)$db->table('^submit_url su')->where($whereStr . ' and su.id<' . $list[$size - 1]->id)->selectOne();
        }

        $ret['list'] = $list;
        $ret['size'] = $size;

        $this->ajax($ret, 'json');
    }

    /**
     * 状态控制
     */
    public function status(){
        $method = $_GET['action'] . 'Status';
        if(method_exists($this, $method)){
            $this->$method();
        }else{
            $this->ajax('不支持的操作');
        }
    }

    private function submiturlStatus(){
        if(!IS_SUPER_USER){
            exit;
        }
        $db = F('db');
        $id= $_GET['id'];
        $field = $_GET['field'];

        $result = array(
            'success' => false
        );

        if('remove' === $field){    //删除
            if($db->table('^submit_url')->where('id=' . $id)->remove()){
                $result['success'] = true;
                $result['status'] = 'remove';
            }
            $this->ajax($result, 'json');
        }

        $data = $db->table('^submit_url')->where('id=' . $id);

        if(!$data){
            $result['msg'] = '没有这个submit';
            $this->ajax($result, 'json');
        }

        /*
         * 状态
         *
         * s 待通过
         * p 通过
         *
         */
        if(!in_array($field, array('s', 'p'))){
            $result['msg'] = '无效的操作';
            $this->ajax($result, 'json');
        }

        if($db->table('^submit_url')->where('id=' . $id)->data(array(
            'status' => $field,
            'agency' => $this->userId
        ))->save()){
            $result['success'] = true;
            $result['status'] = $field;
            $result['userNick'] = $_SESSION['userName'];
        }else{
            $result['msg'] = '更新状态失败';
        }

        $this->ajax($result, 'json');
    }

    private function postStatus(){
        $result = array(
            'success' => false
        );

        $field = $_GET['field'];
        $id = $_GET['id'];

        if(in_array($field, array('fp', 'lock')) && !IS_SUPER_USER){
            $result['msg'] = '对不起，您没有权限执行此操作';
            $this->ajax($result, 'json');
        }

        if(!$field || !$id){
            $result['msg'] = '参数错误';
            $this->ajax($result, 'json');
        }

        $isBatchOperate = false;
        $value = $_GET['value'];
        if(1 === strlen($value)){
            $isBatchOperate = true;
        }

        $model = F('PostModel');

        $postData = $model->select(array(
            'id' => $id
        ));

        if($postData && !IS_SUPER_USER){
            $id = array();
            foreach($postData['list'] as $postData){
                if($postData->author === $userId){
                    $id[] = $postData->id;
                }
            }
            $id = implode(',', $id);
        }else{
            $result['msg'] = '文章不存在';
            $this->ajax($result, 'json');
        }

        //移除文章
        if('remove' === $field){
            $result['success'] = (bool)$model->remove(array(
                'id' => $id
            ));
            $this->ajax($result, 'json');
        }

        //要更新的数据
        $data = array();

        $data[$field] = $isBatchOperate ? $value : ('y' === $postData->$field ? 'n' : 'y');

        if(false !== $db->table('^posts')->where('id in (' . $id .')')->save($data)){
            $result = array_merge($result, $data);
            $result['success'] = true;
        }else{
            $result['msg'] = '操作失败';
        }

        $this->ajax($result, 'json');
    }

    /**
     * 保存文章
     */
    public function postsave(){
        $result = array(
            'success' => false
        );

        $operate = safe_input($_POST['operate']);
        $id = safe_input($_POST['id']);
        $postData = array();

        $db = F('db');

        $isInsert = true;       //是否是新建文章
        $attr = str_pad('', 12, '0');         //文章属性

        if($id){
            $postObj = $db->table('^posts')->where('id=' . $id)->selectOne();

            if(!$postObj){
                $result['msg'] = '文章不存在';
                $this->ajax($result, 'json');
            }

            if(!IS_SUPER_USER){
                if($postObj>author != $this->userId){
                    $result['msg'] = '您没有权限编辑这篇文章';
                    $this->ajax($result, 'json');
                }

                if($postObj>lock === '1'){
                    $result['msg'] = '文章已经被锁定，请联系管理员';
                    $this->ajax($result, 'json');
                }
            }

            $attr = $postObj->attr;

            //含有id，即是插入模式
            $isInsert = false;
        }else{
            $postData['author'] = $this->userId;
            $postData['lock'] = 'n';
            $postData['fp'] = IS_SUPER_USER ? 'y' : 'n';
            $postData['trash'] = 'n';
            $postData['type'] = 'post';
        }

        $oldAttr = $attr;

        //额外参数
        parse_str(safe_input($_POST['params']), $params);

        $postData['status'] = 'publish' === $operate ? 'publish' : 'draft';
        $postData['modified'] = date('Y-m-d H:i:s');
        $postData['title'] = trim(safe_input($_POST['title']));
        $postData['content'] = '<p>' . preg_replace('/[\n\r]+/', '</p><p>', trim(safe_input($_POST['content']))) . '</p>';
        $postData['outer_url'] = trim(safe_input($_POST['outer_url']));
        $postData['author_3rd'] = trim(safe_input($_POST['author_3rd']));

        $postData['img'] = trim(safe_input($_POST['img']));

        //完整性判断
        if(!$postData['title']){
            $result['msg'] = '请填写标题';
        }else if(!$postData['outer_url'] && !IS_SUPER_USER){    //对于超级用户，不再强制要求填写
            $result['msg'] = '请填写链接地址';
        }else if(!$postData['img']){
            $result['msg'] = '请填写图片地址';
        }else if(false === parse_url($postData['img'])){
            $result['msg'] = '请填写有效的图片地址';
        }

        if($postData['outer_url'] && false === ($outerUrlData = parseOuterUrl($postData['outer_url']))){
            $postData = array_merge($postData, $outerUrlData);
            $result['msg'] = '请填写有效的链接地址';
        }

        if($result['msg']){
            $this->ajax($result, 'json');
        }

        $db->table('^posts')->data($postData);

        //数据库写入操作
        if($isInsert){
            $dbResult = $db->add();
            $id = $db->getLastInsID();
            $postData['id'] = $id;
        }else{
            $dbResult = $db->where('id=' . $id)->save();
        }

        //额外处理
        //submiturl
        if($params['submiturl']){
            if(false !== $db->table('^submit_url')->where('id=' . $params['submiturl'])->data(array(
                'postid' => $id,
                'status' => 'p',    //标记为已通过
                'agency' => $this->userId
            ))->save()){
                $result['isFromSubmit'] = true;
                $attr = postAttr($attr, POST_ATTR_SUBMITURL, 1);     //从submiturl而来
            }
        }else{
            $attr = postAttr($attr, POST_ATTR_SUBMITURL, 0);     //从submiturl而来
        }

        //关联商品
        if(!$isInsert){         //先删除之前得关联商品 and 新的文章本来就没有数据，不需要删除
            $db->table('^posts')->where("sid=" . $id . " and type='relateitem'")->remove();
        }

        $relateitem = $_POST['relateitem'];
        if($relateitem){
            foreach($relateitem as $idx => $relateData){
                $relateData['sid'] = $id;
                $relateData['type'] = 'relateitem';

                $relateData['modified'] = $postData['modified'];
                $relateData['author'] = $this->userId;

                $db->table('^posts')->data($relateData)->add();
            }

            //设置用relateitem的标志位
            $attr = postAttr($attr, POST_ATTR_RELATEITEM, 1);     //从submiturl而来
        }else{
            $attr = postAttr($attr, POST_ATTR_RELATEITEM, 0);
        }

        //更新attr
        if($oldAttr !== $attr){
            $db->table('^posts')->where('id=' . $id)->data(array('attr' => $attr))->save();
        }

        if(false === $dbResult){
            $result['msg'] = '文章' . ('draft' === $operate ? '保存' : '发布') . '失败';
        }else{
            $result['success'] = true;
            $result['id'] = $id;
        }

        $this->ajax($result, 'json');
    }

    /**
     * 退出登录
     */
    public function logout(){
        session_destroy();
        $this->login();
    }

    /**
     * 显示登录窗口
     */
    public function login(){
        $this->display('login');
    }

    /**
     * 检查登录
     */
    public function auth(){
        if(!$this->isLogin()){
            $userName = safe_input(trim($_POST['userName']));
            if(!$userName){
                $this->assign('errMsg', '用户名不能为空');
                $this->login();
            }

            $pwd = safe_input(trim($_POST['pwd']));
            if(!$pwd){
                $this->assign('errMsg', '密码不能为空');
                $this->login();
            }

            $db = F('db');
            $userData = $db->table('^users')->where("username='" . $userName . "' and pwd='" . $this->encryptPwd($pwd) . "'")->selectOne();

            if(!$userData){
                $this->assign('errMsg', '用户名或密码错误');
                $this->assign('userName', $userName);
                $this->login();
            }

            $_SESSION['userId'] = $userData->id;
            $_SESSION['userName'] = $userData->username;
            $_SESSION['role'] = $userData->role;
            $_SESSION['userNick'] = $userData->nick;
        }

        $this->redirect('my:index');
    }

    /**
     * 密码串生成
     */
    private function encryptPwd($str){
        return substr(md5(md5($str)), 0, 24);
    }

}
