(function(S){
    var DOM = S.DOM;
    var Event = S.Event;
    var IO = S.IO;
    var Anim = S.Anim;
    var JSON = S.JSON;

    var isLoadingPost = false;
    var supportHistoryAPI = history.pushState;

    var sliderEl = DOM.get('#slider');
    var marginLeft = 0;

    if(supportHistoryAPI){  //一开始就要压入一条状态信息
        history.pushState({
            id: curPostId
        }, document.title, location.href);
    }

    function updateMain(toEl, doPushState){
        var title = DOM.html(DOM.get('h1.title', toEl)) + ' | 一味';
        //更新title等
        document.title = title;

        //history
        var id = toEl.id.substr(4);
        if(supportHistoryAPI){
            if(doPushState){
                history.pushState({
                    id: id
                }, title, '/' + id);
            }
        }else{
            location.hash = '!' + id;
        }

        //重新设置trigger
        DOM.html('#trigger', DOM.val(DOM.get('textarea', toEl)));
    }

    //doPushState 是否要加入列表历史
    //默认：1 要加入，除了1之外的正值不加入
    function switchPost(toEl, doPushState){
        doPushState = 1 === (doPushState || 1);
        S.each(DOM.children(sliderEl), function(el, idx){
            if(el !== toEl){ return; }

            (new Anim(sliderEl, {
                marginLeft: - idx * 990
            }, 0.6, 'easeBothStrong', function(){
                updateMain(toEl, doPushState);
            })).run();
        });
    }

    //按下左右键翻页
    Event.on(window, 'keyup', function(ev){
        var direction = '';
        var keyCode = ev.keyCode;

        if(39 === keyCode || 34 === keyCode){  //右方向键、Page Down
            direction = 'next';
        }else if(37 === keyCode || 33 === keyCode){
            direction = 'prev';
        }

        if(direction){
            //施加一个按下的效果
            var el = DOM.get('a.' + direction, '#trigger');
            if(el){
                var cls = direction + '-hover';
                DOM.addClass(el, cls);

                (new Anim(el, {
                    opacity: 0.15
                }, 0.3, 'easeBothStrong', function(){
                    DOM.removeClass(el, cls);
                })).run();

                Event.fire(el, 'click');
            }
        }
    });

    if(supportHistoryAPI){
        window.onpopstate = function(ev){
            var state = ev.state;
            if(!state){ return; }

            var toEl = DOM.get('#post' + state.id);
            if(toEl){
                switchPost(toEl, 2);
            }
        };
    }

    Event.on('#trigger', 'click', function(ev){
        ev.halt();

        if(isLoadingPost){ return; }

        var target = ev.target;
        var id = DOM.attr(target, 'data-id');

        //如果这篇文章已经存在，那么直接切换过去就可以了
        var toEl = DOM.get('#post' + id);
        if(toEl){
            switchPost(toEl);
        }else{
            isLoadingPost = true;
            //加载文章
            IO({
                type: 'get',
                url: '/' + id + '?type=json',
                success: function(html){
                    var el = document.createElement('div');
                    el.className = 'panel';
                    el.id = 'post' + id;
                    el.innerHTML = html;

                    DOM.width(sliderEl, DOM.width(sliderEl) + 990);

                    var isPrev = DOM.hasClass(target, 'prev');
                    //@todo 校准位置
                    //动画可以简化到记录一个marginLeft
                    if(isPrev){ //是向前，则放在最前面
                        DOM.prepend(el, sliderEl);
                        DOM.css(sliderEl, 'marginLeft', parseInt(DOM.css(sliderEl, 'marginLeft'), 10) - 990);
                    }else{
                        sliderEl.appendChild(el);
                    }

                    iee.util.stdShareHolder(el);

                    switchPost(el);
                    isLoadingPost = false;
                },
                error: function(){
                    window.location = target.href;
                }
            });
        }

    });

    //hash处理
    if(window.hashId){
        sliderEl.innerHTML = '<p style="line-height:300px;color:#666;font-size:16px;letter-spacing:2px;text-align:center">正在搬运灵感...</p>';
        IO({
            type: 'get',
            url: '/' + hashId + '?type=json',
            success: function(html){
                sliderEl.innerHTML = '<div class="panel" id="post' + hashId + '">' + html + '</div>';
                updateMain(DOM.get('#post' + hashId));
                DOM.css('#trigger','visibility','visible');
            },
            error: function(){
                window.location = '/' + hashId;
            }
        });
    }

})(KISSY);
