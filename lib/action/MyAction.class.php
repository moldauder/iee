<?php
class MyAction extends AuthAction{

    public function _empty(){
        System::config('method_name', 'index');
        $this->checkLogin();
        System::redirect('item/all');
    }

    /**
     * /my/tmpl/pagename
     */
    public function tmpl(){
        list($actionName, $methodName, $pageName) = System::$queryvars;

        if($pageName && $this->isAjax()){
            $this->display($pageName);
        }
    }

}
