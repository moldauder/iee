(function(S){
    var DOM = S.DOM, Event = S.Event, IO = S.IO, Node = S.Node, Anim = S.Anim;

    var util = iee.util;

    S.use('waterfall', function(S, Waterfall){
        var last_post_id;
        var hasMore = true;
        var loadingEl = DOM.get('#loading');

        function afterEnd(){
            loadingEl.innerHTML = '<p class="end"></p>';
            loadingEl.style.visibility = 'visible';
        }

        function showLoad(){
            loadingEl.innerHTML = '<p><img src="http://pic.yupoo.com/iewei/C6Gb0faQ/PMs7M.gif" width="202" height="70" alt="加载中" /></p>';
            loadingEl.style.visibility = 'visible';
        }

        var waterfall = new Waterfall.Loader({
            container: DOM.get('#waterfall'),
            minColCount: 1,
            colWidth: 990,
            adjustEffect: {
                duration: 0.5,
                easing: 'easeInStrong'
            },
            load: function(success, end){
                if(!hasMore){
                    afterEnd();
                    return end();
                }

                showLoad();

                IO({
                    url: '/query',
                    data: {
                        modified: last_post_id,
                        author: window.authorId
                    },
                    dataType: 'jsonp',
                    success: function(data){
                        hasMore = data.next;
                        if(data.size){
                            var html = '';
                            S.each(data.list, function(vo){
                                last_post_id = vo.modified;

                                var viewlink = vo.buylink || vo.outer_url;

                                html += '<div class="post pin ks-waterfall">' +
                                            '<div class=stdpost><div class="core">' +
                                                '<div class=photo>' +
                                                    (viewlink ? ('<a title="' + vo.title + '" href="' + viewlink + '">') : '') +
                                                        '<img src="' + vo.img + '" width="320" height="420"/>' +
                                                    (viewlink ? '</a>' : '') +
                                                '</div>' +
                                                '<div class="detail">' +
                                                    '<h2 class="title">' + vo.title + '</h2>' +
                                                    '<div class="content">' + vo.content + '</div>' +
                                                    '<div class="action">' +
                                                        (viewlink ? ('<a class="go-view" href="' + viewlink + '">点此拥有</a>') : '') +
                                                        '<a class="go-share" href="' + util.shareLink({
                                                            pic: vo.img,
                                                            url: 'http://iewei.com/' + vo.id,
                                                            title:'#中意一味# ' + util.filterHtmlTag(vo.content)
                                                        }) + '">分享灵感</a>' +
                                                    '</div>' +
                                                '</div>' +
                                            '</div>';

                                    if(vo.relateitem){  //关联商品
                                        html += '<div class="relateitem"><div class="trigger relateitem-trigger"><span></span></div><div class="content"><textarea>';
                                        S.each(vo.relateitem.list, function(rvo, idx){
                                            html += '<a title="' + rvo.title + '" href="/' + vo.id + '?subitem=' + (idx + 1) + '">' +
                                                        '<img src="' + rvo.img + '" /><div class="extra"><div class="mask"></div>' +
                                                        '<div class="title">' + rvo.title + '</div>' +
                                                        '<div class="desc">' + rvo.content  + '</div>' +
                                                    '</div></a>';
                                        });
                                        html += '</textarea></div></div>';
                                    }

                                    html += '</div>' + util.stddate(vo.modified) + '</div>';

                            });

                            loadingEl.style.visibility = 'hidden';

                            var el = document.createElement('div');
                            el.innerHTML = html;

                            Event.on(DOM.query('div.relateitem-trigger', el), 'click', function(){
                                var textarea = DOM.get('textarea', this.parentNode);
                                var contentEl = textarea.parentNode;
                                contentEl.innerHTML = textarea.value;
                                contentEl.style.display = 'block';
                                this.style.display = 'none';

                                waterfall.adjust();
                            });

                            success(S.all(el.children));
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
    });
})(KISSY);
