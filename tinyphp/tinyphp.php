<?php
/**
 * 核心入口文件
 *
 */
if(defined('TIME_START')){ return; }
define('TIME_START', time());

define('APP_PATH'       , dirname($_SERVER['SCRIPT_FILENAME']) . '/');
define('APP_TEMPLATE'   , APP_PATH . 'template/');
define('APP_COMMON'     , APP_PATH . 'common/');
define('APP_LIB'        , APP_PATH . 'lib/');
define('APP_LIB_ACTION' , APP_LIB . 'action/');
define('APP_LIB_BIZ'    , APP_LIB . 'biz/');

define('SYS_ROOT'     , dirname(__FILE__) . '/');
define('SYS_LIB'      , SYS_ROOT . 'lib/');
define('SYS_COMMON'   , SYS_ROOT . 'common/');
define('SYS_TEMPLATE' , SYS_ROOT . 'template/');

require SYS_LIB . 'core/System.class.php';

System::config(require SYS_COMMON . 'config.php');
System::config(require APP_COMMON . 'config.php');
date_default_timezone_set(System::config('default_timezone'));

require SYS_LIB . 'core/Logger.class.php';
require SYS_LIB . 'core/Action.class.php';
require SYS_LIB . 'core/Db.class.php';
require SYS_LIB . 'core/Model.class.php';
require SYS_LIB . 'core/Biz.class.php';
require SYS_LIB . 'core/AssetAction.class.php';

register_shutdown_function('shutdown_handler');
set_error_handler('error_handler');
set_exception_handler('exception_handler');

array_walk($_GET, array('System', 'filterVar'));

URLDispatch();

function URLDispatch(){
    $url = trim(preg_replace('/\/+/', '/', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)), '/');

    if(!$url){  //like example.com/
        System::$queryvars = array();
        System::switchAction('Empty', '_empty');
    }else{
        $queryvars = explode('/', $url);
        array_walk($queryvars, array('System', 'filterVar'));

        System::$queryvars = $queryvars;
        $actionName = $queryvars[0];

        //system action
        if('asset' === $actionName){
            $obj = new AssetAction();
            $obj->_empty();
        }

        System::switchAction($actionName, $queryvars[1]);
        System::switchAction('Empty', $actionName);
    }

    System::halt(":( 您访问的页面不存在");
}

function __autoload($className){
    $className = System::toCamelCase($className) . '.class.php';

    foreach(array(
        APP_LIB_ACTION
    ) as $root){
        $file = $root . $className;
        if(is_file($file)){
            require $file;
        }
    }
}

function error_handler($errno, $errstr, $errfile, $errline){
    switch($errno){
        case E_ERROR:
        case E_PARSE:
        case E_CORE_ERROR:
        case E_COMPILE_ERROR:
        case E_USER_ERROR:
            ob_end_clean();
            System::halt($errstr . ' in ' . $errfile . ' on line ' . $errline);
            break;
        case E_STRICT:
        case E_USER_WARNING:
        case E_USER_NOTICE:
        default: break;
    }
}

function exception_handler($exception){
    System::halt($exception->__toString());
}

function shutdown_handler(){
    if($error = error_get_last()){
        error_handler($error['type'], $error['message'], $error['file'], $error['line']);
    }

    Logger::save();
}
