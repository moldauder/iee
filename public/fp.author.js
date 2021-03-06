KISSY.add('iee/fp.author', function(S, DOM, Event, IO, Anim, Base, Waterfall){

    var Author = {};

    Author.init = function(){
        this.initWaterfall();

        //相册翻页键盘事件处理
        Event.on(window, 'keyup', function(ev){
            var direction = '';
            var keyCode = ev.keyCode;

            if(39 === keyCode || 34 === keyCode){  //右方向键、Page Down
                direction = 'next';
            }else if(37 === keyCode || 33 === keyCode){
                direction = 'prev';
            }

            if(direction){
                var el = DOM.get('a.' + direction, '#albumTrigger');
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
    };

    Author.initWaterfall = function(){
        var last_post_id;
        var loadingEl = DOM.get('#loading');

        function afterEnd(){
            loadingEl.innerHTML = '<p class="end"></p>';
            loadingEl.style.visibility = 'visible';
        }

        function showLoad(){
            loadingEl.innerHTML = '<p><img src="http://pic.yupoo.com/iewei/C6Gb0faQ/PMs7M.gif" width="202" height="70" alt="加载中" /></p>';
            loadingEl.style.visibility = 'visible';
        }

        var wf = new Waterfall({
            container: '#waterfall',
            colWidth: 990,
            maxColCount: 1,
            minColCount: 1,
            load: function(success, end){
                showLoad();

                IO({
                    url: '/query/all',
                    data: {
                        id: last_post_id,
                        cat: window.curCatId,
                        author: window.authorId
                    },
                    dataType: 'json',
                    success: function(data){
                        if(data.length){
                            var html = '';

                            S.each(data, function(vo){
                                last_post_id = vo.id;

                                var viewlink = vo.buylink || vo.outer_url;

                                html += '<div class="post pin">' +
                                            '<div class="stdpost"><div class="core">' +
                                                '<div class="photo">' +
                                                    (viewlink ? ('<a title="' + vo.title + '" href="' + viewlink + '">') : '') +
                                                        '<img src="' + vo.img + '" width="320" height="420"/>' +
                                                    (viewlink ? '</a>' : '') +
                                                '</div>' +
                                                '<div class="detail">' +
                                                    '<h2 class="title">' + vo.title + '</h2>' +
                                                    '<div class="content">' + vo.fullcontent + '</div>' +
                                                    ((vo.price && '0' !== vo.price) ? ('<div class="price">' + vo.price + '</div>') : '') +
                                                    '<div class="action">' +
                                                        (viewlink ? ('<a class="go-view" href="' + viewlink + '">点此拥有</a>') : '') +
                                                        '<ins class="post-share"></ins>' +
                                                    '</div>' +
                                                    (viewlink && 'n' === vo.onsale ? '<ins class="off-sign"></ins>' : '') +
                                                '</div>' +
                                            '</div>';

                                if('album' === vo.type){  //关联商品
                                    html += '<div class="albumitem" data-id="' + vo.id + '">' +
                                        '<div class="trigger albumitem-trigger"><span></span></div>' +
                                        '<div class="content"></div>' +
                                     '</div>';
                                }

                                html += '</div>' + Base.stddate(vo.modified) + '</div>';
                            });

                            loadingEl.style.visibility = 'hidden';

                            var el = document.createElement('div');
                            el.innerHTML = html;
                            Base.parsePostShare(el);

                            Event.on(DOM.query('div.albumitem-trigger', el), 'click', function(){
                                Author.loadAbum(DOM.parent(this, 'div.albumitem'));
                            });

                            success(DOM.children(el));
                        }else{
                            afterEnd();
                            end();
                        }
                    },
                    error: function(){
                    }
                });
            }
        });

        wf.start();
    };

    Author.loadAbum = function(root){
        IO.get('/query/albumitem/' + DOM.attr(root, 'data-id'), function(data){
            var html = '';
            var albumHtml = '';

            S.each(data, function(vo){
                html += '<a class="pin">' +
                    '<img height="315" width="240" src="' + vo.img + '" /><div class="extra"><div class="mask"></div>' +
                    '<div class="title">' + vo.title + '</div>' +
                    '<div class="desc">' + vo.fullcontent  + '</div>' +
                    '</div></a>';
            });

            var contentEl = DOM.get('div.content', root);
            contentEl.innerHTML = html;

            S.each(DOM.children(contentEl), function(el, idx){
                Event.on(el, 'click', function(ev){
                    ev.halt();
                    S.use('iee/fp.album', function(S, Album){
                        Album.show(data, {
                            switchTo: idx
                        });
                        Base.parsePostShare();
                    });
                });
            });

            S.use('iee/fp.album');

            DOM.css(contentEl, {
                display: 'block',
                position: 'fixed',
                left: 0,
                right: 0,
                zIndex: -1
            });

            var destHeight = DOM.height(contentEl);

            DOM.css(contentEl, {
                zIndex: 'auto',
                position: 'static',
                height: 0
            });

            (new Anim(DOM.get('div.trigger', root), {
                height : 0,
                opacity: 0
            }, 0.5, 'easeOutStrong')).run();

            (new Anim(contentEl, {
                height: destHeight
            }, destHeight / 1000, 'easeBothStrong')).run();
        }, 'json');
    };

    return Author;

}, {
    requires:[
        'dom', 'event', 'ajax', 'anim',
        'iee/fp.base',
        'iee/fp.waterfall'
    ]
});
