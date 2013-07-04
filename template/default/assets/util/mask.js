/**
 * 页面遮罩
 */
KISSY.add('iee/util/mask', function(S, DOM, Event, UA){

    var element;

    var Mask = {
        show: function(params){
            if(!element){
                element = DOM.create('<div class="iee-mask"></div>');
                DOM.prepend(element, document.body);

                if(6 === UA.ie){
                    Event.on(window, 'resize scroll', function(){
                        DOM.css(element, 'top', DOM.scrollTop());
                        DOM.css(element, 'height', DOM.viewportHeight());
                    });
                }
            }

            var cls = ['iee-mask'];
            if(params && params.cls){
                cls.push('iee-mask-' + params.cls);
            }
            element.className = cls.join(' ');

            element.style.display = 'block';
        },
        hide: function(){
            if(element){
                element.style.display = 'none';
            }
        }
    };

    return Mask;

}, {
    requires: [
        'dom', 'event', 'ua'
    ]
});
