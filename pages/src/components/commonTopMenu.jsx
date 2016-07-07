import React from 'react';
import {Menu, Icon} from 'antd';

const SubMenu = Menu.SubMenu;
const MenuItemGroup = Menu.ItemGroup;

export default class CommonTopMenu extends React.Component {

  static propTypes = {
    onClick: React.PropTypes.func
  };

  constructor(...args) {
    super(...args);
  }

  handleClick(e) {
    if (!e.key.startsWith('url-') && this.props.onSelectItem) {
      this.props.onSelectItem(e.key);
    }
  }

  render() {
    return (
	      <Menu onClick={e => this.handleClick(e)} theme="dark" mode="horizontal">
        <Menu.Item key="url-item-all">
          <a href="/item/all" target="_self">好物列表</a>
        </Menu.Item>
        <Menu.Item key="url-item-create">
          <a href="/item/create" target="_self">撰写好物</a>
        </Menu.Item>
        <Menu.Item key="url-information-all">
          <a href="/information/all" target="_self">资讯列表</a>
        </Menu.Item>
        <Menu.Item key="url-information-create">
          <a href="/information/create" target="_self">撰写资讯</a>
        </Menu.Item>
        <Menu.Item key="store"><Icon type="appstore"/>商品管理</Menu.Item>
        <Menu.Item key="url-logout">
          <a href="/information/create" target="_self"><Icon type="logout"/>退出</a>
        </Menu.Item>
      </Menu>
    );
  }
};
