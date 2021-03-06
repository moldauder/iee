KISSY.add('iee/my.submit', function(S, DOM, Event, IO){

    var Biz = {};

    S.mix(Biz, App.Base);

    //将状态设置为已通过
    Biz.pass = function(target){
        var self = this;

        IO.get(DOM.attr(target, 'href'), function(data){
            if(data.success){
                if('s' === queryvars.status){   //待通过，则删除
                    DOM.remove(self.getItemEl(target));
                }else{
                    var html = '';
                    html += '<span class="label info" title="处理人：' + data.agencyNick + '">已通过</span>';

                    if(data.postid){
                        html += '<a href="/item/' + data.postid + '" target="_blank">关联文章</a>';
                    }else{
                        html += '<a href="/item/create/?submit=' + data.id + '">发表文章</a>';
                    }

                    DOM.html(DOM.parent(target, 'div.item-action'), html);
                }
            }else{
                self.showFeedbackMsg(data.msg);
            }
        }, 'json');
    };

    //删除
    Biz.remove = function(target){
        var self = this;

        IO.get(DOM.attr(target, 'href'), function(data){
            if(data.success){
                DOM.remove(self.getItemEl(target));
            }else{
                self.showFeedbackMsg(data.msg);
            }
        }, 'json');
    };

    return Biz;

}, {
    requires: [
        'dom', 'event', 'ajax'
    ]
});
