import React from 'react';
import {Button,Pagination} from 'antd';
import {StoreItem,Header,Toolbar,NewStoreItemModal} from '../components/index';
import styles from './store.less';

export default class Store extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			pageIndex: 1,
			pageSize: 0,
			total: 0,
			modalVisible: false,
			itemList: []
		};
    }

	componentDidMount() {
		this.loadItems(1);
	}

	//加载数据
	loadItems(pageIndex){
		let me = this;

		fetch('/api/stores?pageIndex=' + pageIndex, {
			credentials: 'include'
		})
		.then(response => response.json())
		.then(data => {
			me.setState({
				itemList: data.itemList,
				pageIndex: data.pageIndex,
				total: data.total,
				pageSize: data.pageSize
			});
		})
		.catch(function(error) {
			console.log('Request failed', error);
		});
	}

	showAddStoreItem() {
		this.setState({
			modalVisible: true
		});
	}

	//新建StoreItem
	saveStoreItem(formData, callback) {
		let me = this;

		fetch('/api/store', {
		  method: 'post',
		  body: formData,
		  credentials: 'include'
		})
		.then(response => response.json())
		.then(res => {
			if(res.success){
				me.setState({
					itemList: [res.data].concat(me.state.itemList)
				});

				callback(true);
			}
		});
	}

	//更新StoreItem
	updateStoreItem(formData, callback){
		let me = this;

		fetch('/api/store', {
		  method: 'post',
		  body: formData,
		  credentials: 'include'
		})
		.then(response => response.json())
		.then(res => {
			let originId = res.originId; //更新之后，ID会改变
			let list = [];

			me.state.itemList.forEach(vo => {
				if(vo.id == originId){
					Object.assign(vo, res.data);
				}

				list.push(vo);
			});

			me.setState({
				itemList: list
			});

		  	callback(true);
		});
	}

	//删除StoreItem
	deleteStoreItem(storeId, callback){
		let me = this;

		fetch('/api/store/' + storeId + '/delete', {
			credentials: 'include'
		})
		.then(response => response.json())
		.then(data => {
	      if (data.success) {
			  let list = [];
			  me.state.itemList.forEach(vo => {
				  if(vo.id !== storeId){
					  list.push(vo);
				  }
			  });
			  me.setState({
				  itemList: list
			  });
	      }
		  callback(data.success);
	    });
	}

	pageChange(page){
		this.loadItems(page);
	}

	cancelModal(){
		this.setState({
			modalVisible: false
		});
	}

	render() {
		let items = [];

		(this.state.itemList || []).forEach(vo => {
			try{
				let content = JSON.parse(vo.content);
				items.push((<StoreItem
					id={vo.id} href={content.href} image={content.image} key={vo.id} title={vo.title}
					onUpdate={(formData, callback)=> this.updateStoreItem(formData, callback)}
					onDelete={(storeId, callback) => this.deleteStoreItem(storeId, callback)}
					></StoreItem>));
			}catch(e){

			}
		});

		return (
			<div>
				<Header title="商品管理"/>

				<Toolbar>
					<Button type="primary" icon="plus-circle-o" onClick={e => this.showAddStoreItem()}>新增商品</Button>
				</Toolbar>

				<div className={styles.StoreList}>
					{items}
				</div>


				<Pagination
					current={this.state.pageIndex}
					total={this.state.total}
					pageSize={this.state.pageSize}
					onChange={page=>this.pageChange(page)}
					/>

				<NewStoreItemModal visible={this.state.modalVisible} modalTtile="新增商品"
					onSave={(formData, callback) => this.saveStoreItem(formData, callback)}
					onCancel={() => this.cancelModal()}
					/>
			</div>
		)
	}
}
