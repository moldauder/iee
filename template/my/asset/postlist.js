KISSY.add('iee/postlist', function(S, DOM, Event, IO, Anim){

    var Module = {};

    //当前的查询参数
    var queryParams = {};

    //初始化
    Module.init = function(then){
        var self = this;

        if(self.isLoading){ return; }
        self.isLoading = true;

        App.Loading.show('正在加载文章列表');

        IO.get('/my/tmpl?name=postlist', function(html){
            App.Panel.add('postlist', html);
            App.Loading.hide();

            var root = DOM.get('#postlist');
            self.eles = {
                root: root,
                grid: DOM.query('div.grid', root),
                pager: DOM.query('div.pager', root),
                form: DOM.query('form.query-form', root)
            };

            self.super = App.getConfig('super');    //是否是超级用户
            self.userNick = App.getConfig('userNick');

            self.initQueryForm();
            self.list();

            //如果创建了新的文章，那么要检测是否要更新此页
            App.on('createNewPost', function(){
                if(!self.hasPrevPage){
                    self.hasCreateNewPost = true;
                }
            });

            self.init = function(then){
                if(self.hasCreateNewPost){
                    self.list();
                    self.hasCreateNewPost = false;
                }

                App.Panel.switch('postlist');
                S.isFunction(then) && then();
            };

            self.init();
        });
    };

    /**
     * 初始化搜索表单
     */
    Module.initQueryForm = function(){
        var inited = false;

        S.each(this.eles.form, function(el){
            Event.on(el, 'submit', function(ev){
                ev.halt();
                Module.list(Module.form2Map());
            });

            //记录下查询参数
            if(!inited){
                queryParams = Module.form2Map();
                inited = true;
            }
        });
    };

    /**
     * 表单参数转化成map
     * 两个表单要同步
     */
    Module.form2Map = function(el){
        return S.unparam(IO.serialize(this.eles.form[0]));
    };

    /**
     * 加载文章列表
     */
    Module.list = function(params, then){
        App.Loading.show('读取灵感列表中...');

        params = S.merge(params, {
            num: 12,
            action: 'post'
        });

        IO.get('/my/query?' + S.param(params), function(data){
            data.q = params.q;

            Module.renderList(data);
            Module.renderPager(data);

            if(S.isFunction(then)){
                then(data);
            }

            App.Panel.updateUI();

            App.Loading.hide();
        }, 'json');
    };

    /**
     * 渲染文章列表
     */
    Module.renderList = function(data){
        var html = '';
        if(data.size){
            S.each(data.list, function(vo){
                html += Module.renderPostItem(vo);
            });
        }else{
            html = '<p class="post-empty">' + (data.q ? '没有找到和<strong>' + data.q + '</strong>相关的文章' : '咦，文章去哪了...') + '</p>';
        }

        DOM.html(this.eles.grid, html);
    };

    var class_map = {
        'n': 'off',
        'y': 'on'
    };
    var lock_map = {
        'n': '未锁定',
        'y': '已锁定'
    };
    var fp_map = {
       'n': '首页不展现',
       'y': '首页展现'
    };
    var status_map = {
        publish: '已发布',
        draft: '草稿'
    };
    var host_map = {
        taobao: '淘宝商品',
        tmall: '天猫商品'
    };
    var unit_map = {
        yuan: '&yen;'
    };

    Module.renderPostItem = function(vo){
        var fp = vo.fp;
        var lock = vo.lock;
        var status = vo.status;
        var inTrash = 'y' === vo.trash;
        var cls = ['grid-item post-item'];

        if('y' === lock){
            cls.push('post-locked');
        }

        if(inTrash){
            cls.push('post-trash');
        }

        var id = vo.id;
        var html = '<div id="post' + id + '" class="' + cls.join(' ') + '">';

        html += '<p class=title>' +
            '<input class=checkbox type=checkbox data-act="postlist/select:' + id + '" value="' + id + '" />' +
            '<a title="' + vo.title + '" href="?action=post-edit&id=' + id + '" data-act="postlist/edit:' + id + '">' + vo.title + '</a>' +
            '</p>';

        //超级用户才有权限执行此操作
        if(this.super){
            html += '<p class=mark>' +
                '<a class="post-fp-btn ' + class_map[fp] + '" href="/my/status/?action=post&field=fp&id=' + id + '" data-act="postlist/fp:' + id + '">' + fp_map[fp] + '</a>' +
                '<a class="post-lock-btn ' + class_map[lock] + '" href="/my/status/?action=post&field=lock&id=' + id +'" data-act="postlist/lock:' + id + '">' + lock_map[lock] + '</a>' +
                '</p>';
        }else{
            if('y' === lock){   //已经被锁定
                html += '<p class=mark><span class=on title="管理员已经锁定了这篇文章，如果您需要编辑文章，请联系管理员">已锁定，不能更改</span></p>';
            }
        }

        html += '<p class=action>';
        //html += '<a href="?action=post-preview&id=' + id + '" data-act="postlist/preview:' + id + '">预览</a>';

        if(this.super || 'n' === lock){
            html += '<a class=post-edit-btn href="?action=post-edit&id=' + id + '" data-act="postlist/edit:' + id + '">编辑</a>';
            html += '<a class=post-untrash-btn href="/my/status?action=post&field=trash&id=' + id + '" data-act="postlist/trash:' + id + '">移出回收站</a>' +
                '<a class=post-delete-btn href="/my/status?action=post&field=remove&id=' + id + '" data-act="postlist/remove:' + id + '">永久删除</a>';
            html += '<a class=post-trash-btn href="/my/status?action=post&field=trash&id=' + id + '" data-act="postlist/trash:' + id + '">移至回收站</a>';
            html += '</p>';
        }

        //展示对应的商品信息
        var buylink = vo.buylink || vo.outer_url;
        if(buylink){
            var host = vo.host;
            html += '<p>';

            if(buylink){
                html += '<a title="' + (host_map[host] || '商品详情') + '" class="buylink" href="' + buylink + '" target="_blank">' + (host || 'website') + '</a>';
            }

            var price = vo.price;
            if(price){
                var onsale = vo.onsale;
                html += '<span class="buyinfo buyinfo-onsale-' + class_map[onsale] + '">';
                html += '<span class="price"><span>' + (unit_map[vo.price_unit] || '&yen;') + '</span>' + price + '</span>';
                if('0' === onsale){
                    html += '<span class="onsale">已下架</span>';
                }
                html += '</span>';
            }

            html += '</p>';
        }

        html += '<p>由<span class=nick>' + (vo.nick === this.userNick ? '你' : vo.nick) + '</span>最后编辑于<span class=modified>' + vo.modified + '</span></p>';

        var mark = [];
        if(inTrash){ mark.push('<span class=trash>回收站</span>'); }
        if('draft' === status){ mark.push('<span class=draft>草稿</span>'); }
        if('y' === fp){ mark.push('<span class=fp>首页展现</span>'); }

        if(mark.length){
            html += '<p class=post-mark>' + mark.join('') + '</p>';
        }

        return html + '</div>';
    };

    /**
     * 渲染分页
     */
    Module.renderPager = function(data){
        var html = '';
        var list = data.list;
        var size = data.size;

        if(1 < size){
            var first = list[0].modified;
            var end = list[size - 1].modified;

            html += '<div class="pagination">';
            html += data.prev ?  '<a title="上一页" data-tag="' + first + '" href="/my/query/?action=post&page=prev&modified=' + first + '" class="pager-prev" data-act="postlist/prev' + '"></a>' : '<span class="pager-prev"></span>';
            html += data.next ? '<a title="下一页" data-tag="' + end + '" href="/my/query?action=post&page=next&modified=' + end + '" class="pager-next" data-act="postlist/next' + '"></a>' : '<span class="pager-next"></span>';
            html += '</div>';
        }

        this.hasPrevPage = data.prev;
        this.hasNextPage = data.next;

        DOM.html(this.eles.pager, html);
    };


    /**
     * 各类操作
     */
    Module.select = function(el, id){
        DOM[el.checked ? 'addClass' : 'removeClass'](Module.findBox(el), 'grid-item-selected');
    };

    Module.selectAll = function(el){
        var checked = el.checked;

        S.each(DOM.query('input.checkbox', this.eles.grid), function(chkEl){
            chkEl.checked = checked;
            Module.select(chkEl, chkEl.value);
        });
    };

    Module.fp = function(el){
        Module.status(el, function(data){
            Module.fp_response(el, data);
        });
    };

    Module.fp_response = function(el, data){
        if('n' === data.fp){
            DOM.removeClass(el, 'on');
            DOM.addClass(el, 'off');
            el.innerHTML = '首页不展现';

            Module.removeMark(el, 'fp');
        }else{
            DOM.addClass(el, 'on');
            DOM.removeClass(el, 'off');
            el.innerHTML = '首页展现';

            Module.addMark(el, 'fp');
        }
    };

    /**
     * 永久删除
     */
    Module.remove = function(el){
        Module.status(el, function(data){
            Module.remove_response(el, data);
        });
    };

    Module.remove_response = function(el, data){
        if(data.success){
            DOM.remove(DOM.parent(el, 'div.grid-item'));
        }
    };

    Module.lock = function(el){
        Module.status(el, function(data){
            Module.lock_response(el, data);
        });
    };

    Module.lock_response = function(el, data){
        var box = Module.findBox(el);
        if('n' === data.lock){
            DOM.removeClass(el, 'on');
            DOM.addClass(el, 'off');
            el.innerHTML = '未锁定';
            DOM.removeClass(box, 'post-locked');
        }else{
            DOM.addClass(el, 'on');
            DOM.removeClass(el, 'off');
            el.innerHTML = '已锁定';
            DOM.addClass(box, 'post-locked');
        }
    };

    //增加mark
    var markArr = {
        'draft': '草稿',
        'trash': '回收站',
        'fp': '首页展现'
    };

    Module.addMark = function(el, type){
        if(!(type in markArr)){
            return;
        }

        var markEl = this.getMarkEl(el);
        if(DOM.get('span.' + type, markEl)){
            return;
        }

        markEl.appendChild(DOM.create('<span class="' + type + '">' + markArr[type] + '</span>'));
        markEl.style.visibility = 'visible';
    };

    Module.removeMark = function(el, type){
        var markEl = this.getMarkEl(el);
        DOM.remove(DOM.get('span.' + type, markEl));

        if(0 === DOM.children(markEl).length){
            markEl.style.visibility = 'hidden';
        }
    };

    Module.getMarkEl = function(el){
        var box = this.findBox(el);
        var markEl = DOM.get('p.post-mark', box);

        if(!markEl){
            markEl = DOM.create('<p class="post-mark" style="visibility:hidden"></p>');
            box.appendChild(markEl);
        }

        return markEl;
    };

    //移至/移出回收站
    Module.trash = function(el){
        Module.status(el, function(data){
            Module.trash_response(el, data);
        });
    };

    Module.trash_response = function(el, data){
        var box = Module.findBox(el);
        if('y' === data.trash){
            if('all' === queryParams.range){    //当前列出的是全部
                DOM.addClass(box, 'post-trash');
                Module.addMark(el, 'trash');
            }else{
                Module.removeBox(el);
            }
        }else{
            DOM.removeClass(box, 'post-trash');
            Module.removeMark(el, 'trash');
        }
    };

    Module.removeBox = function(el){
        var box = Module.findBox(el);
        (new Anim(box, {
            opacity: 0
        }, 0.3, 'easeOutStrong', function(){
            DOM.remove(box);
        })).run();
    };

    Module.status = function(el, then){
        if(DOM.hasClass(el, 'async')){
            return;
        }
        DOM.addClass(el, 'async');

        IO.get(DOM.attr(el, 'href'), function(data){
            DOM.removeClass(el, 'async');
            if(data.success){
                then(data);
            }
        }, 'json');
    };

    Module.findBox = function(el){
        return DOM.hasClass(el, 'grid-item') ? el : DOM.parent(el, 'div.grid-item');
    };

    /**
     * 批量操作
     */
    Module.batch = function(trigger){
        if(DOM.hasClass(trigger, 'async')){
            return;
        }

        var ids = [];

        S.each(DOM.query('input.checkbox', this.eles.grid), function(chkEl){
            if(chkEl.checked){
                ids.push(chkEl.value);
            }
        });


        if(0 === ids.length){
            return App.Feedback.show({
                title: '请先选择文章'
            });
        }

        var selectEl = DOM.prev(trigger, 'select.batchAction');
        var curOptEl = selectEl.options[selectEl.selectedIndex];
        var action = curOptEl.value;
        var value;
        var field;

        if('fp' === action){
            field = 'fp';
            value = 'y';
        }else if('unfp' === action){
            field = 'fp';
            value = 'n';
        }else if('lock' === action){
            field = 'lock';
            value = 'y';
        }else if('unlock' === action){
            field = 'lock';
            value = 'n';
        }else if('trash' === action){
            field = 'trash';
            value = 'y';
        }else{
            return App.Feedback.show({
                title: '请先选择操作'
            });
        }

        DOM.addClass(trigger, 'async');
        trigger.innerHTML = '执行中...';

        App.Loading.show('正在批量执行 ' + curOptEl.innerHTML);

        IO.get('/my/status/?action=post&field=' + field + '&id=' + ids.join(',') + '&value=' + value, function(data){
            if(data.success){
                var cls = 'post-' + field + '-btn';
                S.each(ids, function(id){
                    var box = DOM.get('#post' + id);
                    var chkEl = DOM.get('input.checkbox', box);
                    chkEl.checked = false;

                    Module[field + '_response'](DOM.get('a.' + cls, box), data);
                    Module.select(chkEl);
                });
            }

            DOM.removeClass(trigger, 'async');
            trigger.innerHTML = '应用';
            DOM.val(selectEl, '');
            App.Loading.hide();
        }, 'json');
    };

    //翻页
    Module.pager = function(el, page){
        var params = this.form2Map();

        params.page = page;
        params.modified = DOM.attr(el, 'data-tag');

        this.list(params);
    };

    Module.prev = function(el){
        this.pager(el, 'prev');
    };

    Module.next = function(el){
        this.pager(el, 'next');
    };

    /**
     * 撰写文章
     */
    Module.compose = function(){
        S.use('iee/postcompose', function(S, Compose){
            Compose.new();
        });
    };

    Module.edit = function(el, id){
        S.use('iee/postcompose', function(S, Compose){
            Compose.edit(id);
        });
    };

    return Module;

}, {
    requires: ['dom', 'event', 'ajax', 'anim']
});
