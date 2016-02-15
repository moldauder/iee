KISSY.add('iee/fp.album', function(S, DOM, Event, Anim, Base, Modal){

    var Album = {};

    S.mix(Album, S.EventTarget);

    Album.getModal = function(){
        var self = this;

        if(!self.modal){
            var modal = new Modal({
                cls: 'modal-album',
                effect: 'fade'
            });

            modal.on('hide', function(){
                if(self.player){
                    self.player.destroy();
                    self.player = null;
                }
            });

            Event.on(modal.footerEl, 'click', function(ev){
                var target = ev.target;
                if(DOM.hasClass(target, 'prev')){
                    self.prev();
                }else if(DOM.hasClass(target, 'next')){
                    self.next();
                }else if(DOM.hasClass(target, 'close')){
                    self.hide();
                }
            });

            self.modal = modal;
        }
        return self.modal;
    };

    Album.show = function(data, config){
        var self = this;
        var html = '';

        S.each(data, function(vo){
            var href = vo.buylink || vo.outer_url;
            href = href ? (' href="' + href + '" ') : '';
            html += '<div class="album-item stdpost"><div class="core">' +
                        '<div class="photo"><a ' + href + '><img src="' + vo.img + '"/></a></div>' +
                        '<div class="detail">' +
                            '<h2 class="title">' + vo.title + '</h2>' +
                            '<div class="content">' + vo.fullcontent + '</div>' +
                            '<div class="action">' + (href ? ('<a class="go-view" ' + href + '>点此拥有</a>') : '') + '<ins class="post-share"></ins></div>' +
                        '</div>' +
                    '</div></div>';
        });

        var modal = self.getModal();
        modal.setBody('<div id="albumCarousel" class="album-carousel"><div class="ks-switchable-content">' + html + '</div></div>');
        modal.setFooter('<a class="close"></a><div id="albumTrigger" class="carousel-trigger"><a class="prev"></a><a class="next"></a></div>');

        config = config || {};

        //初始化播放器
        S.use('switchable', function(S, Switchable){
            var player = new Switchable.Carousel(DOM.get('#albumCarousel'), {
                effect: 'scrollx',
                easing: 'easeOutStrong',
                switchTo: config.switchTo || 0
            });
            DOM.html(DOM.query('li', '#albumCarousel .ks-switchable-nav'), '&bull;');   //修正triger内容

            modal.show();

            self.player = player;
            self.fire('show');
        });
    };

    Album.prev = function(){
        if(this.player){
            this.player.prev();
        }
    };

    Album.next = function(){
        if(this.player){
            this.player.next();
        }
    };

    Album.hide = function(){
        this.getModal().hide();
        this.fire('hide');
    };

    return Album;

}, {
    requires: [
        'dom', 'event', 'anim',
        'iee/fp.base',
        'iee/util.modal'
    ]
});
