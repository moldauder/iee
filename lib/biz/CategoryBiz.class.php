<?php
/**
 * 文章分类控制
 */
class CategoryBiz extends Biz{

    private $tableName = '^category';

    public function find(){
        $list = $this->getDBConnection()
            ->table($this->tableName)
            ->order('id asc')
            ->select();

        return $list;
    }

}
