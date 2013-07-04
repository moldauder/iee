/**
 * 浮层
 */
KISSY.add('iee/util/popup', function(S, DOM, Event, IO, Mask){

    /**
     * @param {Object} params 配置项
     * @param {String} params.header 头部内容
     * @param {String} params.content 正文内容
     * @param {Boolean} params.closable 是否可以关闭
     * @param {String} params.cls 附加的class
     * @param {String} params.mask 是否需要遮罩层
     * @param {String} params.center 是否自动居中定位
     *
     */
    function Popup(params){
        var self = this;
        var el = DOM.create('<div class="iee-popup"></div>', {
            html: '<div class="iee-popup-header"></div><div class="iee-popup-content"></div><a href="#hide" title="关闭" class="iee-popup-hide"></a>'
        });
        DOM.insertAfter(el, document.body.lastChild);

        self.el = el;
        self.headerEl = DOM.get('div.iee-popup-header', el);
        self.contentEl = DOM.get('div.iee-popup-content', el);

        Event.on(window, 'resize scroll', function(){
            if(!self.isShow){ return; }
            self.center();
        });

        Event.on(el, 'click', function(ev){
            if(DOM.hasClass(ev.target, 'iee-popup-hide')){
                ev.halt();
                self.hide();
            }
        });

        this.params = {
            cls: '',
            mask: true,
            center: true,
            header: '',
            content: '',
            closable: true
        };

        this._apply(params);
    }

    S.augment(Popup, S.EventTarget, {
        /**
         * 打开URL，以其内容作为浮层内容
         */
        open: function(url){
            var self = this;

            IO({
                url: url,
                success: function(html){
                    self.show({
                        content: html
                    });
                }
            });
        },
        /**
         * 显示浮层
         */
        show: function(params){
            this.isShow = true;
            if(params){
                this._apply(params);
            }

            Mask[this.params.mask ? 'show' : 'hide']({
                cls: this.params.maskCls
            });
            this.el.style.display = 'block';

            this.center();
            this.fire('show');
        },
        /**
         * 隐藏浮层
         */
        hide: function(){
            this.isShow = false;
            this.el.style.display = 'none';
            Mask.hide();
            this.fire('hide');
        },
        /**
         * 应用参数，设定反馈组件的各个部分
         */
        _apply: function(params){
            this.params = S.merge(this.params, params);

            for(var name in this.params){
                this._applyField(name, this.params[name]);
            }
        },
        /**
         * 具体配置
         */
        _applyField: function(name, v){
            if('cls' === name){
                this.el.className = 'iee-popup ' + (v || '');
            }else if('header' === name){
                if(v){
                    this.headerEl.innerHTML = v;
                    this.headerEl.style.display = 'block';
                }else{
                    this.headerEl.style.display = 'none';
                }
            }else if('content' === name){
                this.contentEl.innerHTML = v;
            }else if('closable' === name){
                //如果是不能关闭的话，则加上模式对话框的class
                this[v ? 'removeClass' : 'addClass']('iee-modal');
            }
        },
        /**
         * 添加样式
         */
        addClass: function(cls){
            DOM.addClass(this.el, cls);
            return this;
        },
        /**
         * 移除样式
         */
        removeClass: function(cls){
            DOM.removeClass(this.el, cls);
            return this;
        },
        /**
         * 变更某项配置
         */
        set: function(name, value){
            if(S.isPlainObject(name)){
                S.each(name, function(v, n){
                    this.params[n] = v;
                    this._applyField(n ,v);
                }, this);
            }else{
                this.params[name] = value;
                this._applyField(name, value);
            }
            return this;
        },
        /**
         * 浮层定位
         */
        center: function(){
            if(!this.params.center){
                return;
            }

            var el = this.el;
            var scrollTop = DOM.scrollTop();
            var viewportHeight = DOM.viewportHeight();

            DOM.css(el, {
                top: (viewportHeight - DOM.outerHeight(el)) * 6 / 13 + scrollTop,
                left: (DOM.viewportWidth() - DOM.outerWidth(el)) / 2
            });
        }
    });

    return Popup;

}, {
    requires: [
        'dom', 'event', 'ajax',
        'iee/util/mask'
    ]
});
