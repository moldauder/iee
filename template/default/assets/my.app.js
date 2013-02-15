KISSY.add('iee/my.app', function(S, DOM, Event, Anim, IO, Util, Modal){

    var cfg = {};

    var App = {
        init: function(config){
            Event.on(document.body, 'click', function(ev){
                var target = ev.target;
                var act = (DOM.attr(target, 'data-act') || '').split('/');

                if(2 !== act.length){ return; }
                if('A' === target.nodeName){ ev.preventDefault(); }

                S.use('iee/' + act[0], function(S, Module){
                    Module[act[1]](target);
                });
            });
            cfg = S.merge({}, config);

            //修订logout链接
            DOM.attr('#logout', 'href', '/logout?redirect=' + encodeURIComponent(location.pathname + location.search + location.hash));

            Util.make();
        },
        getConfig: function(key){
            return cfg[key];
        }
    };

    /**
     * 加载指示器
     */
    App.Loading = {
        show: function(message){
            var el = this.el;
            if(!el){
                el = DOM.create('<div class="top-loading"><p></p></div>');
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

    /**
     * App基类
     */
    App.Base = {
        init: function(){
            var root = DOM.get('#content');
            this.eles = {
                filterForm : DOM.query('form.filter-form', root)
            };

            this.initialize();
        },
        initialize: function(){
        },
        /**
         * 把表单转化成可查询的参数
         */
        form2Map: function(){
            return IO.serialize(this.eles.filterForm);
        },
        /**
         * 翻页
         */
        pager: function(target){
            window.location = DOM.attr(target, 'href') + '&' + this.form2Map();
        },
        /**
         * 执行搜索
         */
        search: function(){
            window.location = '?' + this.form2Map();
        },
        /**
         * 获取grid-item元素
         */
        getItemEl: function(el){
            if(DOM.hasClass(el, 'grid-item')){
                return el;
            }
            return DOM.parent(el, 'div.grid-item');
        },
        removeItemEl: function(el){
            DOM.remove(this.getItemEl(el));
        },
        /**
         * 获取反馈框
         */
        getFeedbackModal: function(){
            if(!this.feedbackModal){
                var title = document.title;
                this.feedbackModal = new Modal({
                    cls: 'feedback-modal',
                    title: title.substr(0, title.indexOf(' ')),
                    footer: [{
                        title: '知道了',
                        dismiss: true
                    }]
                });
            }
            return this.feedbackModal;
        },
        showFeedbackMsg: function(msg){
            var modal = this.getFeedbackModal();
            modal.setBody(msg);
            modal.show();
        }
    };

    window.App = App;

    return App;
}, {
    requires: [
        'dom', 'event', 'anim', 'ajax',
        'iee/util',
        'iee/util.modal'
    ]
});
