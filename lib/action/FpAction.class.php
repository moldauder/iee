<?php
class FpAction extends Action{

    public function index(){
        $biz = System::B('Post');

        $args = array(
            'status' => 'publish',
            'type'   => array('post', 'album'),
            'trash'  => 'n',
            'fp'     => 'y',
            'dotop'  => true
        );

        //先查询出全部的置顶项目
        $list = $biz->find($args);

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

        $this->display();
    }

}
