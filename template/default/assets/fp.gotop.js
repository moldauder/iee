KISSY.add('iee/fp.gotop', function(S, DOM, Event, Anim){

    var GoTop = {};

    GoTop.init = function(){
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

        S.ready(function(){
            document.body.appendChild(el);
        });

    };

    return GoTop;
}, {
    requires: ['dom', 'event', 'anim']
});
