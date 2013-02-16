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
            define('USERNAME' , $_SESSION['userName']);
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
        $this->assign('redirect', substr($redirect, 1));

        $this->login();
    }

    public function login(){
        $this->display('My:login');
    }

    public function check(){
        $userName = System::filterVar($_POST['userName']);
        if(!$userName){
            $this->assign('errMsg', '用户名不能为空');
            $this->login();
        }

        $pwd = System::filterVar($_POST['pwd']);
        if(!$pwd){
            $this->assign('errMsg', '密码不能为空');
            $this->login();
        }

        $userBiz = System::B('User');
        $userData = $userBiz->getUserByName($userName);

        if(!$userData || $this->encryptPwd($pwd) !== $userData->pwd){
            $this->assign('errMsg', '用户名或密码错误');
            $this->assign('userName', $userName);
            $this->login();
        }

        $this->startSession();

        $_SESSION['userId'] = $userData->id;
        $_SESSION['userName'] = $userData->username;
        $_SESSION['role'] = $userData->role;
        $_SESSION['userNick'] = $userData->nick;
        $_SESSION['token'] = substr(md5(time() . rand(1, 99999)), 12, 24);

        $redirect = System::filterVar($_POST['redirect']);
        System::redirect($redirect ? $redirect : 'item/all');
    }

    protected function encryptPwd($str){
        return substr(md5(md5($str)), 0, 24);
    }

    private function startSession(){
        session_name('t');
        session_start();
    }

}
