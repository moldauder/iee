KISSY.add('iee/my.modal', function(S, DOM, Event, IO){

    var eles;
    var isShow;

    var init = function(){
        var element = DOM.create('<div class="modal"></div>');
        document.body.appendChild(element);

        element.innerHTML = '<div class="modal-header"></div>' +
            '<div class="modal-body"></div>' +
            '<div class="modal-footer"></div>';

        eles = {
            el       : element,
            headerEl : DOM.get('div.modal-header', element),
            bodyEl   : DOM.get('div.modal-body', element),
            footerEl : DOM.get('div.modal-footer', element),
        };

        isShow = false;

        Event.on(window, 'scroll resize', function(){
            if(isShow){
                Modal._center();
            }
        });

        Event.on(eles.footerEl, 'click', function(vo){
            if('true' === DOM.attr(vo.target, 'data-dismiss')){
                setTimeout(function(){
                    Modal.hide();
                }, 50);
            }
        });

        init = function(){};
    };

    var Modal = {
        open: function(url, title, params){
            var self = this;
            self.show({
                title: title,
                content: '加载中...',
                callback: function(){
                    IO.get(url, new Date().getTime(), function(html){
                        params.title = title;
                        params.content = html;
                        self.show(params);
                    }, 'html');
                }
            });
        },
        /**
         * params.title
         * params.content
         * params.btns
         *
         * params.mask
         * params.callback
         */
        show: function(params){
            if('string' === typeof params){
                params = {
                    content: params
                };
            }

            init();
            var headerEl = eles.headerEl;
            if(params.title){
                headerEl.innerHTML = params.title;
                headerEl.style.display = 'block';
            }else{
                headerEl.style.display = 'none';
            }

            eles.bodyEl.innerHTML = params.content;

            var footerHtml = '';
            /**
             * title 标题
             * act: 触发的操作
             * primary true|false 主按钮
             * href 链接（将以链接展示）
             * dismiss 默认为true，点击后会关闭层
             */
            S.each(params.btns || [{
                title: '好的',
                act: 'modal/hide'
            }], function(vo){
                var cls = ['btn'];
                if(vo.primary){
                    cls.push('btn-primary');
                }

                vo.dismiss = ('dismiss' in vo) ? vo.dismiss : true;
                vo.dismiss = vo.dismiss ? ' data-dismiss="true" ' : '';

                if(vo.href){
                    footerHtml += '<a class="' + cls.join(' ') + '" ' + vo.dismiss + ' href="' + vo.href + '" target="_blank">' + vo.title + '</a>';
                }else{
                    footerHtml += '<button class="' + cls.join(' ') + '" ' + vo.dismiss + ' type="button" data-act="' + (vo.act || 'modal/hide') + '">' + vo.title + '</button>';
                }
            });
            eles.footerEl.innerHTML = footerHtml;

            //默认展示mask
            params.mask = ('mask' in params) ? params.mask : true;
            if(params.mask){
                this._showMask();
            }else{
                this._hideMask();
            }

            eles.el.style.visibility = 'visible';
            this._center();
            isShow = true;

            if(S.isFunction(params.callback)){
                params.callback(eles.bodyEl);
            }
        },
        hide: function(){
            eles.el.style.visibility = 'hidden';
            this._hideMask();
            isShow = false;
        },
        _center: function(){
            var element = eles.el;
            DOM.css(element, {
                top: DOM.scrollTop() + (DOM.viewportHeight() - DOM.outerHeight(element)) * 3 / 7,
                left: DOM.scrollLeft() + (DOM.viewportWidth() - DOM.outerWidth(element)) / 2
            });
        },
        _showMask: function(){
            var el = eles.maskEl;
            if(!el){
                el = DOM.create('<div class="modal-backdrop"></div>');
                document.body.appendChild(el);
                eles.maskEl = el;
            }
            el.style.visibility = 'visible';
        },
        _hideMask: function(){
            if(eles.maskEl){
                eles.maskEl.style.visibility = 'hidden';
            }
        }
    };

    return Modal;

}, {
    requires: [
        'dom', 'event', 'ajax'
    ]
});

