<?php
/**
 * 数据库操作类
 *
 */
class Db implements Iterator{

    protected $_linkID   = 0;
    protected $_queryID  = 0;
    protected $_error    = '';
    protected $_hasTrans = false;
    protected $_config;

    protected $_options = array();
    protected $_lastSql = '';

    protected $_position = 0;
    protected $_length = 0;
    protected $_resultSet = array();


    private static $instance;

    public static function getInstance(){
        if(!self::$instance){
            self::$instance = new Db(array(
                'db_host'     => System::config('db_host'),
                'db_name'     => System::config('db_name'),
                'db_user'     => System::config('db_user'),
                'db_password' => System::config('db_password'),
                'db_port'     => System::config('db_port'),
                'db_charset'  => System::config('db_charset'),
                'db_prefix'   => System::config('db_prefix')
            ));
        }

        return self::$instance;
    }

    public function __construct($config = array()){
        $this->_config = $config;
        $this->_initConnect();
        $this->_reset();
    }

    public function __destruct(){
        $this->close();
    }

    protected function _escapeWhere($key, $value, $operator = '='){
        if(is_array($key)){
            $arr = array();
            foreach($key as $item){
                $arr[] = call_user_func_array(array($this, '_escapeWhere'), $item);
            }
            return implode(' AND ', $arr);
        }else{
            if($value){
                return $key . ' ' . $operator . ' ' . $this->_escapeColumnValue($value);
            }else{
                return $key;
            }
        }
    }

    /**
     *
     * $db->where('a=3');
     *
     * $db->where($key, $operator, $value)
     *
     * // (cond1 and cond2)
     * $db->where(array(
     *   array($key, $operator, $value),
     *   array($key, $operator, $value)
     * ))
     *
     */
    public function where($key, $value, $operator = '='){
        $where = $this->_options['where'];

        //first where cond do not need logic operator
        if(!empty($where)){
            $logic = $this->_options['logic'];
            $where[] = $logic ? $logic : ' AND ';
        }

        $where[] = $this->_escapeWhere($key, $value, $operator);
        $this->_options['where'] = $where;
        $this->_options['logic'] = '';

        return $this;
    }

    public function logic($operator = 'AND'){
        $this->_options['logic'] = ' ' . trim(strtoupper($operator)) . ' ';
        return $this;
    }

    public function table($data){
        $this->_setPartOfSql('table', $data, ',');
        return $this;
    }

    public function field($data){
        $this->_setPartOfSql('field', $data, ',');
        return $this;
    }

    public function group($data){
        $this->_options['group'] = $data;
        return $this;
    }

    public function order($data){
        $this->_setPartOfSql('order', $data, ',');
        return $this;
    }

    public function limit($data){
        $this->_options['limit'] = $data;
        return $this;
    }

    public function join($data){
        $data = is_array($data) ? $data : array($data);

        $arr = array();
        foreach($data as $val){
            $arr[] = 'LEFT JOIN ' . $val;
        }

        $this->_setPartOfSql('join', $arr, ' ');
        return $this;
    }

    /**
     * // insert into table set username='xx', pwd='', nick=''
     * $db->data(array(
     *      'username' => 'xian',
     *      'pwd' => '342423xcsdgt23as',
     *      'nick' => 'qian'
     * ));
     *
     * // insert into table values (), ()....
     * $db->data(array(
     *      array(),
     *      array()
     * ))
     */
    public function data($data){
        $this->_options['data'] = $data;
        return $this;
    }

    public function query($sql = ''){
        if(!$this->_linkID){
            return false;
        }

        $sql = trim($sql);
        if(!empty($sql)){
            $this->free();  //释放上一次的查询
            $this->_lastSql = $sql;

            /*
             * for select, show, describe, explain return resourceID, or false on _error
             * other type, like insert, update, delete, drop. return true on success or false on _error
             */
            $this->_queryID = mysql_query($sql, $this->_linkID);
            Logger::record($sql, Logger::SQL);

            if(false === $this->_queryID){
                $this->error();
                return false;
            }else{
                if(true === $this->_queryID){
                    return true;
                }else{
                    $result = array();
                    $length = 0;

                    while($object = mysql_fetch_object($this->_queryID)){
                        $result[] = $object;
                        $length++;
                    }

                    mysql_data_seek($this->_queryID, 0);

                    $this->_resultSet = $result;
                    $this->_length = $length;
                    return $result;
                }
            }
        }
    }

    public function current(){
        return $this->_resultSet[$this->_position];
    }

    public function rewind(){
        $this->_position = 0;
    }

    public function key(){
        return $this->_position;
    }

    public function next(){
        ++$this->_position;
    }

    public function valid(){
        return $this->_position < $this->_length;
    }

    public function getLastInsID(){
        return mysql_insert_id($this->_linkID);
    }

    public function getLastSql(){
        return $this->_lastSql;
    }

    public function getLastNumRows(){
        return mysql_affected_rows($this->_linkID);
    }

    public function select(){
        return $this->_execute('select');
    }

    public function selectOne($options = array()){
        $options['limit'] = 1;
        $res = $this->select($options);
        if(false !== $res){
            return $res[0];
        }
        return null;
    }

    public function col($columnName){
        $data = $this->selectOne();
        if($data){
            if(is_integer($columnName)){
                $data = array_values(get_object_vars($data));
                if(0 <= $columnName && $columnName < count($data)){
                    return $data[$columnName];
                }
            }else{
                return $data->$columnName;
            }
        }
        return null;
    }

    public function count($field = ''){
        return $this->field('COUNT(' . ($field ? $field : '*') . ')')->col(0);
    }

