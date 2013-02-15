KISSY.add('iee/fp.base', function(S, DOM, Event){

    var Base = {};

    var MonthName = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    /*
     * 2012-12-12 23:23:23
     * 2012-20-12
     */
    Base.stddate = function(timeStr){
        var ymd = timeStr.split(' ')[0].split('-');
        if(3 === ymd.length){
            var idx = ymd[1] - 1;
            if(-1 < idx && idx < 12){
                ymd[1] = MonthName[idx];
            }

            return '<div class="stddate">' +
                '<span class="day">' + ymd[2] + '</span>' +
                '<span class="month">' + ymd[1] + '</span>' +
                '<span class="year">' + ymd[0] + '</span>' +
                '</div>';
        }
        return '';
    };

    Base.filterHtmlTag = function(html){
        var el = document.createElement('div');
        el.innerHTML = html;
        return DOM.text(el);
    };

    Base.shareLink = function(data){
        return 'http://v.t.sina.com.cn/share/share.php?appkey=1859607314&ralateUid=2802115114&' + S.param(data);
    };

    function createShareEl(holder, data){
        var trigger = document.createElement('a');
        trigger.innerHTML = '分享灵感';
        trigger.className = 'go-share';
        trigger.target = '_blank';
        trigger.href = Base.shareLink(data);
        holder.parentNode.replaceChild(trigger, holder);
    }

    function packShareText(title, desc){
        var str = title + '，' + desc, len = 108;
        str = str.length > len ? (str.substr(0, len - 3) + '...') : str;
        return encodeURIComponent('#中意一味# ' + str);
    }

    //转换分享文章占位符
    Base.parsePostShare = function(root){
        S.each(DOM.query('ins.post-share', root || document.body), function(holder){
            var box = DOM.parent(holder, 'div.stdpost');
            if(box){
                createShareEl(holder, {
                    pic: DOM.attr(DOM.get('img', box), 'src'),
                    url: location.href, //标准情况下，分享对应的地址
                    title: packShareText(DOM.html(DOM.get('.title', box)), Base.filterHtmlTag(DOM.html(DOM.get('div.content', box))))
                });
            }
        });
    };

    Base.init = function(){
        Event.on(document.body, 'click', function(ev){
            var target = ev.target;
            var act = (DOM.attr(target, 'data-act') || '').split('/');

            if(2 !== act.length){ return; }
            if('A' === target.nodeName){ ev.preventDefault(); }

            var method = act[1];
            var pos = method.indexOf(':');
            var args = [target];
            if(-1 < pos){
                try{
                    args = args.concat(eval('[' + method.substr(pos + 1) + ']'));
                }catch(e){}

                method = method.substr(0, pos);
            }

            S.use('iee/' + act[0], function(S, Module){
                Module[method].apply(Module, args);
            });
        });

        S.use('iee/fp.gotop', function(S, GoTop){
            GoTop.init();
        });
    };

    return Base;

}, {
    requires: ['dom', 'event']
});
