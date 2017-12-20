import React from 'react';
import AppBar from 'material-ui/AppBar';
import muiTheme from './HOC/MuiTheme';
import Facebook from './Facebook/Facebook';

class Home extends React.Component {
  render() {
    return (
      <div>
        <AppBar title="Post Whisperer" />
        <Facebook />
      </div>
    )
  }
}

export default muiTheme(Home);
