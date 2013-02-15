KISSY.add('iee/util.album-editor', function(S, DOM, Event, Modal, Validation){

    function AlbumEditor(el){
        this.el = DOM.get(el);
        this.init();
    }

    S.augment(AlbumEditor, S.EventTarget, {
        /**
         * 专辑编辑器初始化
         */
        init: function(){
            var self = this;
            self.modal = new Modal({
                cls   : 'album-editor-modal',
                title : '编辑专辑商品',
                body  : '<div class="album-item-list"><div class="album-editor-item empty" data-event="addItem">add</div></div>' +
                        '<div class="album-item-editor"><form>' +
                            '<div class="form-field">' +
                                '<div class="field-hd"><label>标题</label></div>' +
                                '<div class="field-bd"><input autocomplete="off" value="海鸥食堂 かもめ食堂" data-validate=\'["require"]\' type="text" name="title" /></div>' +
                            '</div>' +
                            '<div class="form-field">' +
                                '<div class="field-hd"><label>描述</label></div>' +
                                '<div class="field-bd"><textarea type="text" name="content" data-validate=\'["require"]\'>我想练合气道</textarea></div>' +
                            '</div>' +
                            '<div class="form-field">' +
                                '<div class="field-hd"><label>图片</label></div>' +
                                '<div class="field-bd"><input autocomplete="off" value="http://pic.yupoo.com/iewei/CCtEbRds/dVXmM.jpg" type="text" data-validate=\'["require"]\' name="img" /></div>' +
                            '</div>' +
                            '<div class="form-field">' +
                                '<div class="field-hd"><label>链接</label></div>' +
                                '<div class="field-bd"><input autocomplete="off" value="http://v.youku.com/v_show/id_XMzY5Mjg4NTMy.html" type="text" data-validate=\'["require"]\' name="outer_url" /></div>' +
                            '</div>' +
                            '<div class="form-field">' +
                                '<div class="field-hd"></div><div class="field-bd">' +
                                '<span tabIndex="0" data-event="saveItem" class="btn">保存</span>' +
                                '<span tabIndex="0" data-event="closeItemEditor" class="btn">取消</span>' +
                            '</div></div>' +
                        '</form></div>',
                footer : '<span class="btn btn-primary" data-event="save">确定</span><span class="btn" data-event="cancel">返回</span>'
            });

            self.editorEl         = self.modal.bodyEl;
            self.itemListEl       = DOM.get('div.album-item-list', self.editorEl);
            self.itemEditorEl     = DOM.get('div.album-item-editor', self.editorEl);
            self.itemEditorFormEl = DOM.get('form', self.itemEditorEl);
            self.checkObj         = new Validation(self.itemEditorFormEl);

            //绑定编辑器浮层中的事件
            Event.on(self.modal.el, 'click', function(ev){
                self.dispatchEvent(ev.target, ev);
            });

            self.el.innerHTML = '<div class="album-editor-preview"></div><a class="btn album-editor-trigger">编辑专辑商品</a>';
            self.previewEl = DOM.get('div.album-editor-preview', self.el);

            Event.on(DOM.get('a.album-editor-trigger', this.el), 'click', function(ev){
                ev.halt();
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

                html += '<a href="' + data.outer_url + '" target="_blank"><img width="120" src="' + data.img  + '" title="' + data.title + '" /></a>' +
                    '<input type="hidden" name="albumitem[' + idx + '][outer_url]" value="' + data.outer_url + '" />' +
                    '<input type="hidden" name="albumitem[' + idx + '][img]" value="' + data.img + '" />' +
                    '<input type="hidden" name="albumitem[' + idx + '][title]" value="' + data.title + '" />' +
                    '<textarea name="albumitem[' + idx + '][content]">' + data.content + '</textarea>';
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
            }

            DOM.addClass(this.editorEl, 'album-editor-mode-edit');
        },
        /**
         * 收起商品信息编辑表单
         */
        closeItemEditor: function(){
            //S.one(this.itemEditorEl).slideUp(0.5, function(){
            //}, 'easeOutStrong');
            DOM.removeClass(this.editorEl, 'album-editor-mode-edit');
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
                        outer_url : S.trim(DOM.val(elements.outer_url)),
                        img       : S.trim(DOM.val(elements.img))
                    });

                    //移除不需要的样式
                    DOM.removeClass(self.activeItemEl, 'empty');

                    //收起
                    self.closeItemEditor();

                    //创建一个新的trigger
                    if(!DOM.children(self.itemListEl, '.empty').length){
                        DOM.removeAttr(self.activeItemEl, 'data-event');
                        DOM.append(DOM.create('<div class="album-editor-item empty" data-event="addItem">add</div>'), self.itemListEl);
                    }
                }
            });
        },
        /**
         * 渲染一个商品
         */
        renderItemData: function(data){
            return '<a target="_blank" class="item" href="' + data.outer_url + '">' +
                '<img src="' + data.img + '" />' +
                '<div class="mask"></div>' +
                '<div class="extra">' +
                '<div class="title">' + data.title + '</div>' +
                '<div class="desc">' + data.content + '</div>' +
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
                html += '<div class="album-editor-item">' + self.renderItemData(vo) + '</div>';
            });

            self.itemListEl.innerHTML = html + '<div class="album-editor-item empty" data-event="addItem">add</div>';
            self.save();
        },
        /**
         * 修改商品
         */
        modifyItem: function(trigger){
            var itemEl = DOM.parent(trigger, 'div.album-editor-item');
            this.activeItemEl = itemEl;
            this.openItemEditor(this.getItemData(itemEl));
        },
        getItemData: function(itemEl){
            return DOM.hasClass(itemEl, 'empty') ? null : {
                outer_url : DOM.attr(DOM.get('a.item', itemEl), 'href'),
                img       : DOM.attr(DOM.get('img', itemEl), 'src'),
                title     : DOM.html(DOM.get('div.title', itemEl)),
                content   : DOM.html(DOM.get('div.desc', itemEl))
            };
        },
        /**
         * 删除商品
         */
        removeItem: function(trigger){
            DOM.remove(DOM.parent(trigger, 'div.album-editor-item'));
        },
        /**
         * 移动商品，向前移动
         */
        prevItem: function(trigger){
            var itemEl = DOM.parent(trigger, 'div.album-editor-item');
            var prevEl = DOM.prev(itemEl);

            if(prevEl){
                DOM.insertBefore(itemEl, prevEl);
            }else{
                DOM.append(itemEl, this.itemListEl);
            }
        },
        nextItem: function(trigger){
            var itemEl = DOM.parent(trigger, 'div.album-editor-item');
            var nextEl = DOM.next(itemEl);

            if(nextEl){
                DOM.insertAfter(itemEl, nextEl);
            }else{
                DOM.prepend(itemEl, this.itemListEl);
            }
        }
    });

    return AlbumEditor;
}, {
    requires: [
        'dom', 'event',
        'iee/util.modal',
        'iee/util.validation',
        'iee/util.album-editor.css',
        'iee/util.modal.css'
    ]
});
