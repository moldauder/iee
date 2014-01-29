<?php
class System{

    public static $queryvars = array();

    public static function dump($var, $label = null, $echo = true, $strict = true) {
        $label = ($label === null) ? '' : rtrim($label) . ' ';
        if(!$strict){
            if(ini_get('html_errors')){
                $output = print_r($var, true);
                $output = '<pre>' . $label . htmlspecialchars($output, ENT_QUOTES) . '</pre>';
            }else{
                $output = $label . print_r($var, true);
            }
        }else{
            ob_start();
            var_dump($var);
            $output = ob_get_clean();
            if(!extension_loaded('xdebug')){
                $output = preg_replace("/\]\=\>\n(\s+)/m", '] => ', $output);
                $output = '<pre>' . $label . htmlspecialchars($output, ENT_QUOTES) . '</pre>';
            }
        }
        if($echo){
            echo($output);
            return null;
        }else{
            return $output;
        }
    }

    public static function mk_dir($dir, $mode = 0777){
        if(is_dir($dir) || @mkdir($dir, $mode)){
            return true;
        }

        if(!self::mk_dir(dirname($dir), $mode)){
            return false;
        }

        return @mkdir($dir, $mode);
    }

    public static function config(){
        static $map = array();

        $num = func_num_args();
        $args = func_get_args();

        if(0 === $num){
            return $map;
        }

        $name = $args[0];

        if(is_object($name)){
            $name = get_object_vars($name);
        }

        if(is_array($name)){
            foreach($name as $key => $val){
                $map[strtolower($key)] = $val;
            }
        }else if(is_string($name)){
            if(1 === $num){
                return $map[$name];
            }else{
                $map[$name] = $args[1];
            }
        }
    }

    public static function halt($msg = ''){
        if($msg){
            Logger::record($msg, Logger::ERR);
            print '<!doctype html><html><meta charset="utf-8" /><title>' . System::config('site_name') . '</title><div style="margin:20px 10px;background:#FCF8E3;border:1px solid #FBEED5;padding: 8px;font-size:14px;color:#C09853;border-radius:4px;">' . $msg . '</div></html>';
        }
        exit;
    }

    public static function JSON($data){
        return json_encode($data);
    }

    public static function filterVar($value){
        return htmlspecialchars(trim($value), ENT_QUOTES);
    }

    public static function importVendor($className){
        if(class_exists($className)){
            return true;
        }

        $fileName = $className . '.class.php';
        foreach(array(
            SYS_LIB . 'vendor/' . $className . '/',
        ) as $root){
            $file = $root . $fileName;
            if(is_file($file)){
                require $file;
                return true;
            }
        }

        return false;
    }

    public static function toCamelCase($value){
        $ret = '';
        foreach(explode('_', $value) as $piece){
            $ret .= strtoupper(substr($piece, 0, 1)) . substr($piece, 1);
        }
        return $ret;
    }

    public static function B($bizName){
        $className = System::toCamelCase($bizName) . 'Biz';

        if(!class_exists($className)){
            $file = APP_LIB_BIZ . $className . '.class.php';
            if(is_file($file)){
                require $file;
            }else{
                self::halt('Biz ' . $className . ' not found');
            }
        }

        return new $className();
    }

    public static function A($actionName){
        $className = System::toCamelCase($actionName) . 'Action';

        if(!class_exists($className)){
            $file = APP_LIB_ACTION . $className . '.class.php';
            if(is_file($file)){
                require $file;
            }else{
                return null;
            }
        }

        return new $className();
    }

    public static function switchAction($actionName, $methodName){
        $className = self::toCamelCase($actionName) . 'Action';

        if(!class_exists($className)){
            $file = APP_LIB_ACTION . $className . '.class.php';
            if(is_file($file)){
                require $file;
            }
        }

        if(class_exists($className)){
            self::config('action_name', $actionName);
            $class = new ReflectionClass($className);

            if($class->hasMethod($methodName)){
                if($class->getMethod($methodName)->isPublic()){
                    self::config('method_name', $methodName);
                    $class->newInstance()->$methodName();
                    exit;
                }
            }

            $methodName = '_empty';
            self::config('method_name', $methodName);
            $class->newInstance()->_empty();
            exit;
        }

        return false;
    }

    public static function redirect($url = '', $params = array()){
        $query = array();
        foreach($params as $key => $val){
            $query[] = $key . '=' . urlencode($val);
        }
        $query = $query ? ('?' . implode('&', $query)) : '';

        header('Location: /' . $url . $query);
        exit;
    }
}
