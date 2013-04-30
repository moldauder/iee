<?php
class QueryAction extends Action{

    //查询商品
    public function all(){
        $args = array(
            'status' => 'publish',
            'type'   => array('post', 'album'),
            'trash'  => 'n',
            'limit'  => 12,
            'id'     => $_GET['id'],
            'cat'    => $_GET['cat'],
            'page'   => 'next'
        );

        $isFp = 'fp' === $_GET['from'];

        //首页带有置顶功能，需要排除掉
        if($isFp){
            $args['dotop'] = false;
            $args['fp'] = 'y';
        }else{
            $args['author'] = $_GET['author'];
        }

        $biz = System::B('Post');
        $list = $biz->find($args);

        //过滤结果
        $list = $biz->filterResult($list);

        $this->ajax($list, 'json');
    }

    //查询专辑商品列表
    public function albumitem(){
        list($actionName, $methodName, $id) = System::$queryvars;

        if(!preg_match('/^\d+$/', $id)){
            exit;
        }

        $biz = System::B('Post');
        $this->ajax($biz->filterResult($biz->findAlbumItem($id)), 'json');
    }

}
