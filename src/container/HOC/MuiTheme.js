import React from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: '#1976d2',
    primary2Color: '#63a4ff',
    primary3Color: '#004ba0',
    accent1Color: '#dd2c00',
    accent2Color: '#ff6434',
    accent3Color: '#a30000',
  },
});

export default function muiThemeWrapper(WrappedComponent) {
  return class Theme extends React.Component {
    render() {
      return (
        <MuiThemeProvider muiTheme={muiTheme}>
          <WrappedComponent {...this.props}/>
        </MuiThemeProvider>
      )
    }
  }
}
