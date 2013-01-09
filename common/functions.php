<?php
/**
 * 通用函数集
 */
/**
 * 查询posts集合
 *
 * @param array $args 查询参数，同时也会从GET中获取，有些值不会从GET中获取
 *
 * $param string $args['id'] 起始id
 * $param number $args['num'] 数量，默认15
 * $param string $args['page'] 翻页方向 next 下一页, prev 上一页，默认next
 * $param string $args['q'] 关键字
 * $param string $args['status'] 文章状态
 * $param string $args['author'] 用户ID
 * $param string $args['trash'] 是否回收站
 *
 * @param bool $queryPageInfo 是否查询翻页信息
 *
 * @return array $postDatas 返回查询结果集
 */
function query_post($args = array(), $params = array() /*$queryPageInfo = false*/){ /* {{{ */
    $db = F('db');

    //组合条件--start
    $whereCond = array(
        "posts.type='post'"     //默认条件
    );

    $q = safe_input($args['q']);
    if($q){
        $whereCond[] = "posts.title like '%" . $q . "%'";
    }

    $author = safe_input($args['author']);
    if($author){
        $whereCond[] = "posts.author=" . $author . "";
    }

    //只从params中获取的值，防止外部刷结果
    $status = safe_input($args['status']);
    if($status){
        $whereCond[] = "posts.status='" . $status . "'";
    }

    $trash = safe_input($args['trash']);
    if(strlen($trash)){
        $whereCond[] = "posts.trash='" . $trash . "'";
    }

    $fp = safe_input($args['fp']);
    if(strlen($fp)){
        $whereCond[] = "posts.fp='" . $fp . "'";
    }

    //组合条件--end

    //翻页方向 默认下一页 -- next
    $isPagePrev = 'prev' === safe_input($args['page']);

    //where语句
    $whereStr = implode(' and ', $whereCond);

    //起始id
    $id = intval(safe_input($args['id']));
    if(0 < $id){
        $db->where($whereStr . ($whereStr ? ' and ' : '') . (' posts.id' . ($isPagePrev ? '>' : '<') . ' ' . $id));
    }else{
        $db->where($whereStr);
    }

    $num = safe_input($args['num']);
    $num = $num ? $num : 15;

    $list = $db->field('posts.*, users.nick')
               ->table('^posts posts')
               ->join('^users users on users.id=posts.author')
               ->order('posts.id ' . ($isPagePrev ? 'asc' : 'desc'))
               ->limit($num)
               ->select();

    if($isPagePrev){    //要反转顺序
        $list = array_reverse($list);
    }


    if($params['queryRelateItem']){
        //要查找关联商品信息
        foreach($list as $postData){
            if('1' === postAttr($postData->attr, POST_ATTR_RELATEITEM)){
                $postData->xitems = query_relateitem($postData->id);
            }
        }
    }

    $size = count($list);
    $ret = array();

    if(0 < $size && $params['queryPageInfo']){
        //注意排序，排在前面的时ID大的，按id降序排的
        $ret['prev'] = (bool)$db->table('^posts posts')->where($whereStr . ($whereStr ? ' and ' : '') . ' posts.id>' . $list[0]->id)->selectOne();
        $ret['next'] = (bool)$db->table('^posts posts')->where($whereStr . ($whereStr ? ' and ' : '') . ' posts.id<' . $list[$size - 1]->id)->selectOne();
    }

    $ret['list'] = $list;
    $ret['size'] = $size;

    return $ret;
} /* }}} */

/**
 * 获得一篇文章
 *
 * @param string|number $id 文章ID
 * @return object $postObject 文章对象
 */
function find_post($id){
    $db = F('db');
    return $db->field('posts.*, users.nick, users.username')
        ->table('^posts posts')
        ->join('^users users on users.id=posts.author')
        ->where('posts.id=' . $id)
        ->selectOne();
}

/**
 * 查找关联商品
 */
function query_relateitem($postId){
    $db = F('db');
    return $db->table('^posts')
        ->field('id,title,content,outer_url,img')
        ->where("sid=" . $postId . " and type='relateitem'")
        ->order('id asc')
        ->select();
}

/**
 * 标准输出流
 */
