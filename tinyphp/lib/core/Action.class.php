<?php
class Action{

    private $vars = array();
    private $mobileDetecter;

    public function __construct(){
        $this->_initialize();
    }

    protected function _initialize(){}

    /**
     * take a value for array($_GET...)
     */
    public function getVar($name, $default = '', $source = ''){
        if(!is_array($source)){
            $source = $_GET;
        }
        $value = array_key_exists($name ,$source) ? $source[$name] : $default;
        return $this->filterVar($value);
    }

    public function filterVar($value){
        return htmlspecialchars($value);
    }

    protected function isAjax(){
        return $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest';
    }

    protected function isGet(){
        return $_SERVER['REQUEST_METHOD'] === 'GET';
    }

    protected function isPost(){
        return $_SERVER['REQUEST_METHOD'] === 'POST';
    }

    /**
     * assign a value to template
     */
    public function assign($name, $value){
        if(is_array($name)){
            $this->vars = array_merge($this->vars, $name);
        }else{
            $this->vars[$name] = $value;
        }
        return $this;
    }

    public function display($file = ''){
        $this->headerContentType('html');
        print $this->fetch($file);
        exit;
    }

    public function ajax($data = null, $dataType = 'text'){ /* {{{ */
        $data = $data ? $data : $this->vars;

        if('jsonp' === $dataType){
            $callback =$_GET['callback'];
            $content = ($callback ? $callback : 'callback') . '(' . System::JSON($data) . ')';
        }else if('json' === $dataType){
            $content = System::JSON($data);
        }else{
            $content = $data;
        }

        $this->headerContentType($dataType);
        header('Cache-Control: max-age=0');
        print $content;
        exit;
    } /* }}} */

    public function jsonp($data = null){
        $this->ajax($data, 'jsonp');
    }

    protected function headerContentType($dataType = 'html'){
        $headers = array(
            'html'   => 'text/html',
            'text'   => 'text/plain',
            'script' => 'application/javascript',
            'js'     => 'application/javascript',
            'json'   => 'application/json',
            'jsonp'  => 'application/javascript',
            'css'    => 'text/css',
            'png'    => 'image/png',
            'jpg'    => 'image/jpeg',
            'jpeg'   => 'image/jpeg',
            'swf'    => 'application/x-shockwave-flash',
            'gif'    => 'image/gif',
        );

        $header = $headers[$dataType];
        $header = $header ? $header : $headers['html'];

        header('Content-Type: ' . $header);
    }

    public function getMobileDetecter(){
        if(!$this->mobileDetecter){
            System::importVendor('Mobile_Detect');
            $this->mobileDetecter = new Mobile_Detect();
        }

        return $this->mobileDetecter;
    }

    /**
     * 是否来自于微信的访问
     */
    public function isWeChat(){
        return preg_match('/\bMicroMessenger\b/i', $this->getMobileDetecter()->getUserAgent());
    }

    /**
     * display();
     * display('method')
     * display('action:method);
     * display('theme:action:method);
     */
    private function fetch($name = ''){
        list($method, $folder, $theme) = array_reverse(explode(':', $name));

        $method = $method ? $method : System::config('method_name');
        $folder = $folder ? $folder : System::config('action_name');
        $theme  = $theme  ? $theme  : System::config('theme');

        $path = APP_TEMPLATE . $theme . '/';
        $file = $path . $folder . '/' . $method . '.html';

        if(!is_file($file)){
            System::halt('模板: ' . $file  .' 未找到');
        }

        $funcFile = $path . 'functions.php';
        if(is_file($funcFile)){
            require $funcFile;
        }

        $pwd = getcwd();
        chdir(dirname($file));

        ob_start();
        ob_implicit_flush(FALSE);

        $assetTool = new assetAction();
        $assetTool->loadConfig();

        extract($this->vars, EXTR_OVERWRITE);

        require $file;

        chdir($pwd);
        return ob_get_clean();
    }

    public function _empty(){

    }

}
