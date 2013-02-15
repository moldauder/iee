KISSY.add('iee/my.postcompose', function(S, DOM, Event, IO, Modal, Validation){

    var Biz = {};

    Biz.init = function(){
        this.formEl = DOM.get('#postComposeForm');
        this.checkObj = new Validation(this.formEl);
    };

    Biz.publish = function(){
        this.submit('publish');
    };

    Biz.save = function(){
        this.submit('draft');
    };

    Biz.submit = function(type){
        var self = this;

        if(self.isSubmiting){
            return;
        }
        self.isSubmiting = true;

        this.formEl.elements.operate.value = type;

        self.checkObj.validate(function(isPass){
            if(isPass){
                IO({
                    url      : '/item/save',
                    type     : 'post',
                    form     : self.formEl,
                    dataType : 'json',
                    success  : function(data){
                        self.submitSuccess(data);
                    },
                    error    : function(){
                        self.submitError();
                    }
                });
            }
            self.isSubmiting = false;
        });
    };

    Biz.submitSuccess = function(data){
        var modal = this.getFeedbackModal();
        var elements = this.formEl.elements;
        var isPublish = 'publish' === elements.operate.value;

        elements.id.value = data.id;

        if(data.success){
            modal.setBody('文章<strong>' + elements.title.value + '</strong>' + (isPublish ? '保存并发布' : '保存草稿') + '成功');

            var btns = [{
                title  : '查看文章列表',
                href   : '/item/all',
                target : '_self'
            },{
                title  : '继续编辑',
                act    : 'my.postcompose/closeFeedback'
            },{
                title  : '撰写新文章',
                href   : '/item/create',
                target : '_self'
            }];

            if(isPublish){
                btns.push({
                    title : '查看文章',
                    href: '/' + data.id
                });
            }

            modal.setFooter(btns);
            modal.show();
        }else{
            this.submitError(data);
        }
    };

    Biz.submitError = function(data){
        var modal = this.getFeedbackModal();
        var isPublish = 'publish' === this.formEl.elements.operate.value;
        data = data || {};

        modal.setBody('<div class="error">' + ((isPublish ? '保存发布文章' : '保存草稿') + '失败') + (data.msg ? ('，<strong>' + data.msg + '</strong>') : '') + '</div>');
        modal.setFooter([{
            title  : '查看文章列表',
            href   : '/item/all',
            target : '_self'
        },{
            title   : '返回编辑',
            act     : 'my.postcompose/closeFeedback',
            primary : true
        }]);
        modal.show();
    };

    //获取保存/发布结果反馈提示框
    Biz.getFeedbackModal = function(){
        if(!this.feedbackModal){
            this.feedbackModal = new Modal({
                title: '撰写新文章',
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