KISSY.add('iee/my.category', function(S, DOM, Event){

    var Biz = {};

    Biz.init = function(){
        this.el = DOM.get('#category');
        this.render(window.categoryList);
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
            var type = vo.type;
            var style = '';

            if('color' === type){
                style = 'background:' + vo.value;
            }

            if(style){
                style = ' style="' + style + '"';
            }

            itemEl.className = 'trigger' + (vo.id in selected ? ' selected' : '');
            DOM.attr(itemEl, 'data-id', vo.id);
            DOM.attr(itemEl, 'title', ns.join(': '));
            itemEl.innerHTML = ns.pop() + '<s' + style + '></s><ins></ins>';

            boxEl.appendChild(itemEl);
        });

        Event.on(DOM.query('span', el), 'click', function(){
            self.select(this);
        });
    };

    //一组里只能选中一个
    Biz.select = function(trigger){
        var root = trigger.parentNode;

        if(DOM.hasClass(trigger, 'selected')){
            //由选中变成未选中
            DOM.removeClass(trigger, 'selected');
        }else{
            DOM.removeClass(DOM.query('span.trigger', root), 'selected');
            DOM.addClass(trigger, 'selected');
        }

        //set value
        var val = [];
        S.each(DOM.query('span.selected', this.el), function(span){
            val.push(DOM.attr(span, 'data-id'));
        });
        this.valueEl.value = val.join(',');
    };

    return Biz;
}, {
    requires: [
        'dom', 'event'
    ]
});