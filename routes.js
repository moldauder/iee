'use strict';

const router = require('koa-router')();
const body = require('koa-body');

const shouldLogin = function (next, isAjax){
	return function* (){
		if(!this.session.user){
			console.log(this.session);
			if(isAjax){
				this.body = {
					success: false,
					status: 403
				};
			}else{
				this.redirect('/login/index?redirect=' + encodeURIComponent(this.request.href));
			}
		}else{
			yield next;
		}
	};
};
const shouldFetchLogin = function(next){
	return shouldLogin(next, true);
}

const Login = require('./controllers/login');
router.get('/login/index', Login.index);
router.post('/login/index', body({
	multipart: true
}), Login.index);

const Store = require('./controllers/store');
router.get('/store', Store.index);
router.get('/api/stores', shouldFetchLogin(Store.all));
router.get('/api/store/:id', shouldFetchLogin(Store.item));
router.get('/api/store/:id/delete', shouldFetchLogin(Store.delete));
router.post('/api/store', body({
	multipart: true
}), shouldFetchLogin(Store.save));

const Admin = require('./controllers/admin');
router.get('/admin/index', shouldLogin(Admin.index));

const Common = require('./controllers/common');
router.post('/common/upload', body({
	multipart: true
}), shouldFetchLogin(Common.upload));

module.exports = router;
