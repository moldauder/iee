KISSY.add('iee/fp.base', function(S, DOM, Event, Anim){

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
                    title: packShareText(DOM.html(DOM.get('.title', box)), DOM.text(DOM.get('div.content', box)))
                });
            }
        });
    };

    //处理分类固顶和分类交互
    Base.initCategory = function(subCatMap, curCatId){
        var root = DOM.get('#category');

        //创建一个替身，占住位置
        var holder = DOM.create('<div class="category-placeholder"></div>');
        DOM.insertBefore(holder, root);

        //点击监听
        var subEl = DOM.get('div.sub', root);
        var curSubTrigger;

        var curExpandSubTrigger;
        var subTriggerClickHandler = function(trigger){
            var catList = subCatMap[DOM.attr(trigger, 'data-cat')];
            if(!S.isArray(catList) && 0 === catList.length){
                return;
            }

            var isExpand = DOM.data(trigger, 'isExpand');

            if(isExpand){   //收缩起来
                var listEl = DOM.get('div.sub-cat', subEl);
                if(listEl){
                    (new Anim(listEl, {
                        marginTop: 0 - DOM.outerHeight(listEl)
                    }, 0.5, 'easeOutStrong')).run();
                }

                curExpandSubTrigger = null;
            }else{          //展开
                if('color' === catList[0].type){
                    var html = '<div class="sub-cat sub-cat-color"><div class="list">';
                    S.each(catList, function(vo){
                        html += '<a target="_self" class="cat-' + vo.alias + (curCatId === vo.id ? ' active' : '') + '" href="?cat=' + vo.alias + '"><span>' + vo.name.substr(vo.name.indexOf('/') + 1)  + '</span></a>';
                    });
                    html += '</div></div>';

                }
                subEl.innerHTML = html;

                var listEl = DOM.get('div.sub-cat', subEl);
                var height= DOM.outerHeight(listEl);

                listEl.style.marginTop = 0 - height + 'px';
                subEl.style.height = height + 'px';

                (new Anim(listEl, {
                    marginTop: 0
                }, 0.5, 'easeOutStrong')).run();

                curExpandSubTrigger = trigger;
            }

            DOM.data(trigger, 'isExpand', !isExpand);
        };

        //如果某个子分类是当前分类，那么展开1.5秒钟，然后收回
        //抢先绑定，以获得点击时的优先执行
        /**
        var curActiveCat = DOM.get('li.active', root);
        if(DOM.hasClass(curActiveCat, 'collapse')){
            (function(subCatTrigger){

                //如果用户自己去点击展开，那么就不自己展示了
                //比如子菜单已经展开，那么阻止这一次点击事件，防止菜单被收回去（这个时候点击，用户的预期应该是展开菜单）
                //后面再点击就是正常的逻辑了
                var onSubCatTriggerClick = function(ev){
                    if(hasExpand && ev){
                        ev.halt(true);
                    }

                    timer1.cancel();
                    timer2.cancel();
                    Event.remove(subCatTrigger, 'click', onSubCatTriggerClick);
                };

                var hasExpand = false;
                var timer1 = S.later(function(){
                    subTriggerClickHandler(subCatTrigger);
                    hasExpand = true;
                }, 500);

                var timer2 = S.later(function(){
                    subTriggerClickHandler(subCatTrigger);

                    //这是让菜单收回，此时可以销毁click的点击事件处理了
                    onSubCatTriggerClick();
                }, 2500);

                Event.on(subCatTrigger, 'click', onSubCatTriggerClick);
                Event.on(window, 'scroll', function(){
                    onSubCatTriggerClick();
                    Event.remove(this, 'scroll', arguments.callee); //滚动的时候，也移除掉。此时滚动那里会有个特别的处理
                });

            })(DOM.get('a', curActiveCat));
        }
        **/

        S.each(DOM.query('a', DOM.query('li.collapse', root)), function(trigger){
            var catList = subCatMap[DOM.attr(trigger, 'data-cat')];
            if(S.isArray(catList) && catList.length){
                Event.on(trigger, 'click', function(ev){
                    ev.halt();
                    subTriggerClickHandler(this);
                });
            }
        });

        var isFixed;
        Event.on(window, 'scroll', function(){
            if(DOM.offset(holder).top < DOM.scrollTop()){
                if(!isFixed){
                    isFixed = true;
                    DOM.addClass(root, 'category-fixed');
                    holder.style.height = DOM.outerHeight(root);

                }

                //如果子类目被展开了，那么这个时候自动收回
                if(curExpandSubTrigger){
                    subTriggerClickHandler(curExpandSubTrigger);
                }
            }else{
                isFixed = false;
                holder.style.height = '0';
                DOM.removeClass(root, 'category-fixed');
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

        this.initCategory(window.subCat, window.curCatId);
    };

    return Base;

}, {
    requires: [
        'dom', 'event', 'anim'
    ]
});
