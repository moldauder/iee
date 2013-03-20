<?php
class DownloadAction extends Action{
    public function _empty(){
        list($action, $file) = System::$queryvars;

        if(!$file){
            System::redirect();
        }

        $db = DB::getInstance();
        $fileObj = $db->table('^download')->where('id', $file)->selectOne();

        if(!$fileObj){
            System::redirect();
        }

        $file = APP_PATH  . 'content/download/' . $fileObj->filepath;
        if(!is_file($file)){
            System::redirect();
        }

        header('Content-Disposition: attachment; filename=' . $fileObj->name);
        header('Content-Length: ' . filesize($file));
        header('Content-type: ' . mime_content_type($file));
        header('Content-Encoding: none');
        header('Content-Transfer-Encoding: binary');

        print readfile($file);
    }
}
