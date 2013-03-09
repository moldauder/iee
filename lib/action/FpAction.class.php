<?php
class FpAction extends Action{

    public function index(){
        $biz = System::B('Post');

        $args = array(
            'status' => 'publish',
            'type'   => array('post', 'album'),
            'trash'  => 'n',
            'fp'     => 'y',
            'cat'    => $_GET['cat'],
            'dotop'  => true
        );

        $cat = $_GET['cat'];
        if($cat){
            $catBiz = System::B('Category');
            $catObj = $catBiz->getCatByAlias($cat);
            if($catObj){
                $this->assign('catObj', $catObj);
                $args['cat'] = $catObj->id;
            }
        }

        //先查询出全部的置顶项目
        $list = $biz->find($args);
        $this->assign('startId', $list[count($list) - 1]->id);

        //还差多少需要读取
        $left = 15 - count($list);
        if($left > 0){
            $args['limit'] = $left;
            $args['dotop'] = false;

            $list2 = $biz->find($args);
            if($list2){
                $this->assign('startId', $list2[count($list2) - 1]->id);
                $list = array_merge($list, $list2);
            }
        }

        $this->assign('list', $list);

        //读取分类信息
        $catBiz = System::B('Category');
        $this->assign('categoryList', $catBiz->find());

        $this->display();
    }

}
