<?php
/**
 * base on douban v2 api, with oatuth2
 */
class DoumailAction extends AuthAction{

    private $authURL = 'https://www.douban.com/service/auth2/';
    private $apiURL = 'https://api.douban.com/v2/';

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
        $list = $biz->findActs();

        $this->assign('actList', $list);
        $this->display();
    }

    /**
     * 创建活动
     */
    public function create(){
        $this->checkLogin();
        $this->display();
    }

    /**
     * 保存活动
     */
    public function saveact(){
        $biz = System::B('Doumail');

        $id =  System::filterVar($_POST['id']);
        if($id && !$biz->findActById($id)){
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
            'name' => $title,
            'content' => $content,
            'closed' => 'n'
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
     * 显示豆瓣授权页面
     */
    public function authorization(){
        $this->display('authorization');
    }

    /**
     * 处理豆瓣回传的授权响应，接受code参数
     */
    private function handleAuth(){
        $error = $_GET['error'];
        if($error){
        }

        $code = $_GET['code'];
        if($code){
            //try to get access_token
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $this->authURL . 'token');
            curl_setopt($ch, CURLOPT_POST, true);
        }
    }
}
