<?php
class DownloadAction extends Action{
    public function _empty(){
        list($action, $file) = System::$queryvars;

        if(!$file){
            System::redirect();
        }

        $file = APP_PATH  . 'content/download/' . $file;
        if(!is_file($file)){
            System::redirect();
        }

        header('Content-Disposition: attachment; filename=' . basename($file));
        header('Content-Length: ' . filesize($file));
        header('Content-type: ' . mime_content_type($file));
        header('Content-Encoding: none');
        header('Content-Transfer-Encoding: binary');

        print readfile($file);
    }
}
