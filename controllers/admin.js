/**
 * 后台管理
 */
'use strict';

const Admin = module.exports = {};

Admin.index = function *(){
	yield this.render('admin/index');
};
