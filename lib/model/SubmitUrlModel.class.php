<?php
class SubmitUrlModel extends Model{

    public function add($data){
        if(0 !== strpos($data['url'], 'http://')){
            $data['url'] = 'http://' . $data['url'];
        }
        return $this->db->table('^submit_url')->data($data)->add();
    }

}
