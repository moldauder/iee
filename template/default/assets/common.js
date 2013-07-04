/**
 * 前台通用模块
 * 针对用户所访问的页面
 */
KISSY.add('iee/common', function(DOM, Event, Popup){

    var Common = {};

    S.mix(Common, {
        /**
         * 弹出登录浮层
         */
        login: function(){
            if(!this.loginPopup){
                this.loginPopup = new Popup({
                    cls: 'login-popup'
                });
            }

            this.loginPopup.open('/minilogin');
        }
    });

    return Common;

}, {
    requires: [
        'dom', 'event',
        'iee/util/popup'
    ]
});
