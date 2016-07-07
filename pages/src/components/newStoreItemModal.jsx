import React from 'react';
import {Modal, Form, Upload, Icon, Button, Input, message} from 'antd';

const FormItem = Form.Item;
const createForm = Form.create;

class NewStoreItemModal extends React.Component{

	static propTypes = {
		title: React.PropTypes.string,
		href: React.PropTypes.string,
		image: React.PropTypes.string,
		onSave: React.PropTypes.func
	}

	constructor(props){
		super(props);

		let fileList = [];
		let image = props.image;
		if(image){
			fileList.push({
				uid: -1,
				name: this.props.title,
				status: 'done',
				url: image,
				thumb: image
			});
		}

		this.state = {
			modalTtile: this.props.modalTtile,
			id: this.props.id,
			fileList: fileList,
			visible: false
		};
	}

	saveEditResult(){
		let me = this;

		this.props.form.validateFieldsAndScroll((errors, values) => {
			if(errors){
				return;
			}

			let image = '';
			try{
				image = values.image.fileList[0].response[0].url;
			}catch(e){}

			if(!image){
				return message.info('商品图片尚未就绪，请稍后保存');
			}

			let formData= new FormData();
			for(let key in values){
				let value = values[key];

				if(value){
					if('image' === key){
						value = image;
					}

					formData.append(key, value);
				}
			}

			if(values.id){
				me.props.onUpdate(formData, result => {});
			}else{
				me.props.onSave(formData, result => {
					me.props.form.resetFields();
				});
			}
		});
	}

	componentWillReceiveProps(nextProps){
		if(nextProps.visible !== this.state.visible){
			this.setState({
				visible: nextProps.visible
			});
		}
	}

	render(){
		const {getFieldProps} = this.props.form;

		//@TODO 图片上传的失败处理是缺失的
		return (<Modal ref="editStoreItemModal"
			visible={this.state.visible}
			onCancel={e => this.props.onCancel()}
			onOk={e => this.saveEditResult()}
			title={this.state.modalTtile}
			>
			<Form horizontal form={this.props.form}>
				<Input type="hidden" {...getFieldProps('id', {
						initialValue: this.props.id
					})} />
				<Input type="hidden" {...getFieldProps('sid', {
						initialValue: this.props.sid
					})} />

				<FormItem
					label="商品标题"
					labelCol={{ span: 4 }}
					wrapperCol={{ span: 20 }}
					hasFeedback
					>
					<Input {...getFieldProps('title', {
							initialValue: this.props.title,
							rules: [
								{required: true}
							]
						})} />
				</FormItem>

				<FormItem
					label="链接地址"
					labelCol={{ span: 4 }}
					wrapperCol={{ span: 20 }}
					>
					<Input {...getFieldProps('href', {
							initialValue: this.props.href,
							rules: [
								{required: true}
							]
						})}	 />
				</FormItem>

				<FormItem
				  label="商品图片"
				  labelCol={{ span: 4 }}
				  wrapperCol={{ span: 20 }}
				  >
				  <Upload name="image" {...getFieldProps('image', {
						  valuePropName: 'image',
						  initialValue: this.props.image
					  })} accept="image/*" multiple={false} fileList={this.state.fileList} action="/common/upload" listType="picture"><Button type="ghost"><Icon type="upload" /> 点击上传</Button></Upload>
				</FormItem>
			</Form>
		</Modal>);
	}
}

NewStoreItemModal = createForm()(NewStoreItemModal);

export default NewStoreItemModal;
