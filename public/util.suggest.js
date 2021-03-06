KISSY.add('iee/util.suggest', function(S, DOM, Event, IO){

    function Suggest(textInput, config){
        this.textInput = DOM.get(textInput);
        this.config = S.merge({}, config);

        this._init();
    }

    S.augment(Suggest, S.EventTarget, {
        _init: function(){
            var self = this;
            self._initList();

            //请求数据并展示
            self._request = S.throttle(function(){
                var q = S.trim(self.textInput.value);

                if(!q){
                    return self._hide();
                }

                IO.get(self.config.url, {
                    q: q
                }, function(data){
                    Event.detach(DOM.children(self.listEl), 'mouseenter mouseleave');

                    var html = '';
                    S.each(data, function(vo, idx){
                        html += '<div tabindex="0" class="suggest-list-item">' + self.config.render(vo, q, idx) + '</div>';
                    });
                    self.listEl.innerHTML = html;

                    self.itemList = DOM.children(self.listEl);
                    self.length = self.itemList.length;

                    Event.on(self.itemList, 'mouseenter mouseleave', function(ev){
                        if('mouseenter' === ev.type){
                            self.activeItem = this;
                            DOM.addClass(this, 'active');
                        }else{
                            DOM.removeClass(this, 'active');
                        }
                    });

                    Event.on(self.itemList, 'click', function(){
                        self._select();
                    });

                    if(data.length){
                        self._show();
                    }else{
                        self._hide();
                    }
                }, 'json');
            }, 120);

            self._monitor();

            //keyboard
            Event.on(self.textInput, 'keydown', function(ev){
                //40 == down
                //38 == up
                //13 enter
                if(self._isShow && self.length){
                    var keyCode = ev.keyCode;

                    if(40 === keyCode){
                        self._activeNext();
                    }else if(38 === keyCode){
                        self._activePrev();
                    }else if(13 === keyCode){
                        self._select();
                    }
                }
            });

            Event.on(document, 'click', function(ev){
                if(ev.target === self.textInput){
                    return;
                }

                S.later(function(){
                    self._hide();
                }, 50);
            });
        },
        /**
         * 初始化提示浮层
         */
        _initList: function(){
            if(!this.listEl){
                var el = DOM.create('<div></div>');
                el.className = 'suggest-list' + (this.config.cls ? (' ' + this.config.cls) : '' );
                DOM.insertBefore(el, document.body.lastChild);

                this.listEl = el;
            }
            this.listEl.display = 'none';
        },
        /**
         * 显示浮层
         */
        _show: function(){
            var self = this;
            var offset = DOM.offset(self.textInput);

            var top = offset.top + DOM.outerHeight(self.textInput) - 1;

            DOM.css(this.listEl, {
                width   : DOM.outerWidth(self.textInput) - 2,
                top     : top,
                left    : offset.left,
                height  : 'auto',
                display : 'block'
            });

            //校准高度
            var height=  DOM.outerHeight(this.listEl);
            var diff = DOM.viewportHeight() + DOM.scrollTop() - top - height;
            if(diff < 0){   //说明高度超出了
                this.listEl.style.height = height + diff - 20 + 'px';
            }

            self._isShow = true;
        },
        _hide: function(){
            this._isShow = false;
            this.listEl.style.display = 'none';
        },
        _activeNext: function(){
            var el = this.activeItem ? DOM.next(this.activeItem) : null;
            el = el || this.itemList[0];
            this._activate(el);
        },
        _activePrev: function(){
            var el = this.activeItem ? DOM.prev(this.activeItem) : null;
            el = el || this.itemList[this.length - 1];
            this._activate(el);
        },
        _activate: function(itemEl){
            if(itemEl !== this.activeItem){
                DOM.removeClass(this.activeItem, 'active');
                DOM.addClass(itemEl, 'active');
                this.activeItem = itemEl;
            }
        },
        _select: function(){
            var self = this;

            Event.detach(self.textInput, 'valuechange focus');

            self.fire('select', {
                element: self.activeItem
            });
            self._hide();

            S.later(function(){
                self._monitor();
            }, 120);
        },
        _monitor: function(){
            var self = this;
            Event.on(self.textInput, 'valuechange focus', function(){
                self._request();
            });
        }
    });

    return Suggest;
}, {
    requires: [
        'dom', 'event', 'ajax',
        'iee/util.suggest.css'
    ]
});

