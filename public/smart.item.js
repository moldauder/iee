(function(){
    //转换分享链接
    function ps(){
        $('ins.post-share').each(function(){
            var $box = $(this).parents('.stdpost');
            var str = $('.title', $box).text() + '。' + $('.content', $box).text(), len = 108;
            str = str.length > len ? (str.substr(0, len - 3) + '...') : str;

            $(this).replaceWith($('<a>分享灵感</a>').attr('href', 'http://v.t.sina.com.cn/share/share.php?appkey=1859607314&ralateUid=2802115114&' + $.param({
                pic: $('img', $box).attr('src'),
                url: location.href,
                title: encodeURIComponent('#中意一味# ' + str)
            })));
        });
    }

    ps();
})();
