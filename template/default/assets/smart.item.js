(function(){
    var $el = $('.stdpost');

    var $detail = $('.detail', $el);
    var detailLeft = $detail.css('left');
    var detailOpacity = $detail.css('opacity');

    //全部模式:
    //img 当前在看图片
    //detail 在看详细的内容
    var mode = 'img';

    $($el)
    .on('swipeLeft', function(ev){
        ev.preventDefault();
        if('img' === mode){
            $detail.animate({
                left: 0,
                opacity: 0.9
            }, 500, 'ease-out', function(){
                mode = 'detail';
            });
        }
    })
    .on('swipeRight', function(){
        if('detail' === mode){
            $detail.animate({
                left: detailLeft,
                opacity: detailOpacity
            }, 500, 'ease-out', function(){
                mode = 'img';
            });
        }
    });

    //转换分享链接
    function ps(){
        $('ins.post-share').each(function(){
            var $box = $(this).parents('.stdpost');
            var str = $('.title', $box).text() + '，' + $('.content', $box).text(), len = 108;
            str = str.length > len ? (str.substr(0, len - 3) + '...') : str;

            $(this).replaceWith($('<a>分享灵感</a>').attr('href', 'http://v.t.sina.com.cn/share/share.php?appkey=1859607314&ralateUid=2802115114&' + $.param({
                pic: $('img', $box).attr('src'),
                url: location.href,
                title: encodeURIComponent('#中意一味# ' + str)
            })));
        });
    }

    ps();

    window.scrollTo(0, 0);
})();
