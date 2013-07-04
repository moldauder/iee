<?php
class AuthAction extends Action{

    protected $userId;

    protected function checkLogin(){
        $this->startSession();
        $userId = $_SESSION['userId'];

        if(!$userId){
            $this->login();
            return false;
        }else{
            define('USERID'   , $userId);
            define('USEREMAUL' , $_SESSION['email']);
            define('USERNICK' , $_SESSION['userNick']);

            defined('IS_SUPER_USER') or define('IS_SUPER_USER', in_array($_SESSION['role'], array('admin', 'editor')));
            return true;
        }
    }

    public function logout(){
        $this->startSession();
        session_destroy();

        //设定跳转地址
        $redirect = System::filterVar($_GET['redirect']);
        $redirect = $redirect ? $redirect : $_SERVER['REQUEST_URI'];
        $redirect = substr($redirect, 1);

        //不要出现死循环了
        if('logout' === strtolower($redirect)){
            $redirect = '';
        }

        $this->assign('redirect', $redirect);

        $this->login();
    }

    public function login(){
        $this->display('uc:login');
    }

    //迷你登录浮层
    public function minilogin(){
        $this->display('minilogin');
    }

    public function check(){
        $email = System::filterVar($_POST['email']);
        if(!$email){
            $this->assign('errMsg', '邮箱不能为空');
            $this->login();
        }

        $pwd = System::filterVar($_POST['pwd']);
        if(!$pwd){
            $this->assign('errMsg', '密码不能为空');
            $this->login();
        }

        $userBiz = System::B('User');
        $userData = $userBiz->getUserByEmail($email);

        if(!$userData || $userBiz->encryptPwd($pwd) !== $userData->pwd){
            $this->assign('errMsg', '邮箱或密码错误');
            $this->assign('email', $email);
            $this->login();
        }

        $this->startSession();

        $_SESSION['userId'] = $userData->id;
        $_SESSION['email']  = $userData->username;
        $_SESSION['role']   = $userData->role;
        $_SESSION['userNick'] = $userData->nick;
        $_SESSION['token'] = substr(md5(time() . rand(1, 99999)), 12, 24);

        $redirect = System::filterVar($_POST['redirect']);
        System::redirect($redirect ? $redirect : 'item/all');
    }

    private function startSession(){
        session_name('t');
        session_start();
    }

}
