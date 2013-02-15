KISSY.add('iee/util', function(S, DOM, Event){

    var Util = {};

    //消息中心
    var messageCenter = S.mix({}, S.EventTarget);

    //创建好的对象的缓存
    //cache[fnid + '/' + name]
    var cache = {};

    /**
     * 获取或者创建元素的fnid
     */
    function fnid(el){
        var id = DOM.data(el, 'fnid');
        if(!id){
            id = 'fn' + S.guid();
            DOM.data(el, 'fnid', id);
        }
        return id;
    }

    Util.make = function(root){
        S.each(DOM.query('.fn-util', root || document.body), function(el){
            var matches = el.className.match(/\bfn-(?!util)([\w-]+)\b/);
            if(matches){
                var name = matches[1];
                var key = fnid(el) + '/' + name;

                if(cache[key]){ return; }
                cache[key] = 1;   //先标记好，以免重复创建

                S.use('iee/util.' + name, function(S, Cls){
                    var obj = new Cls(el);
                    messageCenter.fire(key, {obj: obj});
                    cache[key] = obj;
                });
            }
        });
    };
    /**
     * 使用元素上附加的组件
     *
     * @param {String|HTMLElement|Array} fn元素
     * @param {String|name} fn组件名
     * @param {Function} then回调函数
     *
     * 当el是数组的时候，则要全部就绪
     * el= [[],[],[]]
     *
     * @todo 省掉name参数....
     */
    Util.use = function(el, name, then){
        //规范化参数
        if(S.isArray(el)){
            then = name;
        }else{
            el = [[el, name]];
        }

        var num = el.length;
        var objList = new Array(num);
        var ready = function(obj, idx){
            objList[idx] = obj;
            num--;

            if(0 == num){
                then.apply({}, objList);
            }
        };

        S.each(el, function(arr, idx){
            el = DOM.get(arr[0]);
            name = arr[1];

            var key = fnid(el) + '/' + name;
            var obj = cache[key];

            if(obj && true !== obj){ //已经好了
                ready(obj, idx);
            }else{
                messageCenter.on(key, function(vo){
                    ready(vo.obj, idx);
                });
            }
        });
    };

    return Util;
}, {
    requires: [
        'dom', 'event'
    ]
});
