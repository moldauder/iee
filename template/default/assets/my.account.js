KISSY.add('iee/my.account', function(S, DOM, Event, IO, Validation){

    var Biz = {};

    S.mix(Biz, App.Base);

    Biz.initialize = function(){
        this.formEl = DOM.get('#accountForm');
        this.checkObj = new Validation(this.formEl);
    };

    //保存账户信息
    Biz.save = function(el){
        var self = this;

        if(self.isSubmiting){
            return;
        }
        self.isSubmiting = true;

        self.checkObj.validate(function(isPass){
            IO({
                url      : '/account/save',
                type     : 'post',
                form     : self.formEl,
                dataType : 'json',
                success  : function(data){
                    if(data.success){
                        self.showFeedbackMsg('帐号信息保存成功');
                        self.formEl.reset();
                    }else{
                        self.showFeedbackMsg(data.msg);
                    }
                    self.isSubmiting = false;
                }
            });
        });
    };

    return Biz;

}, {
    requires: [
        'dom', 'event', 'ajax',
        'iee/util.validation'
    ]
});
