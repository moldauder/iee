<?php
class FpAction extends Action{

    public function index(){
        $this->adapterHost();

        if(FP_PAGE_TYPE === 'thing'){   //好物的访问
            //读取分类信息
            $catBiz = System::B('Category');
            $this->assign('categoryList', $catBiz->find('item'));

            $cat = $_GET['cat'];
        }else{
            if(FP_PAGE_TYPE === 'view'){
                $cat = 'view';
            }else  if(FP_PAGE_TYPE === 'inspiration'){
                $cat = 'inspiration';
            }
        }

        //分类信息
        if($cat){
            $catBiz = System::B('Category');
            $catObj = $catBiz->getCatByAlias($cat);
            if($catObj){
                $this->assign('catObj', $catObj);
            }
        }

        //查询资讯关键轮播
        if(FP_PAGE_TYPE === 'fp'){
            $informationBiz = System::B('Information');
            $sliderInfos = $informationBiz->find(array(
                'status' => 'publish',
                'type'   => array('post'),
                'fp' => 'y'
            ));
            $this->assign('sliderInfos', $sliderInfos);
        }

        $this->assign('isMobile', $this->getMobileDetecter()->isMobile());
        $this->display();
    }
}
