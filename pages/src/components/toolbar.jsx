import React from 'react';
import styles from './toolbar.less';

export default class Toolbar extends React.Component{

	render(){
		return (
			<div {...this.props} className={styles.toolbar}>{this.props.children}</div>
		)
	}
};
