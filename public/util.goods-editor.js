KISSY.add('iee/util.goods-editor', function(S, DOM, Event, Modal, Validation){

    var currencyMap = {
        rmb: '￥',
        dollar: '$',
        pound: '£',
        deutsche: '€'
    };

    function GoodsEditor(el){
        this.el = DOM.get(el);
        this.init();
    }

    S.augment(GoodsEditor, S.EventTarget, {
        /**
         * 编辑器初始化
         */
        init: function(){
            var self = this;
            self.modal = new Modal({
                cls   : 'goods-editor-modal',
                title : '编辑商品',
                body  : '<div class="goods-item-list"><div class="goods-editor-item empty" data-event="addItem">add</div></div>' +
                        '<div class="goods-item-editor"><form>' +
                            '<div class="form-field">' +
                                '<div class="field-hd"><label for="goodsEditorTitle">标题</label></div>' +
                                '<div class="field-bd"><input id="goodsEditorTitle" class="text" autocomplete="off" value="" data-validate=\'["require"]\' type="text" name="title" /></div>' +
                            '</div>' +
                            '<div class="form-field">' +
                                '<div class="field-hd"><label for="goodsEditorContent">描述</label></div>' +
                                '<div class="field-bd"><textarea id="goodsEditorContent" class="text" type="text" name="content" data-validate=\'["require"]\' rows="6"></textarea></div>' +
                            '</div>' +
                            '<div class="form-field">' +
                                '<div class="field-hd"><label for="goodsEditorImg">图片</label></div>' +
                                '<div class="field-bd"><input id="goodsEditorImg" class="text" autocomplete="off" value="" type="text" data-validate=\'["require"]\' name="img" placeholder="请上传1000x640的图片" /></div>' +
                            '</div>' +
                            '<div class="form-field">' +
                                '<div class="field-hd"><label for="goodsEditorLink">链接</label></div>' +
                                '<div class="field-bd"><input id="goodsEditorLink" class="text" autocomplete="off" value="" type="text" data-validate=\'["require"]\' name="url" /></div>' +
                            '</div>' +
                            '<div class="form-field">' +
                                '<div class="field-hd"><label for="goodsEditorPrice">价格</label></div>' +
                                '<div class="field-bd"><select name="currency"><option value="rmb">人民币</option><option value="dollar">美元</option></select><input id="goodsEditorPrice" class="text" autocomplete="off" value="" type="text" name="price" /></div>' +
                            '</div>' +
                            '<div class="form-field">' +
                                '<div class="field-hd"></div><div class="field-bd">' +
                                '<span tabindex="0" data-event="saveItem" class="btn">确定</span>' +
                                '<span tabindex="0" data-event="closeItemEditor" class="btn">取消</span>' +
                            '</div></div>' +
                        '</form></div>',
                footer : '<span tabindex="0" class="btn btn-primary" data-event="save">保存</span><span tabindex="0" class="btn" data-event="cancel">关闭</span>'
            });

            self.editorEl         = self.modal.bodyEl;
            self.itemListEl       = DOM.get('div.goods-item-list', self.editorEl);
            self.itemEditorEl     = DOM.get('div.goods-item-editor', self.editorEl);
            self.itemEditorFormEl = DOM.get('form', self.itemEditorEl);
            self.checkObj         = new Validation(self.itemEditorFormEl);

            //绑定编辑器浮层中的事件
            Event.on(self.modal.el, 'click', function(ev){
                self.dispatchEvent(ev.target, ev);
            });

            self.el.innerHTML = '<div class="goods-editor-preview"></div><a class="btn goods-editor-trigger">编辑商品</a>';
            self.previewEl = DOM.get('div.goods-editor-preview', self.el);

            Event.on(DOM.get('a.goods-editor-trigger', this.el), 'click', function(ev){
                ev.halt();
                self.closeItemEditor(); //弹开编辑器的时候，不要展示商品信息编辑的表单
                self.modal.show();
            });

            var dataVar = DOM.attr(this.el, 'data-var');
            if(dataVar){
                self.fill(window[dataVar] || []);
            }
        },
        /**
         * 关闭编辑器
         */
        cancel: function(){
            this.modal.hide();
        },
        /**
         * 保存结果到页面
         */
        save: function(){
            var self = this;
            var html = '';

            S.each(DOM.children(self.itemListEl), function(itemEl, idx){
                var data = self.getItemData(itemEl);
                if(!data){
                    return;
                }

                html += '<a href="' + data.url + '" target="_blank"><img width="120" src="' + data.img  + '" title="' + data.title + '" /></a>' +
                    '<input type="hidden" name="goodsitem[' + idx + '][url]" value="' + data.url + '" />' +
                    '<input type="hidden" name="goodsitem[' + idx + '][img]" value="' + data.img + '" />' +
                    '<input type="hidden" name="goodsitem[' + idx + '][title]" value="' + data.title + '" />' +
                    '<input type="hidden" name="goodsitem[' + idx + '][currency]" value="' + data.currency + '" />' +
                    '<input type="hidden" name="goodsitem[' + idx + '][price]" value="' + data.price + '" />' +
                    '<textarea name="goodsitem[' + idx + '][content]">' + data.content + '</textarea>';
            });

            self.previewEl.innerHTML = html;
            self.cancel();
        },
        /**
         * 派发事件
         */
        dispatchEvent: function(trigger, ev){
            var event = DOM.attr(trigger, 'data-event');
            if(event){
                ev.halt();
            }

            if(this[event]){
                this[event](trigger);
            }
        },
        /**
         * 添加条目
         *
         * @param HTMLElement trigger 事件源，必然是item元素本身
         */
        addItem: function(trigger){
            this.activeItemEl = trigger;
            this.openItemEditor();
        },
        /**
         * 展示商品信息编辑表单
         */
        openItemEditor: function(data){
            if(S.isPlainObject(data)){
                var elements = this.itemEditorFormEl.elements;

                for(var key in data){
                    DOM.val(elements[key], data[key]);
                }
            }else{
                this.itemEditorFormEl.reset();
            }

            DOM.addClass(this.editorEl, 'goods-editor-mode-edit');
        },
        /**
         * 收起商品信息编辑表单
         */
        closeItemEditor: function(){
            DOM.removeClass(this.editorEl, 'goods-editor-mode-edit');
        },
        /**
         * 保存条目
         */
        saveItem: function(){
            var self = this;

            self.checkObj.validate(function(isPass){
                if(isPass){
                    //返回修改当前项目
                    var elements = self.itemEditorFormEl.elements;
                    self.activeItemEl.innerHTML = self.renderItemData({
                        title     : S.trim(DOM.val(elements.title)),
                        content   : S.trim(DOM.val(elements.content)),
                        url       : S.trim(DOM.val(elements.url)),
                        img       : S.trim(DOM.val(elements.img)),
                        currency  : DOM.val(elements.currency),
                        price     : S.trim(DOM.val(elements.price))
                    });

                    //移除不需要的样式
                    DOM.removeClass(self.activeItemEl, 'empty');

                    //收起
                    self.closeItemEditor();

                    //重置表单
                    self.itemEditorFormEl.reset();

                    //创建一个新的trigger
                    if(!DOM.children(self.itemListEl, '.empty').length){
                        DOM.removeAttr(self.activeItemEl, 'data-event');
                        DOM.prepend(DOM.create('<div class="goods-editor-item empty" data-event="addItem">add</div>'), self.itemListEl);
                    }
                }
            });
        },
        /**
         * 渲染一个商品
         */
        renderItemData: function(data){
            var currency = data.currency;

            return '<a target="_blank" class="item" href="' + data.url + '" data-currency="' + currency + '">' +
                '<img src="' + data.img + '" />' +
                '<div class="mask"></div>' +
                '<div class="extra">' +
                    '<div class="title">' + data.title + '</div>' +
                    '<div class="price"><span class="unit ' + currency + '">' + currencyMap[currency] + '</span><span class="pricestr">' + data.price + '</span></div>' +
                    '<div class="content">' + data.content + '</div>' +
                '</div></a>' +
                '<div class="action">' +
                '<span data-event="prevItem">前移</span>' +
                '<span data-event="nextItem">后移</span>' +
                '<span data-event="modifyItem">修改</span>' +
                '<span data-event="removeItem">删除</span>' +
                '</div>';
        },
        /**
         * 填充数据
         */
        fill: function(data){
            var self = this;
            var html = '';

            S.each(data, function(vo){
                html += '<div class="goods-editor-item">' + self.renderItemData(vo) + '</div>';
            });

            self.itemListEl.innerHTML = '<div class="goods-editor-item empty" data-event="addItem">add</div>' + html;
            self.save();
        },
        /**
         * 修改商品
         */
        modifyItem: function(trigger){
            var itemEl = DOM.parent(trigger, 'div.goods-editor-item');
            this.activeItemEl = itemEl;
            this.openItemEditor(this.getItemData(itemEl));
        },
        getItemData: function(itemEl){
            var linkEl = DOM.get('a.item', itemEl);

            return DOM.hasClass(itemEl, 'empty') ? null : {
                url      : DOM.attr(linkEl, 'href'),
                img      : DOM.attr(DOM.get('img', linkEl), 'src'),
                title    : DOM.html(DOM.get('div.title', linkEl)),
                content  : DOM.html(DOM.get('div.content', linkEl)),
                currency : DOM.attr(linkEl, 'data-currency'),
                price    : DOM.html(DOM.get('span.pricestr', linkEl))
            };
        },
        /**
         * 删除商品
         */
        removeItem: function(trigger){
            DOM.remove(DOM.parent(trigger, 'div.goods-editor-item'));
        },
        /**
         * 移动商品，向前移动
         */
        prevItem: function(trigger){
            var itemEl = DOM.parent(trigger, 'div.goods-editor-item');
            var prevEl = DOM.prev(itemEl);

            if(prevEl){
                DOM.insertBefore(itemEl, prevEl);
            }else{
                DOM.append(itemEl, this.itemListEl);
            }
        },
        nextItem: function(trigger){
            var itemEl = DOM.parent(trigger, 'div.goods-editor-item');
            var nextEl = DOM.next(itemEl);

            if(nextEl){
                DOM.insertAfter(itemEl, nextEl);
            }else{
                DOM.prepend(itemEl, this.itemListEl);
            }
        }
    });

    return GoodsEditor;
}, {
    requires: [
        'dom', 'event',
        'iee/util.modal',
        'iee/util.validation',
        'iee/util.goods-editor.css',
        'iee/util.modal.css'
    ]
});
