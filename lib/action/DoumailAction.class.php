<?php
/**
 * base on douban v2 api, with oatuth2
 */
class DoumailAction extends AuthAction{

    private $doubanInst;

    public function __construct(){
        $this->checkLogin();
        if(!IS_SUPER_USER){
            exit;
        }
    }

    /**
     * 列出所有豆邮活动
     */
    public function all(){
        $biz = System::B('Doumail');

        $this->assign('actList', $biz->findActs());
        $this->assign('userList', $biz->findAuths());

        $this->display('all');
    }

    /**
     * 创建活动
     */
    public function create(){
        $this->display();
    }

    /**
     * 发送测试豆邮
     */
    public function test(){
        header('content-type: text/html; charset=utf-8');

        list($actionName, $methodName, $id) = System::$queryvars;
        if(!preg_match('/^\d+$/', $id)){
            exit;
        }

        $biz = System::B('Doumail');
        $actObj = $biz->getActById($id);

        if(!$actObj){
            print '活动不存在';
            exit;
        }

        //取得当前用户绑定信息
        $curAuth = $biz->getCurAuth();
        if(!$curAuth){
            print '<a href="/doumail/auth">请先绑定豆邮账号</a>';
            exit;
        }

        $curAuth->user_uid = $curAuth->douban_user_id;
        $curAuth->user_name = $curAuth->douban_user_name;

        require APP_LIB_ACTION . 'WiiAction.class.php';
        $wii = new WiiAction();
        if($wii->sendDoumail($actObj, array($curAuth))){
            print '豆邮发送完成，请前往<a href="http://www.douban.com/doumail/">豆瓣</a>检查';
        }else{
            print '豆邮发送失败，可能是被限速，请稍后再试';
        }
    }

    /**
     * 编辑活动
     */
    public function edit(){
        list($actionName, $methodName, $id) = System::$queryvars;
        if(!preg_match('/^\d+$/', $id)){
            exit;
        }

        $biz = System::B('Doumail');
        $actObj = $biz->getActById($id);

        if(!$actObj){
            //@todo
            exit;
        }

        $this->assign('actObj', $actObj);


        $this->display('create');
    }

    /**
     * 保存活动
     */
    public function saveact(){
        $biz = System::B('Doumail');

        $id =  System::filterVar($_POST['id']);
        if($id && !$biz->getActById($id)){
            $this->ajax(array(
                'msg'     => '您要编辑的豆邮活动不存在',
                'success' => false
            ), 'json');
        }

        $title = System::filterVar($_POST['title']);
        if(!$title){
            $this->ajax(array(
                'msg'     => '请填写豆邮标题',
                'success' => false
            ), 'json');
        }

        $content = System::filterVar($_POST['content']);
        if(!$content){
            $this->ajax(array(
                'msg'     => '请填写豆邮内容',
                'success' => false
            ), 'json');
        }

        $data = array(
            'title' => $title,
            'content' => $content
        );

        if(!$id){
            $data['created'] = date('Y-m-d H:i:s');
            $data['amount'] = 0;
        }

        $id = $id ? $biz->updateAct($id, $data) : $biz->addAct($data);

        if(false !== $id){
            $this->ajax(array(
                'success' => true,
                'id'      => $id
            ), 'json');
        }else{
            $this->ajax(array(
                'success' => false,
                'msg'     => $biz->getDBError()
            ), 'json');
        }
    }

    /**
     * 绑定豆瓣账号
     */
    public function auth(){
        $douban = $this->getDoubanInst();
        $douban->auth(array(
            'scope' => 'douban_basic_common,community_basic_online,event_basic_r,community_advanced_doumail_w'
        ));
    }

    /**
     * 接收豆瓣的授权响应
     */
    public function _empty(){
        $error = $_GET['error'];
        if($error){
        }

        $code = $_GET['code'];
        if($code){
            $douban = $this->getDoubanInst();
            $result = $douban->handlerAuth();
            $access_token = $result->access_token;

            if(!$access_token){
                return;
            }

            //获取当前授权用户的信息
            $me = $douban->get('/v2/user/~me');

            //保存到数据库
            $db = Db::getInstance();
            $db->table('^doumail_auth')->where('douban_user_id', $result->douban_user_id)->delete();
            $db->table('^doumail_auth')->data(array(
                'douban_user_id'   => $result->douban_user_id,
                'douban_user_uid'  => $me->uid,
                'douban_user_name' => $me->name,
                'access_token'     => $access_token,
                'refresh_token'    => $result->refresh_token,
                'expire'           => date('Y-m-d H:i:s', time() + $result->expires_in),
                'uid'              => USERID
            ))->add();
        }

        System::redirect('doumail/all');
    }

    /**
     * 获取豆瓣实例
     */
    private function getDoubanInst(){
        if(!$this->doubanInst){
            System::importVendor('Douban');
            $this->doubanInst = new Douban(System::config('doumail'));
        }

        return $this->doubanInst;
    }

}
