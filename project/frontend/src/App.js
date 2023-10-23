import React from "react";
import { BrowserRouter as Router, Route, Switch, Link } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import RasterMap from "./components/RasterMap";
import RasterMapRedirect from "./components/RasterMapRedirect";
import LoginPage from "./components/LoginPage";
import LoginAsPage from "./components/LoginAsPage";
import UserView from "./components/UserView";
import NewMap from "./components/NewMap";
import NotFound from "./components/NotFound";
import TOS from "./components/TOS";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Register from "./components/Register";
import VerifyEmail from "./components/VerifyEmail";
import PasswordReset from "./components/PasswordReset";
import Settings from "./components/Settings";
import BrowseMap from "./components/BrowseMap";
import RoutesForTag from "./components/RoutesForTag";
import PasswordResetConfirmation from "./components/PasswordResetConfirmation";
import UserDeletionConfirmation from "./components/UserDeletionConfirmation";
import { GlobalStateProvider } from "./utils/useGlobalState";

window.drawmyroute = {};

function App() {
  const onClickHome = (e) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      window.location.reload();
    }
  };

  return (
    <GlobalStateProvider>
      <Router basename="/">
        <div className="jumbotron text-center">
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#33333366",
              position: "absolute",
              top: "0",
              left: "0",
              zIndex: -1,
            }}
          ></div>
          <Link
            to="/"
            onClick={onClickHome}
            style={{
              textDecoration: "none",
              color: "#f3f",
              textShadow:
                "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff",
            }}
          >
            <h1 style={{ whiteSpace: "nowrap" }}>
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "#f4f4f4",
                  width: "60px",
                  borderRadius: "50%",
                }}
              >
                <img
                  src="/static/logo.svg?v=20231023"
                  alt="logo"
                  height="60px"
                  style={{ padding: "5px" }}
                />
              </span>{" "}
              <small>Mapdump.com</small>
            </h1>
            <p style={{ padding: "0 0 30px 0", margin: "-10px 0 0 0" }}>
              WHERE YOUR MAPS END THEIR LIFE...
            </p>
          </Link>
        </div>
        <Login />
        <Route path="/" />
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/routes/tag/:tag" component={RoutesForTag} />
          <Route exact path="/new" component={NewMap} />
          <Route exact path="/map" component={BrowseMap} />
          <Route exact path="/tos" component={TOS} />
          <Route exact path="/privacy-policy" component={PrivacyPolicy} />
          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/login-as" component={LoginAsPage} />
          <Route exact path="/sign-up" component={Register} />
          <Route exact path="/settings" component={Settings} />
          <Route exact path="/password-reset" component={PasswordReset} />
          <Route
            exact
            path="/password-reset-confirmation/:key"
            component={PasswordResetConfirmation}
          />
          <Route
            exact
            path="/account-deletion-confirmation/:key"
            component={UserDeletionConfirmation}
          />
          <Route exact path="/verify-email/" component={VerifyEmail} />
          <Route exact path="/verify-email/:key" component={VerifyEmail} />
          <Route exact path="/routes/:uid/" component={RasterMap} />
          <Route
            exact
            path="/routes/:uid/player"
            component={RasterMapRedirect}
          />
          <Route exact path="/athletes/:username" component={UserView} />
          <Route
            exact
            path="/athletes/:username/:date(\d{4}-\d{2}-\d{2})"
            component={UserView}
          />
          <Route
            exact
            path="/athletes/:username/:year(\d{4})"
            component={UserView}
          />
          <Route exact path="*" component={NotFound} />
        </Switch>
        <footer className="container-fluid text-center">
          <span>
            &copy;2019-{new Date().getFullYear()}&nbsp;Mapdump.com -{" "}
            <a href="mailto:info@mapdump.com">Contact</a> -{" "}
            <Link to="/privacy-policy">Privacy Policy</Link> -{" "}
            <Link to="/tos">Terms of Service</Link>
          </span>
          <br />
          <img
            alt="Compatible with strava"
            width="200px"
            src="/static/compatibleWithStrava.png"
          ></img>
        </footer>
      </Router>
    </GlobalStateProvider>
  );
}

export default App;
