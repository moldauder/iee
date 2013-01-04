/**
 * 入口基本功能库
 */
window.iee = function(){
    var S     = KISSY;
    var DOM   = S.DOM;
    var Event = S.Event;
    var Anim  = S.Anim;

    var util = {};

    var MonthName = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    /**
     * 把timeStr转化成Y-m-d，m是英文
     *
     * 2012-12-12 23:23:23
     * 2012-20-12
     */
    util.stddate = function(timeStr){
        var ymd = timeStr.split(' ')[0].split('-');
        if(3 === ymd.length){
            var idx = ymd[1] - 1;
            if(-1 < idx && idx < 12){
                ymd[1] = MonthName[idx];
            }

            return '<div class=stddate>' +
                '<span class=day>' + ymd[2] + '</span>' +
                '<span class=month>' + ymd[1] + '</span>' +
                '<span class=year>' + ymd[0] + '</span>' +
                '</div>';
        }
        return '';
    };

    /**
     * 取得纯文字
     */
    util.filterHtmlTag = function(html){
        var el = document.createElement('div');
        el.innerHTML = html;
        return DOM.text(el);
    };

    /**
     * 分享链接生成
     */
    util.shareLink = function(data){
        return 'http://v.t.sina.com.cn/share/share.php?appkey=1859607314&ralateUid=2802115114&' + S.param(data);
    };

    /**
     * 自动创建shareLink
     *
     * 自动寻找 ins.share-holder，然后创建分享按钮
     * 目前支持：
     * 1、stdpost
     */
    function createShareEl(holder, data){
        var trigger = document.createElement('a');
        trigger.innerHTML = '分享灵感';
        trigger.className = 'go-share';
        trigger.target = '_blank';
        trigger.href = util.shareLink(data);
        holder.parentNode.replaceChild(trigger, holder);
    }

    function packShareText(title, desc){
        var str = title + '，' + desc, len = 108;
        str = str.length > len ? (str.substr(0, len - 3) + '...') : str;
        return encodeURIComponent('#中意一味# ' + str);
    }

    util.stdShareHolder = function(root){
        S.each(DOM.query('ins.share-holder', root || '#content'), function(holder){
            var box = DOM.parent(holder, 'div.stdpost');
            if(box){
                var headerEl = DOM.get('h1.title', box) || DOM.get('h2.title');
                if(headerEl){
                    createShareEl(holder, {
                        pic: DOM.attr(DOM.get('img', box), 'src'),
                        url: location.href, //标准情况下，分享对应的地址
                        title: packShareText(headerEl.innerHTML, util.filterHtmlTag(DOM.html(DOM.get('div.content', box))))
                    });
                }
            }
        });
    }

    var runItems = [
        //返回顶部
        function(){
            var el = DOM.create('<span id="go-top" hideFocus="true" href="#top"></span>');
            var gif = 'http://pic.yupoo.com/iewei/Cam6yIZo/XryK.gif';
            var staticHtml = '<s></s>';
            var dynamicHtml = '<img src="' + gif + '" width="67" height="60" />';
            var status = 'hide';

            new Image().src = gif;

            Event.on(el, 'mousedown', S.UA.ie ? function(){
                window.scrollTo(0,0);
                this.style.display = 'none';
                status = 'hide';
            } : function(){
                (new Anim(window, {scrollTop: 0} , Math.min(0.2 * DOM.scrollTop() / 800, 1), 'easeOut', function(){
                    el.style.display = 'none';
                    status = 'hide';
                })).run();
            });

            Event.on(el, 'mouseenter', function(){
                el.innerHTML = dynamicHtml;
            });

            Event.on(el, 'mouseleave', function(){
                el.innerHTML = staticHtml;
            });

            Event.on(window, 'scroll', function(){
                var scrollTop = DOM.scrollTop();
                if(scrollTop > 200 && status !== 'show'){
                    el.innerHTML = staticHtml;
                    el.style.display = 'block';
                    status = 'show';
                    (new Anim(el, {opacity: 0.9}, 0.4, 'easeOut')).run();
                }else{
                    if(scrollTop === 0 && status !== 'hide'){
                        (new Anim(el, {opacity: 0}, 0.4, 'easeOut', function(){
                            el.style.display = 'none';
                            status = 'hide';
                        })).run();
                    }
                }
            });

            document.body.appendChild(el);
        },
        function(){ //初始化分享链接
            util.stdShareHolder();
        }
    ];

    //其他初始化
    S.ready(function(){
        S.each(runItems, function(fn){
            fn();
        });
    });

    return {
        util: util
    };
}();