    public function delete(){
        return $this->_execute('delete');
    }

    public function add(){
        return $this->_execute('add');
    }

    public function save(){
        return $this->_execute('save');
    }

    protected function _escapeString($data){
        if($this->__linkID) {
            return mysql_real_escape_string($data, $this->_linkID);
        }else{
            return mysql_escape_string($data);
        }
    }

    public function free(){
        if(is_resource($this->_queryID)){
            mysql_free_result($this->_queryID);
            $this->_queryID = 0;
        }
        return $this;
    }

    public function startTrans(){
        if($this->_linkID){
            if(!$this->_hasTrans){
                mysql_query('START TRANSACTION', $this->_linkID);
                $this->_hasTrans = true;
            }
        }
        return $this;
    }

    public function commit(){
        if($this->_hasTrans){
            mysql_query('COMMIT', $this->_linkID);
            $this->_hasTrans = false;
        }
        return $this;
    }

    public function rollback(){
        if($this->_hasTrans){
            mysql_query('ROLLBACK', $this->_linkID);
            $this->_hasTrans = false;
        }
        return $this;
    }

    public function getError(){
        $this->_error = @mysql_error($this->_linkID);
        return $this->error;
    }

    public function error(){
        $err = '<p>' . $this->getError() . '</p>';
        if(System::config('debug_mode')){
            $err .= '<p>' . $this->_lastSql . '</p>';
        }
        System::halt($err);
    }

    public function close(){
        if($this->_linkID){
            $this->free();
            $this->_hasTrans = false;

            if(!empty($this->_linkID)){
                mysql_close($this->_linkID);
            }

            $this->_linkID = null;
        }
        return $this;
    }

    protected function _realPartSql($data, $prefix = '', $default = '', $glue = ' '){
        if(empty($data)){
            return $default;
        }else{
            return $prefix . (is_array($data) ? implode($glue, $data) : $data);
        }
    }

    protected function _parseData($data){
        if(empty($data)){
            return '';
        }

        if(is_array($data[0])){
            $arr = array();
            foreach($data as $rowData){
                $arr[] = $this->_escapeColumnValue($columnValue);
            }
            return 'VALUES ' . implode(',', $arr);
        }else{
            $arr = array();
            foreach($data as $key => $columnValue){
                $arr[] = '`' . $key . '`=' . $this->_escapeColumnValue($columnValue);
            }
            return 'SET ' . implode(',', $arr);
        }
    }

    protected function _escapeColumnValue($data){
        if(is_object($data)){
            $data = get_object_vars($data);
        }

        if(is_array($data)){
            $arr = array();
            foreach($data as $item){
                $arr[] = $this->_escapeColumnValue($item);
            }
            return '(' . implode(',', $arr) . ')';
        }

        if(is_null($data)){
            return '\'\'';
        }else if(is_string($data)){
            return '\'' . $this->_escapeString($data) . '\'';
        }else{
            return $data;
        }
    }

    protected function _options2Sql($operate){
        $options = $this->_options;

        $table = $this->_realTableName($this->_realPartSql($options['table']));
        $where = $this->_realPartSql($options['where'], 'WHERE ');
        $order = $this->_realPartSql($options['order'], 'ORDER BY ');
        $limit = $this->_realPartSql($options['limit'], 'LIMIT ');
        $data  = $this->_parseData($options['data']);

        $sql = array();
        if('select' === $operate){
            $sql[] = 'SELECT';
            $sql[] = $this->_realPartSql($options['field'], '', '*', '');
            $sql[] = 'FROM';
            $sql[] = $table;
            $sql[] = $this->_realTableName($this->_realPartSql($options['join']));
            $sql[] = $where;
            $sql[] = $this->_realPartSql($options['group']);
            $sql[] = $order;
            $sql[] = $limit;
        }else if('delete' === $operate){
            $sql[] = 'DELETE FROM';
            $sql[] = $table;
            $sql[] = $where;
            $sql[] = $order;
            $sql[] = $limit;
        }else if('add' === $operate){
            $sql[] = 'INSERT INTO';
            $sql[] = $table;
            $sql[] = $data;
        }else if('save' === $operate){
            $sql[] = 'UPDATE';
            $sql[] = $table;
            $sql[] = $data;
            $sql[] = $where;
            $sql[] = $order;
            $sql[] = $limit;
        }

        $this->_reset();
        return implode(' ', $sql);
    }

    protected function _realTableName($data){
        return str_replace('^', $this->_config['db_prefix'], $data);
    }

    protected function _execute($method){
        return $this->query($this->_options2Sql($method));
    }

    protected function _reset(){
        $this->_options = array(
            'where' => array(),
            'table' => array(),
            'field' => array(),
            'order' => array(),
            'join'  => array(),
        );
    }

    protected function _setPartOfSql($name, $data, $glue = ' '){
        $value = $this->_options[$name];
        $value[] = is_array($data) ? implode($glue, $data) : $data;
        $this->_options[$name] = $value;
    }

    protected function _initConnect(){
        if($this->_linkID){
            return $this;
        }

        $_linkID = @mysql_connect($this->_config['db_host'] . ':' . $this->_config['db_port'], $this->_config['db_user'], $this->_config['db_password'], true);
        if(false === $_linkID){
            System::halt('connect to mysql failed. ' . $this->getError());
        }
        if(!mysql_select_db($this->_config['db_name'], $_linkID)){
            System::halt('select db failed. ' . $this->getError());
        }

        mysql_query('SET NAMES \'' . $this->_config['db_charset'] . '\'', $_linkID);

        $this->_linkID = $_linkID;
        return $this;
    }

}
