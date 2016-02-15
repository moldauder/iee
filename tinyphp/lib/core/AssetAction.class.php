<?php
class assetAction extends Action{

    private $js = array();
    private $css = array();

    private $version;
    private $theme;

    public function loadConfig($theme = '', $version = ''){
        $this->theme = $theme ? $theme : System::config('theme');
        $this->version = $version ? $version : System::config('asset_version');
    }

    public function import($exp){
        foreach(explode(',', $exp) as $key){
            if('.css' === substr($key, -4)){
                $this->css[] = substr($key, 0, strrpos($key, '.')) . '.css';
            }else{
                $this->js[] = $key . '.js';
            }
        }
        return $this;
    }

    private function parseAttr($attrs = array()){
        $html = '';

        foreach($attrs as $key => $value){
            $html .= $key . '="' . $value . '"';
        }

        if($html){
            $html = ' ' . $html;
        }

        return $html;
    }

    public function getVersion(){
        return $this->version;
    }

    public function js($attrs = array()){
        if(count($this->js)){
            print('<script src="/asset/' . $this->theme . '/' . implode(',', $this->js) . '"' . $this->parseAttr($attrs) . '></script>');
            $this->js = array();
        }
        return $this;
    }

    public function css($attrs = array()){
        if(count($this->css)){
            print('<link rel="stylesheet" href="/asset/' . $this->theme . '/' . $this->version . '/??' . implode(',', $this->css) . '"' . $this->parseAttr($attrs) . '/>');
            $this->css = array();
        }
        return $this;
    }

    /**
     * combo service
     */
    public function _empty(){
        $debugMode = System::config('debug_mode');

        //combo url /asset/default/1.1.0/??fileA,fileB
        //single url  /asset/default/1.1.0/file
        //single url2  /asset/default/file
        $queryvars = System::$queryvars;
        $theme = $queryvars[1];

        $combo = $_SERVER['QUERY_STRING'];
        if($combo){
            $files = substr($combo, 1);
        }else{
            //file may like /folder/file
            $files = implode('/', array_slice($queryvars, 2));
        }

        $path = APP_TEMPLATE . $theme . '/assets/';
        $str = '';

        foreach(explode(',', $files) as $file){
            //移除版本号信息
            $file = $path . preg_replace('/(\d+\.){3}/', '', $file);

            if(is_file($file)){
                $str .= file_get_contents($file);
            }
        }

        $this->headerContentType(substr($file, strrpos($file, '.') + 1));
        header('Cache-Control: max-age=' . ($debugMode ? '0' : '315360000'));

        print $str;
        exit;
    }
}
