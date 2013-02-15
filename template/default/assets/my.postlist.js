KISSY.add('iee/my.postlist', function(S, DOM, Event, IO, Anim){

    var Biz = {};

    var queryParams = {};

    S.mix(Biz, App.Base);

    //改变首页展现、锁定、置顶等状态
    Biz.status = function(target, callback){
        if(DOM.hasClass(target, 'async')){
            return;
        }

        DOM.addClass(target, 'async');
        IO.get(DOM.attr(target, 'data-url') + '/' + (DOM.hasClass(target, 'on') ? 'n' : 'y'), function(data){
            DOM.removeClass(target, 'async');

            if(data.success){
                DOM.toggleClass(target, 'on');
                DOM.toggleClass(target, 'off');
            }else{
                self.showFeedbackMsg(data.msg);
            }

            if(S.isFunction(callback)){
                callback(data);
            }
        }, 'json');
    };

    Biz.lock = function(target){
        var self = this;
        self.status(target, function(data){
            if(!App.getConfig('isSuper') && data.success){
                DOM.toggleClass(self.getItemEl(target), 'post-locked');
            }
        });
    };

    Biz.trash = function(target){
        var self = this;
        IO.get(DOM.attr(target, 'data-url'), function(data){
            if(data.success){
                if('all' === queryvars.range){
                    DOM.addClass(self.getItemEl(target), 'post-trash');
                }else{
                    self.removeItemEl(target);
                }
            }else{
                self.showFeedbackMsg(data.msg);
            }
        }, 'json');
    };

    Biz.untrash = function(target){
        var self = this;
        IO.get(DOM.attr(target, 'data-url'), function(data){
            if(data.success){
                DOM.removeClass(self.getItemEl(target), 'post-trash');
            }else{
                self.showFeedbackMsg(data.msg);
            }
        }, 'json');
    };

    Biz.remove = function(target){
        var self = this;
        IO.get(DOM.attr(target, 'data-url'), function(data){
            if(data.success){
                self.removeItemEl(target);
            }else{
                self.showFeedbackMsg(data.msg);
            }
        }, 'json');
    };

    return Biz;

}, {
    requires: [
        'dom', 'event', 'ajax', 'anim'
    ]
});
