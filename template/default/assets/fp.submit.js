KISSY.add('iee/fp.submit', function(S, DOM, Event, IO, Anim){

    var Submit = {};

    Submit.init = function(){
        var socialmEl = DOM.get('#socialm');
        if(!socialmEl){ return; }

        this._el = DOM.create('<div class="submiturl"></div>');
        this._el.innerHTML = '<div class="box"><div class="formCont">' +
                '<span class="close"></span><span class="arrow"></span>' +
                '<div class="fieldCont"><form>' +
                    '<div class="field-url"><input id="s1" name="url" autocomplete="off" type="text"><label for="s1">http://</label></div>' +
                    '<div class="field-remark"><input id="s2" name="remark" autocomplete="off" type="text"><label for="s2">如果你愿意，可以在这里输入您的推荐理由</label></div>' +
                    '<div class="field-nick"><input id="s3" name="nick" autocomplete="off" type="text"><label for="s3">输入你的昵称</label></div>' +
                    '<div class="field-weibo"><input id="s4" name="weibo" autocomplete="off" type="text"><label for="s4">输入你的新浪微博账号</label></div>' +
                '</form></div>' +
            '<div class="field-btn"><button></button><span class="err"></span></div>' +
        '</div></div>';
        DOM.prepend(this._el, '#content');

        this._container = DOM.get('div.box', this._el);
        this._fieldCont = DOM.get('div.fieldCont', this._el);
        this._formEl = DOM.get('form', this._el);
        this._errEl = DOM.get('span.err', this._el);
        this._formCont = DOM.get('div.formCont', this._el);

        this._trigger = DOM.create('<div class="submit"></div>');
        this._trigger.innerHTML = '<s></s><s class="arrow"></s>';
        socialmEl.appendChild(this._trigger);

        this._initEvents();
    };

    var isExpand = false;
    var boxElHeight = 0;

    Submit._initEvents = function(){
        var self = this;

        Event.on(self._trigger, 'click', function(){
            if(isExpand){
                self._hide();
            }else{
                isExpand = true;
                DOM.removeClass(DOM.query('div.field-focus', self._el), 'field-focus');
                (new Anim(self._el, {
                    height: DOM.outerHeight(self._container)
                }, 0.6, 'easeOutStrong', function(){
                    self._el.style.height = 'auto';
                    DOM.addClass(self._trigger, 'submit-expand');
                })).run();
            }
        });

        Event.on(DOM.get('span.close', this._el), 'click', function(){
            self._hide();
        });

        S.each(DOM.query('input', self._el), function(el){
            Event.on(el, 'focus', function(){
                DOM.addClass(this.parentNode, 'field-focus');
            });

            var name = el.name;
            if('url' === name){
                Event.on(el, 'focus', function(){
                    if(boxElHeight < 180){
                        self._expandBox(180);
                    }
                });
            }else if('remark' === name){
                Event.on(el, 'focus', function(){
                    if(boxElHeight < 220){
                        self._expandBox(220);
                    }
                });
            }

            Event.on(el, 'blur', function(){
                if(!S.trim(this.value)){
                    this.value = '';
                    DOM.removeClass(this.parentNode, 'field-focus');
                }
            });
        });

        Event.on(DOM.get('button', self._el), 'click', function(ev){
            ev.halt();
            self._submit();
        });

    };

    Submit._hide = function(){
        if(!isExpand){
            return;
        }

        boxElHeight = 0;
        isExpand = false;

        var self = this;

        (new Anim(self._el, {
            height: 0
        }, 0.6, 'easeInStrong', function(){
            DOM.css(self._formCont, {
                opacity: 1,
                display: 'block'
            });
            self._fieldCont.style.height = '120px';

            self._errEl.innerHTML = '';
            self._formEl.reset();
            DOM.removeClass(self._trigger, 'submit-expand');
            DOM.remove(DOM.get('div.thanks', self._el));
        })).run();
    };

    Submit._expandBox = function(height){
        boxElHeight = height;
        (new Anim(this._fieldCont, {
            height: height
        }, 0.3, 'easeOutStrong')).run();
    };

    Submit._submit = function(){
        var self = this;
        var urlEl = self._formEl.elements.url;
        if(!S.trim(urlEl.value)){
            self._errEl.innerHTML = '请输入您要推荐的网址';
            return;
        }

        IO({
            url: '/submit/commit',
            type: 'post',
            form: self._formEl,
            success: function(){
                (new Anim(self._formCont, {
                    opacity: 0
                }, 0.3, 'easeOutStrong', function(){
                    var destHeight = DOM.outerHeight(self._formCont);
                    self._formCont.style.display = 'none';

                    var thanksEl = DOM.create('<div class="thanks"></div>');
                    DOM.insertAfter(thanksEl, self._formCont);
                    thanksEl.style.height = destHeight + 'px';

                    (new Anim(thanksEl, {
                        opacity: 1
                    }, 0.4, 'easeInStrong', function(){
                        setTimeout(function(){
                            self._hide();
                        }, 2400);
                    })).run();
                })).run();
            }
        });
    };

    return Submit;

}, {
    requires: [
        'dom', 'event', 'ajax', 'anim'
    ]
});
