/**
 * 撰写文章
 */

KISSY.add('iee/relateitem', function(S, DOM, Event, IO, Modal){

    var Module = {};

    Module.init = function(root){
        var self = this;
        self.root = root;

        Event.on(self.root, 'click', function(ev){
            var target = ev.target;
            var itemEl = DOM.hasClass(target, 'one-item') ? target : DOM.parent(target, 'div.one-item');

            if(DOM.hasClass(target, 'empty-item')){
                self.curItemEl = target;
                Modal.open('/my/tmpl?name=postcompose-add-relateitem', '添加关联商品', {
                    btns: [
                        {title: '取消'},
                        {title: '添加', act: 'relateitem/append', primary: true}
                    ]
                });
            }else if(DOM.hasClass(target, 'close')){
                ev.halt();
                delete self.dataMap[DOM.attr(itemEl, 'data-idx')];
                self.dataNum--;
                DOM.remove(itemEl);
                App.Panel.updateUI();
            }else if(DOM.hasClass(target, 'edit')){
                ev.halt();

                var data = self.dataMap[DOM.attr(itemEl, 'data-idx')];
                self.curItemEl = itemEl;
                Modal.open('/my/tmpl?name=postcompose-add-relateitem', '编辑关联商品', {
                    btns: [
                        {title: '取消'},
                        {title: '确定', act: 'relateitem/append', primary: true}
                    ],
                    callback: function(el){
                        var elements = DOM.get('form', el).elements;

                        elements.outer_url.value = data.outer_url;
                        elements.title.value = data.title;
                        elements.content.value = data.content;
                        elements.img.value = data.img;
                    }
                });
            }else if(DOM.hasClass(target, 'prev')){
                ev.halt();
                self.prev(itemEl);
            }else if(DOM.hasClass(target, 'next')){
                ev.halt();
                self.next(itemEl);
            }
        });


        self.init = function(){
            this.reset();
            this.createOneItem();
        };

        self.init();
    };

    Module.prev = function(itemEl){
        var prevEl = DOM.prev(itemEl);
        if(prevEl){
            DOM.insertBefore(itemEl, prevEl);
        }else{
            //说明此时是第一个元素，需要挪到后面去
            var childs = DOM.children(itemEl.parentNode);
            if(childs.length > 2){  //一般会有个空的元素（Add）
                DOM.insertBefore(itemEl, childs[childs.length - 1]);
            }
        }
    };

    Module.next = function(itemEl){
        var nextEl = DOM.next(itemEl);
        if(nextEl && !DOM.hasClass(nextEl, 'empty-item')){
            DOM.insertAfter(itemEl, nextEl);
        }else{
            //说明此时是最后一个有效元素，需要挪到最前面去
            var firstEl = DOM.first(itemEl.parentNode);
            if(firstEl !== itemEl){  //一般会有个空的元素（Add）
                DOM.insertBefore(itemEl, firstEl);
            }
        }
    };

    Module.reset = function(){
        if(this.root){
            this.root.innerHTML = '';

            this.dataMap = {};
            this.dataIdx = 0;
            this.dataNum = 0;
        }
    };

    Module.createOneItem = function(){
        var itemEl = DOM.create('<div class="one-item empty-item">add</div>');
        this.root.appendChild(itemEl);
        App.Panel.updateUI();
        return itemEl;
    };

    Module.fill = function(data){
        var self = this;
        if(self.root){
            self.reset();
            data = S.isArray(data) ? data : [data];
            S.each(data, function(vo){
                self.renderOne(self.createOneItem(), vo);
            });
            self.createOneItem();
        }
    };

    Module.renderOne = function(itemEl, vo){
        var idx = this.dataIdx;

        itemEl.innerHTML = '<a class="item" href="' + vo.outer_url+ '" title="' + vo.title + '" target="_blank"><img src="' + vo.img + '" /><div class="extra">' +
                '<div class="mask"></div>' +
                '<div class="title">' + vo.title + '</div>' +
                '<div class="desc">' + vo.content+ '</div>' +
            '</div></a>' +
            '<input type="hidden" name="relateitem[{idx}][outer_url]" value="' + vo.outer_url + '" />' +
            '<input type="hidden" name="relateitem[{idx}][title]" value="' + vo.title + '" />' +
            '<input type="hidden" name="relateitem[{idx}][img]" value="' + vo.img + '" />' +
            '<input type="hidden" name="relateitem[{idx}][content]" value="' + vo.content+ '" />' +
            '<div class="action"><a href="#prev" class="btn prev">前移</a><a href="#next" class="btn next">后移</a><a href="#edit" class="btn edit">编辑</a><a href="#close" class="btn close">移除</a></div>';

        DOM.removeClass(itemEl, 'empty-item');
        DOM.attr(itemEl, 'data-idx', idx);
        App.Panel.updateUI();

        this.dataMap[idx] = vo;
        this.dataIdx++;
        this.dataNum++;
    };

    //提交前填充idx，保持顺序一致
    Module.beforeSubmit = function(){
        S.each(DOM.children(this.root), function(itemEl, idx){
            S.each(DOM.query('input', itemEl), function(field){
                field.name = field.name.replace('{idx}', idx);
            });
        });
    };

    //@todo 关闭前的检查
    Module.append = function(btnEl){
        var curItemEl = this.curItemEl;
        var elements = DOM.get('form', DOM.parent(btnEl, 'div.modal')).elements;

        var vo = {
            outer_url : S.trim(elements.outer_url.value),
            img       : S.trim(elements.img.value),
            content   : S.trim(elements.content.value),
            title     : S.trim(elements.title.value)
        };

        if(!DOM.get('a', curItemEl)){
            this.createOneItem();
        }

        this.renderOne(curItemEl, vo);

        App.Panel.updateUI();
    };

    return Module;
}, {
    requires: ['dom', 'event', 'ajax', 'iee/modal']
});

