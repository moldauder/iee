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
        $num = 12;

        $params = array(
            'id'            => $_GET['id'],
            'fp'            => 'fp' === $_GET['from'] ? 'y' : '',
            'author'        => $_GET['author'],
            'status'        => 'publish',
            'trash'         => 'n',
            'num'           => $num,
            'queryPageInfo' => true,
        );

        if($_GET['author']){
            $params['queryRelateInfo'] = true;
        }

        $postModel = F('PostModel');

        if(!$params['id']){
            //query dotop post first
            $topPosts = $postModel->findTopPosts($params);
            $topNum = count($topPosts);

            if($topNum < $num){
                $params['num'] = $num - count($topPosts);
            }else{
                $topNum - 0;
            }
        }

        $params['excludeTopPost'] = true;

        $result = $postModel->find($params);
        if($topNum){
            $result['list'] = array_merge($topPosts, $result['list']);
            $result['size'] = $num;
        }

        $this->jsonp($result);
    }

    /**
     * item单品页
     */
    public function item(){
        $id = $_GET['id'];
        $postModel = F('PostModel');

        if(preg_match('/^\d+$/', $_GET['subitem'])){
            //展示专辑里的某个单品，仅展示它自己
            $relateitems = $postModel->findRelateItems($id);
            $pos = intval($_GET['subitem']);
            if($relateitems && count($relateitems['list']) >= $pos){
                $this->assign('postData', $relateitems['list'][$pos - 1]);
                $this->assign('isRelateItem', true);
                $this->display('item');
            }
        }

        $postData = $postModel->getPostById($id, array(
            'status'          => 'publish',
            'trash'           => 'n',
            'queryRelateInfo' => true,
        ));

        $isAjax = 'json' === $_GET['type'];

        if($postData){
            $isComplexItem = $postData->relateitem;

            if(!$isComplexItem){
                $authorID = $postData->author;

                $this->assign('recentPostResult', $postModel->find(array(
                    'num'         => 7,
                    'author'      => $authorID,
                    'status'      => 'publish',
                    'trash'       => 'n'
                )));

                //查询作者的文章总数
                $this->assign('postsNum', $postModel->count(array(
                    'author'    => $authorID,
                    'status'    => 'publish',
                    'trash'     => 'n'
                )));
            }

            $this->assign('isComplexItem', $isComplexItem);

            $realId = $postData->id;

            $this->assign('prevPostData', $postModel->findOne(array(
                'id'     => $realId,
                'page'   => 'prev',
                'status' => 'publish',
                'trash'  => 'n'
            )));

            $this->assign('nextPostData', $postModel->findOne(array(
                'id'     => $realId,
                'page'   => 'next',
                'status' => 'publish',
                'trash'  => 'n'
            )));

            $this->assign('postData', $postData);

            if($isAjax){
                $this->display('item-panel-content');
            }else{
                $this->display('item');
            }
        }else{
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
        $userModel = F('UserModel');
        $authorData = $userModel->getUserByName($_GET['username']);

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
     * about
     */
    public function about(){
        $this->display();
    }

    /**
     * 404
     */
    public function pageNotFound(){
        $this->display('index');
    }

}
