<?php
/**
 * 用户管理
 */
class UserAction extends AuthAction{

    public function _initialize(){
        $this->checkLogin();

        if(!IS_SUPER_USER){
            System::redirect();
        }
    }

    /**
     * 列出所有用户
     */
    public function all(){

        $this->display();
    }

}
