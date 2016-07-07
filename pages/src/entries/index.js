import React from 'react';
import ReactDOM from 'react-dom';
import {Row, Col} from 'antd';

import styles from './index.less';
import CommonTopMenu from '../components/commonTopMenu'
import PageStore from '../pages/store'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pageContent: (<PageStore/>)
    };
  }

  onSelectItem(e) {

  }

  render() {
    return (
      <div className="pageWrap">
        <CommonTopMenu onSelectItem={this.onSelectItem}/>
        <div className={styles.pageContent}>{this.state.pageContent}</div>
		<p style={{color:'#ccc',textAlign:'center'}}>- 拥有生活的灵感 -</p>
      </div>
    );
  }
}

ReactDOM.render(<App/>, document.getElementById('root'));
