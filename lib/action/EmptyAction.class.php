<?php
class EmptyAction extends AuthAction{

    public function _empty(){
        list($page) = System::$queryvars;

        if($page){
            if(preg_match('/^\d+$/', $page)){
                System::switchAction('item', 'item');
            }

            //i22这类页面
            if(preg_match('/^i\d+/', $page)){
                System::switchAction('information', 'item');
            }

            if(in_array($page, array(
                'about',
                'foreverc'
            ))){
                $this->display('page:' . $page);
            }
        }

        //thing、view、inspiration，默认是fp
        define('FP_PAGE_TYPE', $page ? $page : 'fp');

        System::switchAction('fp', 'index');
    }

}
