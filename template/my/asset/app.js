/**
 * 模式对话框
 */
KISSY.add('iee/modal', function(S, DOM, Event, IO){

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


/**
 * 主程序
 */
KISSY.add('iee/app', function(S, DOM, Event, Anim){

    function bindEvent(){
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
    }

    var App = {
        //初始化
        init: function(config){
            bindEvent();

            config = config || {};
            this.config = config;

            S.config({
                map: [
                    [/iee\/(\w+)-min\.js.*/, 'p/my/t/' + config.version +  '/list/$1']
                ],
                packages: [{name: 'iee', charset: 'utf-8', path: 'http://' + document.domain + '/asset/js/'}]
            });

            if(config.module){
                S.use('iee/' + config.module, function(S, Module){
                    Module.init();
                });
            }
        },
        //获取配置
        getConfig: function(key){
            return this.config[key];
        }
    };

    /**
     * 面板管理
     */
    App.Panel = { /* {{{ */
        //初始化
        init: function(){
            var container = DOM.get('#content');
            this.root = DOM.get('div.my-content', container);
            this.width = DOM.width(container);

            this.panels = {};
            this.length = 0;

            this.states = [];
        },
        //增加面板
        add: function(cls, html){
            var el = document.createElement('div');
            el.idx = this.length;
            el.className = 'my-panel ' + cls;
            el.innerHTML = html;
            el.id = cls;
            this.root.appendChild(el);

            this.panels[cls] = el;
            this.length++;
            this.root.style.width = this.width * this.length + 'px';
        },
        //切换面板
        switch: function(cls){
            var self = this;
            var dest = self.panels[cls];
            if(!dest){
                return;
            }

            self.states.push(cls);

            var current = self.current;
            if(!current){   //说明当前只有这么一个
                self.current = dest;
                self.updateUI();
                return;
            }

            //遍历全部，将current和dest之外的结点置为none
            S.each(self.panels, function(panel){
                panel.style.display = (dest === panel || current === panel) ? 'block' : 'none';
            });

            //先设置好current，以便同步高度
            self.current = dest;
            self.updateUI();

            var root = self.root;
            var width = self.width;

            //决定怎么动画
            var isRight = dest.idx > current.idx;
            if(isRight){   //dest在右边
                root.style.marginLeft = '0px';
            }else{      //dest在左边
                root.style.marginLeft = 0 - width + 'px';
            }

            (new Anim(root, {
                marginLeft: isRight ? - width : 0
            }, 0.5, 'easeOutStrong', function(){
            })).run();
        },
        updateUI: function(){
            this.root.style.height = DOM.outerHeight(this.current) + 'px';
        },
        //回到前一个状态
        back: function(){
            if(1 < this.states.length){
                this.states.pop();
                this.switch(this.states.pop());
            }
        }
    }; /* }}} */

    App.Panel.init();

    /**
     * 加载指示
     */
    App.Loading = {
        show: function(message){
            var el = this.el;
            if(!el){
                el = DOM.create('<div id="topLoading"><p></p></div>');
                document.body.appendChild(el);
                this.el = el;
            }

            DOM.get('p', el).innerHTML = message;

            DOM.css(el, {
                top:  - DOM.outerHeight(el),
                left: (DOM.viewportWidth() - DOM.outerWidth(el)) / 2
            });

            this.start = + new Date();
            (new Anim(el, {
                top: 0
            }, 0.3, 'easeOutStrong')).run();
        },
        hide: function(){
            var el = this.el;
            if(el){
                var diff = 800  - new Date() + this.start;
                var doAnim = function(){
                    (new Anim(el, {
                        top: - DOM.outerHeight(el)
                    }, 0.3, 'easeOutStrong')).run();
                };

                //让loading能至少显示一段时间
                if(diff){
                    setTimeout(doAnim, diff);
                }else{
                    doAnim();
                }
            }
        }
    };

    S.mix(App, S.EventTarget);

    window.App = App;

    return App;
}, {
    requires: [
        'dom', 'event', 'anim'
    ]
});
