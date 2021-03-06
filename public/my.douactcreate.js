KISSY.add('iee/my.douactcreate', function(S, DOM, Event, IO, Modal, Validation){

    var Biz = {};

    Biz.init = function(){
        this.formEl = DOM.get('#doumailActForm');
        this.checkObj = new Validation(this.formEl);

        this.initEvents();
    };

    Biz.initEvents = function(type){
        var self = this;

        Event.on(self.formEl, 'submit', function(ev){
            ev.halt();

            var progress = new Modal.ProgressBar();
            progress.show();

            self.checkObj.validate(function(isPass){
                if(isPass){
                    IO({
                        url      : self.formEl.action,
                        type     : 'post',
                        form     : self.formEl,
                        dataType : 'json',
                        success  : function(data){
                            self.submitSuccess(data);
                            progress.hide();
                        },
                        error    : function(){
                            self.submitError();
                            progress.hide();
                        }
                    });
                }
            });
        });
    };

    Biz.submitSuccess = function(data){
        var modal = this.getFeedbackModal();
        var elements = this.formEl.elements;

        elements.id.value = data.id;

        if(data.success){
            modal.setBody('豆邮活动<strong>' + elements.title.value + '</strong>保存成功');

            var btns = [{
                title  : '回到豆邮页',
                href   : '/doumail/all',
                target : '_self'
            }];

            modal.setFooter(btns);
            modal.show();
        }else{
            this.submitError(data);
        }
    };

    Biz.submitError = function(data){
        var modal = this.getFeedbackModal();
        data = data || {};

        modal.setBody('<div class="error">豆邮活动保存失败' + (data.msg ? ('，<strong>' + data.msg + '</strong>') : '') + '</div>');
        modal.setFooter([{
            title  : '回到豆邮页',
            href   : '/doumail/all',
            target : '_self'
        },{
            title   : '返回编辑',
            act     : 'my.douactcreate/closeFeedback',
            primary : true
        }]);
        modal.show();
    };

    //获取保存/发布结果反馈提示框
    Biz.getFeedbackModal = function(){
        if(!this.feedbackModal){
            this.feedbackModal = new Modal({
                title: DOM.text('#content h2'),
                cls: 'postcompose-modal'
            });
        }
        return this.feedbackModal;
    };

    Biz.closeFeedback = function(){
        var modal = this.feedbackModal;
        if(modal){
            modal.hide();
        }
    };

    return Biz;
}, {
    requires: [
        'dom', 'event', 'ajax',
        'iee/util.modal',
        'iee/util.validation'
    ]
});
