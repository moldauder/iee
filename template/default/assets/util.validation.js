/**
 * 表单验证
 */
KISSY.add('iee/util.validation', function(S, DOM, Event, JSON){

    function Validation(el, config){
        this.el = DOM.get(el);

        this.config = S.merge({
            when: 'blur keyup'  //验证的时机
        }, config);

        this.init();
    }

    S.augment(Validation, S.EventTarget, {
        init: function(){
            var self = this;

            S.each(self.el.elements, function(element){
                /**
                 * 验证规则
                 * data-validate='["require","必须填写"]'
                 * data-validate='[["require","必须填写"], ["between",10,20,"长度介于"]]'
                 */
                var validate = DOM.attr(element, 'data-validate');
                if(!validate){
                    return;
                }

                try{
                    var rule = JSON.parse(validate);
                    if(S.isArray(rule)){
                        //确保是一个二维数组
                        rule = S.isArray(rule[0]) ? rule : [rule];
                    }

                    DOM.data(element, 'rule', rule);

                    Event.on(element, self.config.when, function(){
                        self.doCheck(element);
                    });
                }catch(e){}
            });
        },
        /**
         * 验证整个表单是否有效
         */
        validate: function(then){
            var self = this;
            var ticket = self.el.elements.length;
            var isOk = true;

            then = S.isFunction(then) ? then : function(){};

            S.each(self.el.elements, function(element){
                self.doCheck(element, function(isPass){
                    if(!isPass){
                        isOk = false;
                    }

                    ticket--;
                    if(0 === ticket){
                        then(isOk);
                    }
                });
            });
        },
        /**
         * 验证一项
         */
        doCheck: function(element, then){
            var self = this;
            then = S.isFunction(then) ? then : function(){};

            self.clearErr(element);

            var rule = DOM.data(element, 'rule');
            if(!rule){
                return then(true);
            }

            var ticket = rule.length;
            var isOk = true;

            S.each(rule, function(config){
                Validation.Rule.check(element, function(ret){
                    ticket--;

                    if(true !== ret){
                        self.addErr(element, ret);
                        isOk = false;
                    }

                    if(0 === ticket){
                        then(isOk);
                    }
                }, config);
            });
        },
        addErr: function(element, msg, type){
            var msgEl = DOM.create('<div></div>');
            msgEl.innerHTML = '<p>' + msg + '</p>';
            msgEl.className = 'field-formtip ' + (type || 'err');

            DOM.parent(element, 'div.field-bd').appendChild(msgEl);
        },
        clearErr: function(element){
            DOM.remove(DOM.query('div.field-formtip', DOM.parent(element, 'div.field-bd')));
        }
    });

    Validation.Rule = {
        /**
         * ruleName 验证规则名
         * checker 验证函数，接受参数：value, then, validate[0], validate[1]....
         *
         * then函数参数: string，则表示校验失败，并且作为提示信息
         */
        add: function(ruleName, checker){
            var rules = this.rules || {};
            rules[ruleName] = checker;
            this.rules = rules;
        },
        /**
         * 通过apply发起调用，this指向要验证的元素
         */
        check: function(element, then, config){
            var ruleName = config[0];
            var rules = this.rules;
            if(ruleName in rules){
                rules[ruleName].apply({}, [S.trim(DOM.val(element)), then].concat(config.slice(1)));
            }
        }
    };

    //必须填写
    Validation.Rule.add('require', function(value, then, msg){
        value ? then(true) : then(msg || '此项必须填写');
    });

    //两个字段值一致校验
    //selector==id选择符
    Validation.Rule.add('equal', function(value, then, selector, msg){
        return value === S.trim(DOM.val('#' + selector)) ? then(true) : then(msg || '两次输入的值不一致');
    });

    return Validation;

}, {
    requires: [
        'dom', 'event', 'json'
    ]
});
