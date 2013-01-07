(function(S){
    var DOM = S.DOM, Event = S.Event, IO = S.IO, Node = S.Node, Anim = S.Anim;

    S.use('waterfall', function(S, Waterfall){
        var last_post_id;
        var hasMore = true;
        var isIE = S.UA.ie < 9;
        var loadingEl = DOM.get('#loading');

        if(isIE){
            DOM.addStyleSheet('#itemlist .extra,#itemlist .mask{display: none;background:#000}');
        }

        function afterEnd(){
            loadingEl.innerHTML = '<p class="end"></p>';
            loadingEl.style.visibility = 'visible';
        }

        function showLoad(){
            loadingEl.innerHTML = '<p><img src="http://pic.yupoo.com/iewei/C6Gb0faQ/PMs7M.gif" width="202" height="70" alt="加载中" /></p>';
            loadingEl.style.visibility = 'visible';
        }

        var monthArr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        function parseDate(datestr){
            var arr = datestr.split(' ')[0].split('-');
            arr[1] = monthArr[arr[1] - 1];
            return arr;
        }

        var waterfall = new Waterfall.Loader({
            container: '#waterfall',
            minColCount: 3,
            colWidth: 325,
            adjustEffect: {
                duration: 0.5,
                easing: "easeInStrong"
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
                        from: 'fp'
                    },
                    dataType: 'jsonp',
                    success: function(data){
                        //有下一页就是有更多
                        hasMore = data.next;
                        if(data.size){
                            var html = '';
                            S.each(data.list, function(vo){
                                var dateArr = parseDate(vo.modified);

                                last_post_id = vo.modified;

                                html += '<a href="/' + vo.id + '" class="pin ks-waterfall">' +
                                             '<img src="' + vo.img + '" width=320 height=420 />' +
                                             '<div class=extra>' +
                                                '<div class=mask></div>' +
                                                '<div class=stddate>' +
                                                    '<span class=day>' + dateArr[2] + '</span>' +
                                                    '<span class=month>' + dateArr[1] + '</span>' +
                                                    '<span class=year>' + dateArr[0] + '</span>' +
                                                '</div>' +
                                                '<div class=title>' + vo.title + '</div>' +
                                                '<div class=desc>' + vo.content + '</div>' +
                                                '<div class=author><s></s>' + vo.nick + '</div>' +
                                             '</div>' +
                                        '</a>';
                            });

                            loadingEl.style.visibility = 'hidden';

                            var el = document.createElement('div');
                            el.innerHTML = html;
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


    /*submit*/
    (function(textarea){
        if(!textarea){ return; }

        var trigger = DOM.create('<div class="submit"></div>');
        trigger.innerHTML = '<s></s><s class="arrow"></s>';
        DOM.get('#socialm').appendChild(trigger);

        Event.on(trigger, 'click', function(){
            Event.remove(this, 'click');
            init();
        });

        var init = function(){
            var root = DOM.create('<div id="submiturl" class="submiturl"></div>');
            root.innerHTML = textarea.value;
            textarea.parentNode.replaceChild(root, textarea);

            var container = DOM.get('div.box', root);
            var fieldCont = DOM.get('div.fieldCont', root);
            var formEl = DOM.get('form', root);
            var errEl = DOM.get('span.err', root);
            var inputs = DOM.query('input', root);
            var formCont = DOM.get('div.formCont', root);

            var boxElHeight = 0;
            var isExpand = false;

            Event.on(trigger, 'click', function(){
                if(isExpand){
                    closeSubmit();
                }else{
                    isExpand = true;
                    (new Anim(root, {
                        height: DOM.outerHeight(container)
                    }, .6, 'easeOutStrong', function(){
                        root.style.height = 'auto';
                        DOM.addClass(trigger, 'submit-expand');
                    })).run();
                }
            });

            //第一次展开
            Event.fire(trigger, 'click');

            var closeSubmit = function(){
                if(isExpand){
                    boxElHeight = 0;
                    isExpand = false;
                    (new Anim(root, {
                        height: 0
                    }, .6, 'easeInStrong', function(){
                        DOM.css(formCont, {
                            opacity: 1,
                            display: 'block'
                        });
                        fieldCont.style.height = '120px';

                        errEl.innerHTML = '';
                        formEl.reset();
                        DOM.removeClass(trigger, 'submit-expand');
                        DOM.remove(DOM.get('div.thanks', root));
                    })).run();
                }
            };

            Event.on(DOM.get('span.close', root), 'click', function(){
                closeSubmit();
            });

            var expandBox = function(h){
                boxElHeight = h;
                (new Anim(fieldCont, {
                    height: h
                }, .3, 'easeOutStrong')).run();
            };

            S.each(inputs, function(el){
                Event.on(el, 'focus', function(){
                    DOM.addClass(this.parentNode, 'field-focus');
                });

                var name = el.name;
                if('url' === name){
                    Event.on(el, 'focus', function(){
                        if(boxElHeight < 180){ expandBox(180); }
                    });
                }else if('remark' === name){
                    Event.on(el, 'focus', function(){
                        if(boxElHeight < 220){ expandBox(220); }
                    });
                }

                Event.on(el, 'blur', function(){
                    if(!S.trim(this.value)){
                        this.value = '';
                        DOM.removeClass(this.parentNode, 'field-focus');
                    }
                });
            });


            Event.on(DOM.get('button', root), 'click', function(ev){
                ev.halt();

                var urlEl = formEl.elements['url'];
                if(!S.trim(urlEl.value)){
                    errEl.innerHTML = '请输入您要推荐的网址';
                    return;
                }

               IO({
                    url: '/index/submit',
                    type: 'post',
                    form: formEl,
                    success: function(){
                        (new Anim(formCont, {
                            opacity: 0
                        }, 0.3, 'easeOutStrong', function(){
                            var destHeight = DOM.outerHeight(formCont);

                            formCont.style.display = 'none';

                            var thanksEl = DOM.create('<div class="thanks"></div>');
                            DOM.insertAfter(thanksEl, formCont);
                            thanksEl.style.height = destHeight + 'px';

                            (new Anim(thanksEl, {
                                opacity: 1
                            }, 0.4, 'easeInStrong', function(){
                                setTimeout(function(){
                                    closeSubmit();
                                }, 2400);
                            })).run();
                        })).run();
                    }
                });
            });

        };
    })(DOM.get('#sh'));

})(KISSY);
