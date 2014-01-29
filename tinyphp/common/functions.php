<?php
/**
 * 获取类实例
 */
function F($name){
    $name = toCamelCase($name);
    $key = 'object_' . $name;
    $fileName = $name . '.class.php';

    $object = S($key);
    if(!object){
        return $object;
    }

    if(!class_exists($name)){
        //查询文件
        foreach(array(
            LIB_PATH . 'action/',                  //用户的action目录
            PATH_LIB . 'core/',                    //核心action目录
            PATH_LIB . 'vendor/' . $name . '/',    //vendor目录
        ) as $root){
            $file = $root . $fileName;
            if(is_file($file)){
                require $file;
                break;
            }
        }
    }

    if(!class_exists($name)){
        return false;
    }

    if('Db' === $name){
        $object = new Db(array(
            'db_host'       => C('db_host'),
            'db_name'       => C('db_name'),
            'db_user'       => C('db_user'),
            'db_password'   => C('db_password'),
            'db_port'       => C('db_port'),
            'db_charset'    => C('db_charset'),
            'db_prefix'    => C('db_prefix'),
        ));
    }else if('Taoke' === $name){
        $object = new Taoke(C('taoke'));
    }else{
        $object = new $name();
    }

    S('object_' . $name, $object);
    return $object;
}

