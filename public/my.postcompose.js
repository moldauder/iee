KISSY.add('iee/my.postcompose', function(S, DOM, Event, IO, Modal, Validation, Category){

    var Biz = {};

    Biz.init = function(){
        this.formEl = DOM.get('#postComposeForm');
        this.checkObj = new Validation(this.formEl);

        Category.init();
        this.imgPreviewer(this.formEl.elements.img);

        if(DOM.get('#wecontent')){
            this.we = new tinymce.Editor('wecontent', {
                menubar: false,
                statusbar: false,
                plugins: 'image textcolor colorpicker link fullscreen',
                toolbar: 'bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | forecolor backcolor | bullist numlist | outdent indent blockquote | undo redo | link unlink | removeformat image | fullscreen'
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
            this.formEl.elements.wecontent.value = this.we.getContent();
            console.log(this.we.getContent())
        }

        self.checkObj.validate(function(isPass){
            if(isPass){
                var progress = new Modal.ProgressBar();
                progress.show();

                IO({
                    url      : '/item/save',
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

            modal.setBody('好物<strong>' + elements.title.value + '</strong>' + (isPublish ? '保存并发布' : '保存草稿') + '成功');

            var btns = [{
                title  : '查看好物列表',
                href   : '/item/all',
                target : '_self'
            },{
                title  : '继续编辑',
                act    : 'my.postcompose/closeFeedback'
            },{
                title  : '撰写新好物',
                href   : '/item/create',
                target : '_self'
            }];

            if(isPublish){
                btns.push({
                    title : '查看好物',
                    href: '/' + ('0' !== data.sid ?  data.sid : data.id)
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

        modal.setBody('<div class="error">' + ((isPublish ? '保存发布好物' : '保存草稿') + '失败') + (data.msg ? ('，<strong>' + data.msg + '</strong>') : '') + '</div>');
        modal.setFooter([{
            title  : '查看好物列表',
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

    //清除掉淘定链接
    //前台链接错误时，通过这个清除掉错误的链接，使商品能正常访问
    Biz.cleartaoke = function(target){
        var formEl = this.formEl;
        IO({
            type: 'post',
            url : '/item/cleartaoke',
            data: {
                id: formEl.elements.id.value
            },
            success: function(data){
                var tipEl = DOM.next(target, 'span.tip');
                if(!tipEl){
                    tipEl = DOM.create('<span class="tip"></span>');
                    DOM.insertAfter(tipEl, target);
                }

                tipEl.innerHTML = data.success ? '清除成功' : '清除失败';
            }
        });
    };

    /**
     * 图片预览
     */
    Biz.imgPreviewer = function(el){
        var rootEl = DOM.create('<div class="sideinfo"><span></span><s class="arrow"></s></div>');
        var previewEl = DOM.get('span', rootEl);

        DOM.parent(el, 'div.form-field').appendChild(rootEl);

        //在值变化时重新载入图片
        var show = function(){
            var now = S.trim(el.value);
            if(now){
                var img = new Image();

                img.onerror = function(){
                    previewEl.innerHTML = '不是有效的图片';
                };

                img.onload = function(){
                    previewEl.innerHTML = '<a target="_blank" href="' + now + '"><img src="' + now + '" width="120" /></a>';
                }

                previewEl.innerHTML = '加载中...';
                rootEl.style.visibility = 'visible';
                img.src = now;
            }else{
                rootEl.style.visibility = 'hidden';
            }
        };

        var timer;
        Event.on(el, 'valuechange', function(){
            timer && timer.cancel();
            timer = S.later(show, 100);
        });

        show();
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
