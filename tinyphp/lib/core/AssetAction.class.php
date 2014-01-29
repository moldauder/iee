<?php
class assetAction extends Action{

    private $js = array();
    private $css = array();

    private $map = array();
    private $theme;

    public function loadConfig($theme = ''){
        $this->theme = $theme ? $theme : System::config('theme');
        $configFile = APP_TEMPLATE . $this->theme . '/assets.json';

        if(is_file($configFile)){
            $this->map = json_decode(file_get_contents($configFile), TRUE);
        }
    }

    public function import($exp){
        foreach(explode(',', $exp) as $key){
            if(!array_key_exists($key, $this->map)){
                continue;
            }

            $config = $this->map[$key];

            $version = '.' . $config['version'] . '.';
            $pos = strpos($key, '.');

            if('.css' === substr($key, -4)){
                $this->css[] = substr($key, 0, strrpos($key, '.')) . $version . 'css';
            }else{
                $this->js[] = $key . $version . 'js';
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

    public function getConfigDesc(){
        $data = array();
        foreach($this->map as $name => $obj){
            $data[$name] = $obj['version'];
        }
        return json_encode($data);
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
            print('<link rel="stylesheet" href="/asset/' . $this->theme . '/' . implode(',', $this->css) . '"' . $this->parseAttr($attrs) . '/>');
            $this->css = array();
        }
        return $this;
    }

    /**
     * combo service
     */
    public function _empty(){
        $debugMode = System::config('debug_mode');

        //request /asset/default/base.1.0.0.css,res/on.png
        $queryvars = System::$queryvars;
        $theme = $queryvars[1];
        $files = implode('/', array_slice($queryvars, 2));

        $path = APP_TEMPLATE . $theme . '/assets/';
        $str = '';

        foreach(explode(',', $files) as $file){
            //移除版本号信息
            $file = $path . preg_replace('/(\d+\.){3}/', '', $file);

            if(!$debugMode){
                $minFile = $file . '.min';

                if(is_file($minFile)){
                    $str .= file_get_contents($minFile);
                    continue;
                }
            }

            if(is_file($file)){
                $str .= file_get_contents($file);
            }
        }

        $this->headerContentType(substr($file, strrpos($file, '.') + 1));

        if(!$debugMode){
            header('Cache-Control: max-age=315360000');
        }

        print $str;
        exit;
    }
}
