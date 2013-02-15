<?php
class FixAction extends Action{

    private function execute(){
        $this->fullcontent();
    }

    //升级fullcontent字段
    private function fullcontent(){
        $db = Db::getInstance();

        //更新专辑数据
        $db->query("update tp_posts set type='albumitem' where type='relateitem'");

        //分析所有链接，把淘宝、天猫商品信息补上

        // pre execute
        // alter table tp_posts add column fullcontent longtext after content

        $list = $db->query('select id,content,author_3rd from tp_posts');
        foreach($list as $post){
            $content = trim(str_replace(array('<p>', '</p>'), array('', "\n\r"), trim($post->content)));

            $fullcontent = $content . ($data->author_3rd ?  (' (来自 ' . $data->author_3rd . ')') : '');
            $fullcontent = '<p>' . preg_replace('/[\n\r]+/', '</p><p>', $fullcontent) . '</p>';

            $db->table('^posts')->where('id', $post->id)->data(array(
                'content' => $content,
                'fullcontent' => $fullcontent
            ))->save();
        }
    }

    public function _empty(){
        $this->execute();
    }

}
