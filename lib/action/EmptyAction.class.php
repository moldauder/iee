<?php
class EmptyAction extends AuthAction{

    public function _empty(){
        list($page) = System::$queryvars;

        if($page){
            if(preg_match('/^\d+$/', $page)){
                System::switchAction('item', 'item');
            }

            if(in_array($page, array(
                'about',
                'foreverc'
            ))){
                $this->display('page:' . $page);
            }
        }

        System::switchAction('fp', 'index');
    }

    /**
     * 注册功能
     */
    public function register(){
        //注册流程
        if(count($_POST)){
            $email = trim($_POST['email']);

            if(!$email){
                $this->assign('errMsg', '邮箱地址不能为空，请填写');
                $this->display('uc:reg');
            }

            //邮箱有效性校验


            //写入数据库
            $biz = System::B('User');

            if($biz->getUserByEmail($email)){
                $this->assign('errMsg', '邮箱已经被注册，请更换');
                $this->display('uc:reg');
            }

            //添加用户
            if($biz->addUser(array(
                'email' => $email,
                'pwd' => $_POST['pwd']
            ))){
                $this->assign('msg', '注册成功');
            }
        }

        $this->display('uc:reg');
    }

    /**
     * 重置密码
     */
    public function forgetpwd(){
        if(count($_POST)){
            //比对邮件地址，如果存在，则发送重置邮件
            $email = trim($_POST['email']);

            if(!$email){
                $this->assign('errMsg', '请输入邮箱');
                $this->display('uc:forgetpwd');
            }

            $biz = System::B('User');

            $userData = $biz->getUserByEmail($email);
            if(!$userData){
                $this->assign('errMsg', '邮箱不存在');
                $this->assign('email', $email);
                $this->display('uc:forgetpwd');
            }

            //发送邮件
            $message = '<table style="border:2px solid #000; width: 420px"><tr><td style="background:#000;text-align:center"><img width="53" height="53" src="http://pic.yupoo.com/iewei/CsyJBJHp/Sc6vB.png"></td></tr>';
            $message .= '<tr><td height="50" border="0"></td></tr>';
            $message .= '<tr><td>Hi, ' . $userData->nick . '</td></tr>';
            $message .= '<tr><td>链接将于24小时后失效</td></tr>';
            $message .= '</table>';

            //if(System::mail($userData->nick, $userData->email, '找回密码', $message)){
                $this->assign('userData', $userData);
                $this->display('uc:forgetpwd-mailsend');
            //}
        }

        if($_GET['token']){
            //查找系统里已经有的token，如有，则启用重置密码输入框
        }

        $this->display('uc:forgetpwd');
    }

}
