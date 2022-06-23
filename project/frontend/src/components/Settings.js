import React from "react";
import PasswordChange from "./PasswordChange";
import UserSettings from "./UserSettings";
import EmailsList from "./EmailsList";
import UserDeletion from "./UserDeletion";
import useGlobalState from "../utils/useGlobalState";
import { Helmet } from "react-helmet";

const Settings = ({ history }) => {
  const globalState = useGlobalState();
  const { username } = globalState.user;

  React.useEffect(() => {
    if (!username) {
      history.push("/");
    }
  }, [username, history]);

  return (
    <div className="container main-container">
      <Helmet>
        <title>User Settings | Mapdump.com</title>
      </Helmet>
      <h1>
        <i className="fas fa-user-cog"></i> Settings
      </h1>
      <hr />
      <UserSettings />
      <hr />
      <PasswordChange />
      <hr />
      <EmailsList />
      <hr />
      <UserDeletion />
    </div>
  );
};

export default Settings;
