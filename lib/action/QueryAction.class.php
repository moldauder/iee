<?php
class QueryAction extends Action{

    //查询商品 + information
    public function all(){
        $queryItem = true;
        if($_GET['noItem'] === 'true'){
            $queryItem = false;
        }

        if($queryItem){
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
            $list = $biz->filterResult($list);  //过滤结果

        }else{
            $list = array();
        }

        $ajaxData = array(
            'items' => $list
        );

        //测试是否需要查询information，标志位：i=y
        $hasInfo = false;
        if($_GET['information'] === 'true'){
            $ajaxData['infos'] = $this->fetchInformations();
        }else{
            $ajaxData['infos'] = array();
        }

        $this->ajax($ajaxData, 'json');
    }

    private function fetchInformations(){
        $args = array(
            'status' => 'publish',
            'type'   => array('post'),
            'limit'  => 12,
            'id'     => $_GET['info_id'],
            'cat'    => $_GET['cat'],
            'page'   => 'next'
        );

        $biz = System::B('Information');
        $list = $biz->find($args);
        $list = $biz->filterResult($list);

        //增加一个时间表达
        foreach ($list as $vo) {
            $date = strtotime($vo->modified);
            $vo->dateStr = date('jS M Y', $date);
        }

        return $list;
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
