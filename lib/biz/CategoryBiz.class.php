<?php
/**
 * 文章分类控制
 *
 * 通过category字段标识细分品类，其中
 *      category=item 好物
 *      category=view view
 *      category=inspiration 灵感
 */
class CategoryBiz extends Biz{

    private $tableName = '^category';

    /**
     * @param {String|Array} $category 查询哪个分类下的类目
     */
    public function find($category){
        $where = array();
        $category = is_array($category) ? $category : array($category);
        foreach ($category as $item) {
            $where[] = '"' . $item . '"';
        }

        $list = $this->getDBConnection()
            ->table($this->tableName)
            ->where('category in (' . implode(',', $where) . ')')
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
