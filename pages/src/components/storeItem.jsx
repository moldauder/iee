import React from 'react';
import styles from "./storeItem.less";
import {
  Modal,
  Form,
  Upload,
  Icon,
  Button,
  Input,
  Popconfirm,
  message
} from 'antd';
import {NewStoreItemModal} from './index';

export default class StoreItem extends React.Component {
  static propTypes = {
    title: React.PropTypes.string,
    image: React.PropTypes.string,
    onUpdate: React.PropTypes.func,
    onDelete: React.PropTypes.func
  };

  constructor(...props) {
    super(...props);
    this.state = {
      modalVisible: false,
      actionVisible: false,
      display: 'inline-block'
    }
  }

  showEditModal() {
    this.setState({modalVisible: true});
  }

  removeItem() {
    let me = this;
    me.props.onDelete(this.props.id, result => {
        if(!result){
            message.error('删除失败');
        }
    });
  }

  whenMouseEnter() {
    this.setState({
        actionVisible: true,
        modalVisible: false
    });
  }

  whenMouseLeave() {
    this.setState({
        actionVisible: false
    });
  }

  closeModal(){
      this.setState({
          modalVisible: false
      });
  }

  render() {
    return (
      <div style={{
        display: this.state.display
      }} className={styles.StoreItem} onMouseEnter={e => this.whenMouseEnter()} onMouseLeave={e => this.whenMouseLeave()}>
        <img src={this.props.image}/>
        <div className={styles.title}>{this.props.title}</div>

        <div className={styles.action} style={{
          visibility: this.state.actionVisible
            ? 'visible'
            : 'hidden'
        }}>
          <Button size="small" type="primary" onClick={e => this.showEditModal()}>编辑</Button>

          <Popconfirm title="确定要删除这个任务吗？" onConfirm={e => this.removeItem()}>
            <Button size="small">删除</Button>
          </Popconfirm>
        </div>

        <NewStoreItemModal visible={this.state.modalVisible} onCancel={() => this.closeModal()} modalTtile={this.props.title} {...this.props} />
      </div>
    )
  }
};
