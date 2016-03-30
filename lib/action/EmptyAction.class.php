<?php
class EmptyAction extends AuthAction{

    public function _empty(){
        list($page) = System::$queryvars;

        if($page){
            if('view' === $page){
                System::switchAction('information', 'views');
            }else if('inspiration' === $page){
                System::switchAction('information', 'inspirations');
            }

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

        System::switchAction('fp', 'index');
    }

}
