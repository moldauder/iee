<?php
class FixAction extends Action{

    private function execute(){
        $db = Db::getInstance();

        //update table add 2 columns
        $db->query('ALTER TABLE tp_posts ADD COLUMN `updated` DATETIME NULL  AFTER `host`');
        $db->query('ALTER TABLE tp_posts ADD COLUMN `fullcontent` LONGTEXT NULL  AFTER `content`');

        //更新专辑数据
        $db->query("update tp_posts set type='albumitem' where type='relateitem'");

        //分析所有链接，把淘宝、天猫商品信息补上
        $db->query("update tp_posts set host='taobao' where INSTR(outer_url, '.taobao.') > 0");
        $db->query("update tp_posts set host='tmall' where INSTR(outer_url, '.tmall.') > 0");
        $db->query("update tp_posts set host='xiami' where INSTR(outer_url, '.xiami.') > 0");
        $db->query("update tp_posts set host='youku' where INSTR(outer_url, '.youku.') > 0");
        $db->query("update tp_posts set host='douban' where INSTR(outer_url, '.douban.') > 0");

        $db->query("update tp_posts set updated=modified");

        $db->query("update tp_posts set sid=0 where isnull(sid)");
        $db->query("update tp_posts set pid=0 where isnull(pid)");

        //update fullcontent, content
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

        //kill self
        unlink(APP_LIB_ACTION . 'FixAction.class.php');
    }

}
