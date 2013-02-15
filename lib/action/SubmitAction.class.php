<?php
class SubmitAction extends AuthAction{

    public function _initialize(){
        if('commit' !== System::config('method_name')){
            $this->checkLogin();

            if(!IS_SUPER_USER){
                $this->assign('errMsg', '您没有权限访问此页面');
                $this->display('my:err');
            }
        }
    }

    public function commit(){
        $url = trim(System::filterVar($_POST['url']));
        if($url){
            return;
        }

        $model = System::M('SubmitUrl');
        $model->add(array(
            'url'     => $url,
            //'title' => getURLTitle($url),  //@todo 自动获取title
            'title'   => '',
            'remark'  => System::filterVar($_POST['remark']),
            'nick'    => System::filterVar($_POST['nick']),
            'weibo'   => System::filterVar($_POST['weibo']),
            'status'  => 's'
        ));
    }

    /**
     * 列出所有的submit
     */
    public function all(){
        $userBiz = System::B('User');
        $this->assign('userList', $userBiz->getAllUser());

        $args = array(
            'status' => System::filterVar($_GET['status']),
            'agency' => System::filterVar($_GET['agency']),
            'page'   => System::filterVar($_GET['page']),
            'id'     => System::filterVar($_GET['id'])
        );

        $args['status'] = $args['status'] ? $args['status'] : 's';
        $this->assign('args', $args);

        $submitBiz = System::B('Submit');
        $list = $submitBiz->find($args);

        //上一页、下一页判定
        $total = count($list);
        if(0 < $total){
            $args['id'] = $list[0]->id;
            $args['page'] = 'prev';
            $this->assign('hasPrev', 0 < count($submitBiz->find($args)));

            $args['id'] = $list[$total - 1]->id;
            $args['page'] = 'next';
            $this->assign('hasNext', 0 < count($submitBiz->find($args)));
        }

        $this->assign('submitList', $list);
        $this->display();
    }

    /**
     * 设置状态为通过
     */
    public function pass(){
        list($actionName, $methodName, $id) = System::$queryvars;

        if(!preg_match('/^\d+$/', $id)){
            exit;
        }

        $biz = System::B('Submit');

        if(true === $biz->pass($id)){
            $obj = $biz->getSubmitById($id);

            $this->ajax(array(
                'success'    => true,
                'id'         => $obj->id,
                'postid'     => $obj->postid,
                'agencyNick' => $obj->agencyNick
            ), 'json');
        }else{
            $this->ajax(array(
                'success' => false,
                'msg'     => $biz->getDBError()
            ), 'json');
        }
    }

    public function remove(){
        list($actionName, $methodName, $id) = System::$queryvars;

        if(!preg_match('/^\d+$/', $id)){
            exit;
        }

        $biz = System::B('Submit');

        if(true === $biz->remove($id)){
            $this->ajax(array(
                'success' => true
            ), 'json');
        }else{
            $this->ajax(array(
                'success' => false,
                'msg'     => $biz->getDBError()
            ), 'json');
        }
    }

}
