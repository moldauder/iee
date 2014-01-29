<?php
class Logger{

    const ERR = 'ERR';
    const SQL = 'SQL';
    const INFO = 'INFO';
    const DEBUG = 'DEBUG';

    private static $log = array();

    public static  function record($log, $level = self::INFO){
        if(false !== strpos(System::config('log_level'), $level)){
            self::$log[] = '[' . date('Y-m-d H:i:s') . '] [' . $level . '] ' . $log;
        }
    }

    public static function save(){
        if(count(self::$log)){
            $file = APP_PATH . 'content/log/error.log';
            if(!is_file($file)){
                System::mk_dir(dirname($file));
                file_put_contents($file, '');
            }
            error_log(implode("\n", self::$log) . "\n", 3, $file);
        }
    }
}
