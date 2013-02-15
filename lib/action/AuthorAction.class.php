<?php
class AuthorAction extends Action{

    public function _empty(){
        list($actionName, $nick) = System::$queryvars;

        if($nick){
            $userBiz = System::B('User');
            $authorObj = $userBiz->getUserByNick($nick);

            if(!$authorObj){
                System::redirect();
            }

            $this->assign('authorObj', $authorObj);
            $this->display('author');
        }

        System::redirect();
    }

}
