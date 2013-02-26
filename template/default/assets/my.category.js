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

        S.each(data, function(vo){
            var ns = vo.name.split('/');

            var boxEl = boxMap[ns[0]];
            if(!boxEl){
                boxEl = DOM.create('<div class="item"></div>');
                boxEl.innerHTML = '<input type="hidden" name="category[]" />';
                el.appendChild(boxEl);
                boxMap[ns[0]] = boxEl;
            }

            var itemEl = DOM.create('<span></span>');
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
        var isSelected = DOM.hasClass(trigger, 'selected');

        DOM[isSelected ? 'removeClass' : 'addClass'](trigger, 'selected');
    };

    return Biz;
}, {
    requires: [
        'dom', 'event'
    ]
});
