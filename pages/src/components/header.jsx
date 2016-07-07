import React from 'react';
import styles from './header.less';

export default class Header extends React.Component{
	static propTypes = {
		title: React.PropTypes.string
	}

	render(){
		return (
			<div className={styles.header}>{this.props.title}</div>
		)
	}
};
