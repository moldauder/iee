<?php
class IndexAction extends Action{

    /**
     * 首页
     */
    public function index(){
        $this->display();
    }

    /**
     * 前台post查询接口
     */
    public function query(){
        $params = array(
            'id'            => $_GET['id'],
            'fp'            => 'fp' === $_GET['from'] ? 'y' : '',
            'author'        => $_GET['author'],
            'status'        => 'publish',
            'trash'         => 'n',
            'queryPageInfo' => true,
        );

        if($_GET['author']){        //如果有作者信息，那么可以认为是来自于作者集合页，需要查找关联商品
            $params['queryRelateInfo'] = true;
        }

        $model = F('PostModel');
        $this->jsonp($model->select($params));
    }

    /**
     * item单品页
     */
    public function item(){
        $id = $_GET['id'];
        $model = F('PostModel');

        if(preg_match('/^\d+$/', $_GET['subitem'])){
            //展示专辑里的某个单品，仅展示它自己
            $relateitems = $model->findRelateItems($id);
            $pos = intval($_GET['subitem']);
            if($relateitems && count($relateitems) >= $pos){
                $this->assign('postData', $relateitems[$pos - 1]);
                $this->assign('isRelateItem', true);
                $this->display('item');
            }
        }

        $postData = $model->selectOne(array(
            'id'                => $id,
            'status'            => 'publish',
            'trash'             => 'n',
            'queryPageInfo'     => true,
            'queryRelateInfo'   => true
        ));

        $isAjax = 'json' === $_GET['type'];

        if($postData){
            $isComplexItem = (bool)$postData->relateitem;

            if(!$isComplexItem){
                $authorID = $postData->author;

                $this->assign('recentPostResult', $model->select(array(
                    'num'         => 7,
                    'author'      => $authorID,
                    'status'      => 'publish',
                    'trash'       => 'n'
                )));

                //查询作者的文章总数
                $this->assign('postsNum', $model->count(array(
                    'author'    => $authorID,
                    'status'    => 'publish',
                    'trash'     => 'n'
                )));
            }

            $this->assign('isComplexItem', $isComplexItem);
            $this->assign('prevPostData', $model->selectOne(array(
                'id'        => $id,
                'page'      => 'prev',
                'status'    => 'publish',
                'trash'     => 'n'
            )));
            $this->assign('nextPostData', $model->selectOne(array(
                'id'        => $id,
                'page'      => 'next',
                'status'    => 'publish',
                'trash'     => 'n'
            )));
            $this->assign('postData', $postData);

            if($isAjax){
                $this->display('item-panel-content');
            }else{
                $this->display('item');
            }
        }else{
            //说明文件不存在，转到404模块去
            if($isAjax){
                print 'not found';
            }else{
                $this->pageNotFound();
            }
        }
    }

    /**
     * 作者集合页
     */
    public function author(){
        $model = F('UserModel');

        $authorData = $model->selectOne(array(
            'username' => $_GET['username']
        ));

        if($authorData){
            $this->assign('authorData', $authorData);
            $this->display();
        }else{
            $this->pageNotFound();
        }
    }

    /**
     * submit提交
     */
    public function submit(){
        $url = trim(safe_input($_POST['url']));
        if($url){
            $model = F('SubmitUrlModel');
            $model->add(array(
                'url' => $url,
                //'title' => getURLTitle($url),  //@todo 自动获取title
                'title' => '',
                'remark' => safe_input($_POST['remark']),
                'nick' => safe_input($_POST['nick']),
                'weibo' => safe_input($_POST['weibo']),
                'status' => 's'
            ));
        }
    }

    /**
     * 404
     */
    public function pageNotFound(){
        $this->display('index');
    }

}
