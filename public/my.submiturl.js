KISSY.add('iee/my.submiturl', function(S, DOM, Event, IO, Modal){

    var Module = {};

    Module.init = function(then){
        var self = this;

        if(self.isLoading){ return; }
        self.isLoading = true;

        App.Loading.show('正在加载');

        IO.get('/my/tmpl?name=submiturl', function(html){
            App.Panel.add('submiturl', html);
            App.Loading.hide();

            var root = DOM.get('#submiturl');
            self.eles = {
                root: root,
                grid: DOM.query('div.grid', root),
                pager: DOM.query('div.pager', root),
                form: DOM.query('form.query-form', root)
            };

            self.initQueryForm();
            self.list();

            //如果创建了新的文章，那么要检测是否要更新此页
            App.on('createNewPost', function(data){
                if(data.isFromSubmit){
                    self.hasSubmiturlChange = true;
                }
            });

            self.init = function(then){
                if(self.hasSubmiturlChange){
                    self.list();
                    self.hasSubmiturlChange = false;
                }

                App.Panel.switch('submiturl');
                S.isFunction(then) && then();
            };

            self.init(then);
        });
    };

    Module.form2Map = function(){
        return S.unparam(IO.serialize(this.eles.form[0]));
    };

    Module.initQueryForm = function(){
        S.each(this.eles.form, function(el){
            Event.on(el, 'submit', function(ev){
                ev.halt();
                Module.list(Module.form2Map());
            });
        });
    };

    Module.list = function(params, then){
        App.Loading.show('读取submit列表中...');

        params = S.merge(params, {
            num: 12,
            action: 'submiturl'
        });

        IO.get('/my/query?' + S.param(params), function(data){
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
     * 渲染分页
     */
    Module.renderPager = function(data){
        var html = '';
        var list = data.list;
        var size = data.size;

        if(1 < size){
            var firstID = list[0].id;
            var lastID = list[size - 1].id;

            html += '<div class="pagination">';

            html += data.prev ?  '<a title=上一页 href="/my/query?action=submiturl&&page=prev&id=' + firstID + '" class="pager-prev" data-act="my.submiturl/prev:' + firstID + '"></a>' : '<span class="pager-prev"></span>';
            html += data.next ? '<a title=下一页 href="/my/query?action=submiturl&page=next&id=' + lastID + '" class="pager-next" data-act="my.submiturl/next:' + lastID + '"></a>' : '<span class="pager-next"></span>';

            html += '</div>';
        }

        DOM.html(this.eles.pager, html);
    };

    /**
     * 渲染文章列表
     */
    Module.renderList = function(data){
        var map = Module.statusMap;
        var html = '';

        if(data.size){
            S.each(data.list, function(vo){
                var id = vo.id;

                html += '<div class="grid-item">';
                html += '<div class="title"><a class="title" target="_blank" href="' + vo.url + '">' + (vo.title || vo.url) + '</a></div>';

                var meta = [];

                if(vo.nick){ meta.push('<div class="column"><span>推荐人:</span><p>' + vo.nick + '</p></div>'); }
                if(vo.weibo){ meta.push('<div class="column"><span>微博:</span><p>' + vo.weibo + '</p></div>'); }
                if(vo.remark){ meta.push('<div class="column"><span>理由:</span><p class="remark">' + vo.remark + '</p></div>'); }

                if(meta.length){
                    html += '<div title="' + (vo.remark ? '推荐理由：' + vo.remark : '') + '" class="meta">' + meta.join('') + '</div>';
                }

                html += '<div class="action">';
                if('s' === vo.status){
                    html += '将状态置为:<a class="btn" href="/my/status?action=submiturl&field=p&id=' + id + '" data-act="my.submiturl/status">通过</a>';
                    html += '<a class="btn" href="/my/postnew" data-act="my.submiturl/compose:' + id + '">发表文章</a>';
                    html += '<a class="btn" href="/my/status?action=submiturl&field=remove&id=' + id + '" data-act="my.submiturl/status">删除</a>';
                }else{
                    html += '<span class="label label-success">已通过</span><label>处理人:' + vo.userNick + '</label>';

                    if(vo.postid > 0){
                        html += '<a class="label label-info" href="/' + vo.postid + '" target="_blank">关联文章</a>';
                    }else{
                        html += '<a class="btn" href="/my/postnew" data-act="my.submiturl/compose:' + id + '">发表文章</a>';
                    }
                }
                html +='</div>';

                html += '</div>';
            });
        }else{
            html = '<div><div class="alert">当前没有submit</div></div>';
        }

        DOM.html(this.eles.grid, html);
    };

    /**
     * 分页
     */
    Module.pager = function(el, id, page){
        var params = this.form2Map();

        params.page = page;
        params.id = id;

        this.list(params);
    };

    Module.prev = function(el, id){
        this.pager(el, id, 'prev');
    };

    Module.next = function(el, id){
        this.pager(el, id, 'next');
    };

 

    /**
     * 以推荐来撰写文章
     */
    Module.compose = function(el, id){
        S.use('iee/postcompose', function(S, Compose){
            var itemEl = DOM.parent(el, 'div.grid-item');
            Compose.edit({
                outer_url: DOM.attr(DOM.get('a.title', itemEl), 'href'),
                content: '<p>' + (DOM.html(DOM.get('p.remark', itemEl)) || '') + '</p>',
                params: 'submiturl=' + id
            });
        });
    };

    /**
     * 状态变更
     */
    Module.status = function(el){
        if(DOM.hasClass(el, 'async')){
            return;
        }
        DOM.addClass(el, 'async');

        IO.get(DOM.attr(el, 'href'), function(data){
            DOM.removeClass(el, 'async');
            if(data.success){
                var status = data.status;
                if('p' === status){   //已处理
                    DOM.parent(el, 'div.action').innerHTML = '<span class="label label-success">已通过</span><label>处理人:' + data.userNick + '</label>';
                }else if('remove' === status){  //删除
                    S.one(DOM.parent(el, 'div.grid-item')).fadeOut();
                }
            }
        }, 'json');
    };

    return Module;

}, {
    requires: [
        'dom', 'event', 'ajax',
        'iee/my.modal'
    ]
});
