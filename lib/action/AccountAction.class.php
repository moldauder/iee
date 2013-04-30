<?php
class AccountAction extends AuthAction{

    public function _empty(){
        $this->checkLogin();
        $this->display('edit');
    }

    public function save(){
        $this->checkLogin();

        $old_password = System::filterVar($_POST['old_password']);
        if(!$old_password){
            $this->ajax(array(
                'success' => false,
                'msg' => '请输入当前密码'
            ), 'json');
        }

        $new_password = System::filterVar($_POST['new_password']);
        if(!$new_password){
            $this->ajax(array(
                'success' => false,
                'msg' => '请输入新密码'
            ), 'json');
        }

        $biz = System::B('User');
        $user = $biz->getCurrentUser();
        if(!$user){
            exit;
        }

        if($user->pwd !== $this->encryptPwd($old_password)){
            $this->ajax(array(
                'success' => false,
                'msg' => '当前密码不正确'
            ), 'json');
        }

        if($biz->updateUser($user->id, array(
            'pwd' => $this->encryptPwd($new_password)
        ))){
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
}
