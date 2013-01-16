KISSY.add('iee/myaccount', function(S, DOM, Event, IO, Modal){

    var Module = {};

    Module.init = function(then){
        var self = this;

        if(self.isLoading){ return; }
        self.isLoading = true;

        App.Loading.show('正在加载');

        IO.get('/my/tmpl?name=myaccount', function(html){
            App.Panel.add('myaccount', html);
            App.Loading.hide();

            var root = DOM.get('#myaccount');
            self.eles = {
                root: root,
                form: DOM.get('form', root)
            };

            self.init = function(then){
                App.Panel.switch('myaccount');
                S.isFunction(then) && then();
            };

            self.init(then);
        });
    };

    /*
     * 更新用户信息
     */
    Module.update = function(el){
        var formEl = this.eles.form;
        var eles = formEl.elements;

        //表单验证
    };

    return Module;

}, {
    requires: [
        'dom', 'event', 'ajax', 'iee/modal'
    ]
});