function stdpost($post, $headerTag = 'h2'){
    $html = '<div class="stdpost" data-id="' . $post->id . '"><div class="core">';

    //图片
    $html .= '<div class="photo">' . stdpost_photo($post) . '</div>';

    //内容部分
    $html .= '<div class="detail">';

    $headerTag = 'h2' === $headerTag ? 'h2' : 'h1';
    $html .= '<' . $headerTag . ' class="title">' . $post->title . '</' . $headerTag . '>';

    //描述
    $content = $post->content;
    $author_3rd = $post->author_3rd;
    if($author_3rd){
        $author_3rd = '（来自 ' . $author_3rd . '）';
        if('</p>' === strtolower(substr($content, -4))){
            $content = substr_replace($content, $author_3rd . '</p>', -4);
        }else{
            $content .= $author_3rd;
        }
    }


    $html .= '<div class="content">' . $content . '</div>';

    //价格
    if($post->price){
        $html .= '<div class="price">' . $post->price . '</div>';
    }

    //链接---分享灵感用js生成
    $viewLink = empty($post->buylink) ? $post->outer_url : $post->buylink;

    $html .= '<div class="action">';

    if($viewLink){
        $html .= '<a class="go-view" href="' . $viewLink . '">点此拥有</a>';
    }

    $html .= '<ins class="share-holder"></ins>';
    $html .= '</div></div></div>';

    //管理商品
    if($post->relateitem){
        $html .= '<div class="relateitem">';
        foreach($post->relateitem['list'] as $idx => $item){
            $html .= '<a href="/' . $post->id . '?subitem=' . ($idx + 1) . '" title="' . $item->title . '">' .
                        '<img src="' . $item->img . '" /><div class="extra"><div class="mask"></div>' .
                        '<div class="title">' . $item->title . '</div><div class="desc">' . $item->content . '</div>' .
                    '</div></a>';
        }
        $html .= '</div>';
    }

    return $html .'</div>';
}

/**
 * $data['title']
 * $data['url']
 */
function stdshare($title, $url){
    return 'http://v.t.sina.com.cn/share/share.php?appkey=1859607314&ralateUid=2802115114&title=' . urlencode($title) . '&url=' . urlencode($url);
}

function stdpost_photo($post, $imgWidth = '320', $imgHeight = '420'){
    $viewLink = empty($post->buylink) ? $post->outer_url : $post->buylink;
    return '<a href="' . $viewLink . '" title="' . $post->title . '"><img width=' . $imgWidth . ' height=' . $imgHeight . ' src="'.$post->img.'"/></a>';
}

/**
 * post值查询与更新值
 */

//SELECT SUBSTRING('Sakila', -1, 1); => a
//从右到左定义，保持增长而不影响原来的数据
define('POST_ATTR_RELATEITEM', -1);
define('POST_ATTR_SUBMITURL', -2);

function postAttr($data, $pos, $newval = null){
    $len = strlen($data);
    $diff = $pos + $len; //如果pos没有越界，那么$diff >= 0

    if(is_null($newval)){   //查询
        //这里不能越界--substr的$pos允许越界，需要自己额外判断
        return ($diff >= 0) ? substr($data, $pos, 1) : null;
    }else{
        //返回更新后的$data
        if($diff < 0){
            //如果长度不够就要补全，也正说明要加上的位置在最左边
            return $newval . str_pad($data, -1 - $pos, '0', STR_PAD_LEFT);
        }else{
            //更新指定位置
            return substr($data, 0, $diff) . $newval . substr($data, $diff + 1);
        }
    }
}



/**
 * 解析商品链接等
 */
function parseOuterUrl($url){
    $parts = parse_url(strtolower($url));
    if(false === $parts){
        return false;
    }

    $host = '';
    $hostname = $parts['host'];

    if('item.taobao.com' === $hostname || 'meal.taobao.com' === $hostname || 'item.beta.taobao.com' === $host){
        $host = 'taobao';
    }else if('item.tmall.com' === $hostname || 'detail.tmall.com' === $hostname){
        $host = 'tmall';
    }

    $ret = array();

    if($host){
        $ret['host'] = $host;

        if('taobao' === $host || 'tmall' === $host){
            parse_str($parts['query'], $query);
            $item_id = $query['id'];

            if(preg_match('/^\d+$/', $item_id)){
                $taoke = F('taoke');
                $iteminfo = $taoke->getItem($item_id);
                if(false !== $iteminfo){
                    $ret['price'] = $iteminfo['price'];
                    $ret['onsale'] = $iteminfo['onsale'];
                    $ret['price_unit'] = $iteminfo['price_unit'];
                    $ret['buylink'] = $iteminfo['buylink'];
                }
            }
        }
    }

    return $ret;
}

/**
 * 尝试获取页面标题
 *
 * @todo taobao detail 302 add cookie
 */
function getURLTitle($url){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $content = curl_exec($ch);

    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $charset = '';

    if($contentType && preg_match('/\bcharset=(.+)\b/i', $contentType, $matches)){
        $charset = $matches[1];
    }

    curl_close($ch);

    if(strlen($content) > 0 && preg_match('/\<title\b.*\>(.*)\<\/title\>/i', $content, $matches)){
        $title = $matches[1];

        if(!$charset && preg_match_all('/\<meta\b.*\>/i', $content, $matches)){
            //order:
            //http header content-type
            //meta http-equiv content-type
            //meta charset
            foreach($matches as $match){
                $match = strtolower($match);
                if(strpos($match, 'content-type') && preg_match('/\bcharset=(.+)\b/', $match, $ms)){
                    $charset = $ms[1];
                    break;
                }
            }

            if(!$charset){
                //meta charset=utf-8
                //meta charset='utf-8'
                foreach($matches as $match){
                    $match = strtolower($match);
                    if(preg_match('/\bcharset=([\'"])?(.+)\1?/', $match, $ms)){
                        $charset = $ms[1];
                        break;
                    }
                }
            }
        }

        return $charset ? iconv($charset, 'utf-8', $title) : $title;
    }

    return $url;
}
