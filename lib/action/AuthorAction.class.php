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

            $cat = $_GET['cat'];
            if($cat){
                $catBiz = System::B('Category');
                $catObj = $catBiz->getCatByAlias($cat);
                if($catObj){
                    $this->assign('catObj', $catObj);
                    $args['cat'] = $catObj->id;
                }
            }

            $catBiz = System::B('Category');
            $this->assign('categoryList', $catBiz->find('item'));

            $this->assign('authorObj', $authorObj);
            $this->display('author');
        }

        System::redirect();
    }

}
