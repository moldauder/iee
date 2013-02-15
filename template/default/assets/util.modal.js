/**
 * 模式对话框
 */
KISSY.add('iee/util.modal', function(S, DOM, Event, IO){

    var eles;
    var isShow;

    function Modal(params){
        this.init();

        params = params || {};

        this.setTitle(params.title);
        this.setBody(params.body);
        this.setFooter(params.footer);

        if(params.cls){
            DOM.addClass(this.el, params.cls);
            DOM.addClass(this.maskEl, params.cls + '-mask');
        }
    }

    S.augment(Modal, S.EventTarget, S.Base.Attribute, {
        init: function(){
            var self = this;

            self.el = DOM.create('<div class="modal"></div>');
            self.el.innerHTML = '<div class="modal-header"></div><div class="modal-body"></div><div class="modal-footer"></div>';
            self.headerEl = DOM.get('div.modal-header', self.el);
            self.bodyEl = DOM.get('div.modal-body', self.el);
            self.footerEl = DOM.get('div.modal-footer', self.el);

            DOM.insertBefore(self.el, document.body.lastChild);

            self.maskEl = DOM.create('<div class="modal-mask"></div>');
            DOM.insertBefore(self.maskEl, self.el);

            Event.on(window, 'scroll resize', function(){
                if(self.isShow){
                    self.center();
                }
            });
            Event.on(self.footerEl, 'click', function(vo){
                if('true' === DOM.attr(vo.target, 'data-dismiss')){
                    self.hide();
                }
            });
        },
        setTitle: function(title){
            if(title){
                this.headerEl.innerHTML = title;
                this.headerEl.style.display = 'block';
            }else{
                this.headerEl.style.display = 'none';
            }
        },
        setBody: function(html){
            this.bodyEl.innerHTML = html || '';
        },
        setFooter: function(html){
            if(html){
                /*
                 * title 标题
                 * act: 触发的操作
                 * primary true|false 主按钮
                 * href 链接（将以链接展示）
                 * dismiss 默认为true，点击后会关闭层
                 */
                if(S.isArray(html)){
                    var footerHtml = '';
                    S.each(html, function(vo){
                        var cls = ['btn'];
                        if(vo.primary){
                            cls.push('btn-primary');
                        }

                        var dismiss = vo.dismiss;
                        dismiss = dismiss ? ' data-dismiss="true" ' : '';

                        if(vo.href){
                            footerHtml += '<a class="' + cls.join(' ') + '" ' + ' href="' + vo.href + '" ' + dismiss + ' target="' + (vo.target || '_blank') + '">' + vo.title + '</a>';
                        }else{
                            footerHtml += '<span class="' + cls.join(' ') + '" ' + dismiss + ' data-act="' + vo.act + '">' + vo.title + '</span>';
                        }
                    });
                    this.footerEl.innerHTML = footerHtml;
                }else{
                    this.footerEl.innerHTML = html;
                }

                this.footerEl.style.display = 'block';
            }else{
                this.footerEl.style.display = 'none';
            }
        },
        /**
         * 打开一个链接地址
         */
        open: function(url, title){
            var self = this;

            self.setTitle(title);
            self.setBody('加载中...');
            self.show();

            IO.get(url, new Date().getTime(), function(html){
                self.setBody(html);
                self.center();
            }, 'html');
        },
        show: function(){
            this.el.style.visibility = 'visible';
            this.maskEl.style.visibility = 'visible';
            this.isShow = true;
            this.center();
            this.fire('show');
        },
        hide: function(){
            this.el.style.visibility = 'hidden';
            this.maskEl.style.visibility = 'hidden';
            this.isShow = false;
            this.fire('hide');
        },
        center: function(){
            var el = this.el;
            DOM.css(el, {
                top: DOM.scrollTop() + (DOM.viewportHeight() - DOM.outerHeight(el)) * 3 / 7,
                left: DOM.scrollLeft() + (DOM.viewportWidth() - DOM.outerWidth(el)) / 2
            });
        }
    });

    return Modal;
}, {
    requires: [
        'dom', 'event', 'ajax',
        'iee/util.modal.css'
    ]
});

