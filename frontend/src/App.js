import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import Login from './components/Login'
import Home from './components/Home'
import RasterMap from './components/RasterMap'
import UserView from './components/UserView'
import NewMap from './components/NewMap'
import Register from './components/Register'
import VerifyEmail from './components/VerifyEmail'
import PasswordReset from './components/PasswordReset'
import Settings from './components/Settings'
import PasswordResetConfirmation from './components/PasswordResetConfirmation'
import { GlobalStateProvider} from './utils/useGlobalState'

window.drawmyroute = {};

function App() {
  return (
  <GlobalStateProvider>
    <Router basename='/'>
      <Login />
      <div>
          <Route exact path="/" component={Home} />
          <Route exact path="/new" component={NewMap} />
          <Route exact path="/sign-up" component={Register} />
          <Route exact path="/settings" component={Settings} />
          <Route exact path="/password-reset" component={PasswordReset} />
          <Route exact path="/password-reset-confirmation/:key" component={PasswordResetConfirmation} />
          <Route path="/verify-email/:key" component={VerifyEmail} />
          <Route path="/routes/:uid" component={RasterMap} />
          <Route path="/athletes/:username" component={UserView} />
      </div>
    </Router>
  </GlobalStateProvider>
  );
}

export default App;