KISSY.add('iee/postcompose', function(S, DOM, Event, IO, Modal){

    var Module = {};

    Module.new = function(){
        Module.init(function(){
            var eles = Module.eles;
            DOM.addClass(eles.root, 'postcompose-new');
            eles.form.reset();
        });
    };

    Module.edit = function(id){
        Module.init(function(){
            if(S.isPlainObject(id)){
                Module.fill(id);
            }else{
                IO.get('/my/query/?action=post&type=item&id=' + id, function(data){
                    Module.fill(data);
                }, 'json');
            }
        });
    };

    //填充编辑器数据
    Module.fill = function(data){
        var elements = this.eles.form.elements;

        //特别处理content
        var content = data.content;
        if(content){
            var div = document.createElement('div');
            div.innerHTML = content;
            content = '';
            S.each(DOM.query('p', div), function(el){
                var txt = S.trim(el.innerHTML);
                if(txt){ content += txt + "\n\r"; }
            });
            data.content = content;
        }

        //处理relateitem
        if(data.xitems && this.hasRelateItem){
            S.use('iee/relateitem', function(S, M){
                M.fill(data.xitems);
            });
        }

        S.each(data, function(value, key){
            DOM.val(elements[key], value);
        });
    };

    //加载编辑器
    Module.init = function(then){
        var self = this;

        if(self.isLoading){ return; }
        self.isLoading = true;

        App.Loading.show('正在加载编辑器');

        IO.get('/my/tmpl?name=postcompose', function(html){
            App.Panel.add('postcompose', html);
            App.Loading.hide();

            var root = DOM.get('#postcompose');
            self.eles = {
                root: root,
                form: DOM.get('form', root)
            };

            var relateItemEl = DOM.get('div.relate-item', root);
            if(relateItemEl){
                self.hasRelateItem = true;
                S.use('iee/relateitem', function(S, M){
                    M.init(relateItemEl);
                });
            }else{
                self.hasRelateItem = false;
            }

            self.init = function(then){
                App.Panel.switch('postcompose');

                if(this.hasRelateItem){
                    S.use('iee/relateitem', function(S, M){ M.init(); });
                }

                if(S.isFunction(then)){
                    then();
                }
            };

            self.init(then);
        });
    };

    //退出编辑
    Module.cancel = function(){
        App.Panel.back();
    };

    //预览文章
    Module.preview = function(el){
        var formEl = this.eles.form;
        formEl.elements['operate'].value = 'preview';
        formEl.submit();
    };

    //保存
    Module.save = function(){
        this.submit({
            operate: 'draft'
        });
    };

    //发布
    Module.publish = function(){
        this.submit({
            operate: 'publish'
        });
    };

    //提交文章
    Module.submit = function(params){
        var self = this;
        if(self.isSubmiting){
            return;
        }

        var formEl = self.eles.form;
        var elements = formEl.elements;

        elements['operate'].value = params.operate;

        if('publish' === params.operate){
            //执行表单检查
            if(!S.trim(elements['title'].value)){
                return alert('不要忘了标题');
            }

            //if(!S.trim(elements['outer_url'].value)){
                //return alert('不要忘了链接');
            //}

            if(!S.trim(elements['img'].value)){
                return alert('不要忘了图片');
            }
        }

        self.isSubmiting = true;

        if(self.hasRelateItem){
            S.use('iee/relateitem', function(S, M){
                M.beforeSubmit();
            });
        }

        IO({
            url: '/my/postsave',
            type: 'post',
            form: formEl,
            dataType: 'json',
            success: function(data){
                self.isSubmiting = false;

                if(data.success){
                    var idEl = elements['id'];

                    if(!idEl.value){
                        App.fire('createNewPost', data);
                    }

                    idEl.value = data.id;

                    var isDraft = 'draft' === params.operate;

                    var btns = [
                        {title: '返回编辑'},
                        {title: '查看文章列表', act: 'postlist/init'},
                        {title: '继续撰写', act: 'postcompose/new', primary: true}
                    ];

                    if(!isDraft){
                        btns.push({
                            title: '查看文章',
                            href: '/' + data.id,
                            dismiss: false
                        });
                    }

                    if(data.isFromSubmit){
                        btns.push({title: '返回Submit', act: 'submiturl/init'});
                    }

                    Modal.show({
                        content: '文章<strong>' + elements['title'].value + '</strong>已经成功' + (isDraft ? '保存草稿' : '发布'),
                        btns: btns
                    });
                }else{
                    Modal.show({
                        content: '文章保存失败',
                        btns: [{title: '返回重试'}]
                    });
                }
            },
            error: function(){
                self.isSubmiting = false;

                Modal.show({
                    content: '文章保存失败',
                    btns: [{title: '返回重试'}]
                });
            }
        });
    };

    return Module;
}, {
    requires: ['dom', 'event', 'ajax', 'iee/modal']
});
