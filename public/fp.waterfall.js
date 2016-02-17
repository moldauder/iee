KISSY.add('iee/fp.waterfall', function(S, DOM, Event, Node){

    function Waterfall(config){
        this.config = S.merge({
            diff: 200,
            effect: {
                type: 'fadeIn',
                duration: 0.5,
                easing: 'easeInStrong'
            },
            minColCount: 1
            /**
             * load: function(success, end)
             * container: '#'
             */
        }, config);
    }

    S.augment(Waterfall, S.EventTarget, {
        start: function(){
            var self = this;

            self.container = DOM.get(self.config.container);
            self.data = [];
            self.lazyImgs = [];

            self.checkLazyElements(self.container);

            Event.on(window, 'scroll', function(){
                self.check();
            });

            self.check();
        },

        checkLazyElements: function(root){
            var imgs = [];

            S.each(DOM.query('img', root), function(img){
                if(img.getAttribute('data-lazy')){
                    imgs.push(img);
                }
            });

            this.lazyImgs = this.lazyImgs.concat(imgs);
        },

        loadData: function(){
            var self = this;
            self._loading = true;

            self.config.load(function(items, callback){
                self._loading = false;
                self.addItems(items, callback);
            }, function(){
                self.end();
            });
        },

        end: function(){
            self.isEnd = true;
        },

        addItems: function(items, callback){
            var self = this;
            self.data = self.data.concat(items);

            if(self._adding){
                return;
            }
            self._adding = true;

            var effect = self.config.effect;
            var addr = function(){
                if(0 === self.data.length){
                    self._adding = false;

                    if(S.isFunction(callback)){
                        callback();
                    }

                    return self.check();
                }

                var el = self.data.shift();
                self.checkLazyElements(el);

                var node = Node.one(el);
                node.appendTo(self.container);

                node.css({
                    display: 'none',
                    visibility: ''
                });

                node[effect.type](
                    effect.duration,
                    0,
                    effect.easing
                );

                setTimeout(addr, 50);
            };

            addr();
        },

        check: function(){
            var self = this;
            var scrollDiff = DOM.scrollTop() + DOM.viewportHeight();

            //checkimgs
            self.lazyImgs = S.filter(self.lazyImgs, function(img){
                if(DOM.offset(img).top - 200 <= scrollDiff){
                    var src = img.getAttribute('data-lazy');
                    if(src){
                        img.removeAttribute('data-lazy');
                        img.src = src;
                    }
                    return false;
                }else{
                    return true;
                }
            });

            if(!self.isEnd && !self._loading && !self._adding &&
               DOM.offset(self.container).top + DOM.outerHeight(self.container) - self.config.diff <= scrollDiff){
                  self.loadData();
            }
        }
    });

    return Waterfall;

}, {
    requires: ['dom', 'event', 'node']
});
