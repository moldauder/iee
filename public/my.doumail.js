KISSY.add('iee/my.doumail', function(S, DOM, Event, IO){

    var forceStop = false;

    var Doumail = {
        init: function(){
        },
        start: function(trigger){
            var isHalt = trigger.innerHTML.indexOf('停止') > -1;

            if(isHalt){
                forceStop = true;
                trigger.innerHTML = '开启豆邮溅射';
                return;
            }

            trigger.innerHTML = '停止豆邮溅射';
            send();
        }
    };

    var doubanData = {};

    /**
     * 设定output的内容
     */
    function setOutputContent(html){
        var ouput = DOM.get('#output');
        Event.remove(DOM.get('input', output), 'keyup');

        output.innerHTML = html;
        var inputEl = DOM.get('input', output);
        if(inputEl){
            inputEl.focus();
            Event.on(inputEl, 'keyup', function(ev){
                if(13 === ev.keyCode){
                    send();
                }
            });
        }
    };

    /**
     * 豆邮发送
     */
    function send(){
        if(forceStop){ return; }

        var sendbtn = DOM.get('#sendbtn');
        var inputEl = DOM.get('input', '#output');
        if(inputEl){
            var captcha_string = S.trim(DOM.val(inputEl));
            if(!captcha_string){
                setOutputContent('说好的暗号呢？再来：<img src="' + doubanData.captcha_url + '" /> 输入暗号：<input type="text" class="text" />');
                return;
            }

            doubanData.captcha_string = captcha_string;
        }

        IO({
            type: 'post',
            url: '/wii/doumail',
            data: doubanData,
            success: function(data){
                doubanData = {};

                if(data.stop){
                    setOutputContent(data.msg || '发不动了，上天有好生之德，先歇一歇....');
                    DOM.remove(sendbtn);
                    return;
                }

                if(data.captcha_token){
                    doubanData  = data;
                    setOutputContent('这是暗号：<img src="' + data.captcha_url + '" /> 请输入此暗号后点击继续：<input type="text" class="text" />');
                    sendbtn.innerHTML = '继续吧，骚年';
                    return;
                }

                setOutputContent('成功溅射 ' + data.user_name + '，准备下一个');
                sendbtn.innerHTML = '停止豆邮溅射';

                setTimeout(function(){
                    send();
                }, 6000);
            }
        });
    }

    return Doumail;

}, {
    requires: [
        'dom', 'event', 'ajax'
    ]
});
