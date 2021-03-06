KISSY.add('iee/my.category', function(S, DOM, Event, IO){

    var Biz = {};

    Biz.init = function(){
        this.el = DOM.get('#category');
        this.render(window.categoryList);
        this.checkMax();
    };

    Biz.render = function(data){
        var self = this;
        var el = self.el;
        var boxMap = {};

        self.valueEl = DOM.get('input', el);

        var selected = {};
        S.each(self.valueEl.value.split(','), function(p){
            selected[p] = true;
        });

        S.each(data, function(vo){
            var ns = vo.name.split('/');

            var boxEl = boxMap[ns[0]];
            if(!boxEl){
                boxEl = DOM.create('<div class="item"></div>');
                el.appendChild(boxEl);
                boxMap[ns[0]] = boxEl;
            }

            var itemEl = DOM.create('<span></span>');
            itemEl.className = 'trigger' + (vo.id in selected ? ' selected' : '');
            DOM.attr(itemEl, 'data-id', vo.id);
            DOM.attr(itemEl, 'title', ns.join(': '));
            itemEl.innerHTML = ns.pop() + '<ins></ins>';

            boxEl.appendChild(itemEl);
        });

        Event.on(DOM.query('span', el), 'click', function(){
            self.select(this);
        });
    };

    Biz.select = function(trigger){
        var root = trigger.parentNode;

        if(DOM.hasClass(trigger, 'selected')){
            DOM.removeClass(trigger, 'selected');
        }else{
            //校验是否达到上限，每篇文章最多三个分类
            if(DOM.hasClass(this.el, 'max')){
                return;
            }
            DOM.addClass(trigger, 'selected');
        }

        //set value
        var val = [];
        S.each(DOM.query('span.selected', this.el), function(span){
            val.push(DOM.attr(span, 'data-id'));
        });
        this.valueEl.value = val.join(',');

        this.checkMax();
    };

    //停止上限的检查
    Biz.checkMax = function(){
        //if(this.valueEl.value.split(',').length >= 3){
            //DOM.addClass(this.el, 'max');
        //}else{
            //DOM.removeClass(this.el, 'max');
        //}
    };

    Biz.update = function(trigger){
        IO({
            type: 'post',
            url: trigger.getAttribute('data-url') || '/item/put',
            data: {
                category: this.valueEl.value,
                id: this.valueEl.form.elements['id'].value
            },
            success: function(data){
                var tipEl = DOM.next(trigger, 'span.tip');
                if(!tipEl){
                    tipEl = DOM.create('<span class="tip"></span>');
                    DOM.insertAfter(tipEl, trigger);
                }

                var html = '文章分类更新成功！';
                if(!data.success){
                    html = data.msg;
                }

                tipEl.innerHTML = html;
            }
        });
    };

    return Biz;
}, {
    requires: [
        'dom', 'event', 'ajax'
    ]
});
