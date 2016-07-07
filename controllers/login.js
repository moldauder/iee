/**
 * 用户登录
 */
'use strict';

const User = require('../models/user');
const Lib = require('../lib/lib');
const Login = module.exports = {};

Login.index = function* (){
    let redirect = this.request.query.redirect;
    let data = function(append){
        return Object.assign({
            redirect: redirect
        }, append || {});
    };

    if(this.request.method === 'GET'){
        return yield this.render('login/login', data());
    }

    //登录校验
    const userName = this.request.body.userName;
    const pwd = this.request.body.pwd;

    if(!userName || !pwd){
        return yield this.render('login/login', data({
            msg: '用户名或密码不能为空'
        }));
    }

    const userData = yield User.getUserByName(userName);
    if(!userData || userData.pwd !== Lib.encryptPwd(pwd)){
        return yield this.render('login/login', data({
            msg: '用户名或密码错误'
        }));
    }

    this.session.user = userData;

    if(redirect){
        //@TODO redirect是否是有效域名的判断
        this.redirect(redirect);
    }else{
        this.redirect('/my/index');
    }
};
