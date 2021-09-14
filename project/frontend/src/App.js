import React, { useEffect } from 'react'
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom'
import * as Panelbear from '@panelbear/panelbear-js'
import Login from './components/Login'
import Home from './components/Home'
import RasterMap from './components/RasterMap'
import RasterMapRedirect from './components/RasterMapRedirect'
import UserView from './components/UserView'
import NewMap from './components/NewMap'
import NotFound from './components/NotFound'
import TOS from './components/TOS'
import PrivacyPolicy from './components/PrivacyPolicy'
import Register from './components/Register'
import VerifyEmail from './components/VerifyEmail'
import PasswordReset from './components/PasswordReset'
import Settings from './components/Settings'
import BrowseMap from './components/BrowseMap'
import PasswordResetConfirmation from './components/PasswordResetConfirmation'
import { GlobalStateProvider} from './utils/useGlobalState'

window.drawmyroute = {};

function App() {
  useEffect(() => {
    Panelbear.load(process.env.REACT_APP_PANELBEAR_ID);
  }, [])

  const onClickHome = (e) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.location.reload();
    } 
  }

  return (
    <GlobalStateProvider>
      <Router basename='/'>
        <div className="jumbotron text-center">
          <Link to='/' onClick={onClickHome} style={{textDecoration: 'none', color:'#f3f'}}><h1 style={{whiteSpace: 'nowrap'}}><img src="/static/logo.svg" alt="logo" height="60px"/> <small>Karttamuovi.com</small></h1>
          <p style={{padding: '0 0 20px 0', margin: '-20px 0 0 -15px'}}>KEEPS YOUR MAPS SAFE...</p></Link>
        </div>
        <Login />
        <Route
          path="/" 
          render={() => {
            Panelbear.trackPageview();
          }}
        />
        <Switch>
            <Route exact path="/" component={Home} />
            <Route exact path="/new" component={NewMap} />
            <Route exact path="/map" component={BrowseMap} />
            <Route exact path="/tos" component={TOS} />
            <Route exact path="/privacy-policy" component={PrivacyPolicy} />
            <Route exact path="/sign-up" component={Register} />
            <Route exact path="/settings" component={Settings} />
            <Route exact path="/password-reset" component={PasswordReset} />
            <Route exact path="/password-reset-confirmation/:key" component={PasswordResetConfirmation} />
            <Route exact path="/verify-email/" component={VerifyEmail} />
            <Route exact path="/verify-email/:key" component={VerifyEmail} />
            <Route exact path="/routes/:uid/" component={RasterMap} />
            <Route exact path="/routes/:uid/player" component={RasterMapRedirect} />
            <Route exact path="/athletes/:username" component={UserView} />
            <Route exact path="/athletes/:username/:date(\d{4}-\d{2}-\d{2})" component={UserView} />
            <Route exact path="*" component={NotFound} />
        </Switch>
        <footer className="container-fluid text-center">
          <span>&copy;2019-{new Date().getFullYear()}&nbsp;Karttamuovi.com - <a href="mailto:info@karttamuovi.com">Contact</a> - <Link to="/privacy-policy">Privacy Policy</Link> - <Link to="/tos">Terms of Service</Link></span>
        </footer>
      </Router>
    </GlobalStateProvider>
  );
}

export default App;
