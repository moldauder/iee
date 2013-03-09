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

        //精简数据
        //默认type为string
        foreach($list as $catObj){
            foreach($catObj as $property => $value){
                if((is_null($value) || '' === $value) || ('string' === $value && 'type' === $property)){
                    unset($catObj->$property);
                }
            }
        }

        return $list;
    }

    public function getCatByAlias($alias){
        return $this->getDBConnection()->table($this->tableName)->where('alias', $alias)->selectOne();
    }
}
