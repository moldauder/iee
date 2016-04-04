$(function(){
    var $root = $(window);

    var $el = $('<span class="gotop" hideFocus="true"></span>');
    var gif = '//pic.yupoo.com/iewei/Cam6yIZo/XryK.gif';
    var status = 'hide';

    //预加载鼠标hover之后的图片
    new Image().src = '//pic.yupoo.com/iewei/Cam6yIZo/XryK.gif';

    $el.click(function(){
        $(document.body).animate({
            scrollTop: 0
        }, Math.min(0.2 * $root.scrollTop() / 800, 1), 'linear', function(){
            $el.css('opacity', 0);
            status = 'hide';
        });
    });

    $el.mouseenter(function(){
        $el.addClass('gotop-hover');
    });

    $el.mouseleave(function(){
        $el.removeClass('gotop-hover');
    });

    $root.scroll(function(){
        var scrollTop = $root.scrollTop();
        if(scrollTop > 200 && status !== 'show'){
            status = 'show';
            $el.animate({
                opacity: 0.9
            }, 0.4, 'linear');

            status = 'show';
        }else if(scrollTop === 0 && status !== 'hide'){
            $el.animate({
                opacity: 0
            }, 0.4, 'linear');

            status = 'hide';
        }
    });

    $el.appendTo($(document.body));
});
