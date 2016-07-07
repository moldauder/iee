<?php
class MyAction extends AuthAction{

    public function _empty(){
        list($actionName, $methodName) = System::$queryvars;

        //针对ant页面的请求处理
        if($methodName && in_array($methodName, array('index.js', 'index.css', 'common.js'))){
            $debugMode = System::config('debug_mode');
            header('Content-Type: ' . (strpos($methodName, '.css') === FALSE ? 'application/javascript' : 'text/css'));
            header('Cache-Control: max-age=' . ($debugMode ? '0' : '315360000'));
            print file_get_contents(APP_PATH . 'dist/' . $methodName);
            exit;
        }

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

    /**
     * 基于ant的首页
     */
    public function index(){
        $this->checkLogin();
        $this->display();
    }

}
