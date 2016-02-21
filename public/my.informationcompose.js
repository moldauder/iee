KISSY.add('iee/my.informationcompose', function(S, DOM, Event, IO, Modal, Validation, Category){

    var Biz = {};

    Biz.init = function(){
        this.formEl = DOM.get('#informationComposeForm');
        this.checkObj = new Validation(this.formEl);

        Category.init();

        if(DOM.get('#informationContent')){
            this.we = new tinymce.Editor('informationContent', {
                menubar: false,
                statusbar: false,
                plugins: 'image textcolor colorpicker',
                toolbar: 'bold, italic, underline, strikethrough, alignleft, aligncenter, alignright, alignjustify, forecolor, backcolor, bullist, numlist, outdent, indent, blockquote, undo, redo, removeformat, image'
            }, tinymce.EditorManager);

            this.we.render();
        }
    };

    Biz.publish = function(){
        this.submit('publish');
    };

    Biz.save = function(){
        this.submit('draft');
    };

    Biz.submit = function(type){
        var self = this;

        this.formEl.elements.operate.value = type;

        if(this.we){
            this.formEl.elements.content.value = this.we.getContent();
        }

        self.checkObj.validate(function(isPass){
            if(isPass){
                var progress = new Modal.ProgressBar();
                progress.show();

                IO({
                    url      : '/information/save',
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
    };

    Biz.submitSuccess = function(data){
        var modal = this.getFeedbackModal();
        var elements = this.formEl.elements;
        var isPublish = 'publish' === elements.operate.value;

        if(data.success){
            elements.id.value = data.id;

            modal.setBody('资讯<strong>' + elements.title.value + '</strong>' + (isPublish ? '保存并发布' : '保存草稿') + '成功');

            var btns = [{
                title  : '查看资讯列表',
                href   : '/information/all',
                target : '_self'
            },{
                title  : '继续编辑',
                act    : 'my.informationcompose/closeFeedback'
            },{
                title  : '撰写新资讯',
                href   : '/information/create',
                target : '_self'
            }];

            if(isPublish){
                btns.push({
                    title : '查看资讯',
                    href: '/i' + ('0' !== data.sid ?  data.sid : data.id)
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

        modal.setBody('<div class="error">' + ((isPublish ? '保存发布资讯' : '保存草稿') + '失败') + (data.msg ? ('，<strong>' + data.msg + '</strong>') : '') + '</div>');
        modal.setFooter([{
            title  : '查看资讯列表',
            href   : '/information/all',
            target : '_self'
        },{
            title   : '返回编辑',
            act     : 'my.informationcompose/closeFeedback',
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
        'iee/util.validation',
        'iee/my.category'
    ]
});
