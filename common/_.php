<?php

function get_post_id($postObj){
    $sid = $postObj->sid;
    return intval($sid, 10) ? $sid : $postObj->id;
}

function stdpost($post, $headerTag = 'h2'){
    $sid = get_post_id($post);

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

    if($post->relateitem){
        $html .= '<div class="relateitem">';
        foreach($post->relateitem as $idx => $item){
            $html .= '<a>' .
                        '<img width="288" height="378" src="' . $item->img . '" /><div class="extra"><div class="mask"></div>' .
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
    $viewLink = $viewLink ? ('href="' . $viewLink . '"') : '';
    return '<a '. $viewLink . ' title="' . $post->title . '"><img width=' . $imgWidth . ' height=' . $imgHeight . ' src="'.$post->img.'"/></a>';
}

/**
 * post值查询与更新值
 */

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

