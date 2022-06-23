import React from "react";
import PasswordChange from "./PasswordChange";
import UserSettings from "./UserSettings";
import Avatar from "./Avatar";
import EmailsList from "./EmailsList";
import UserDeletion from "./UserDeletion";
import useGlobalState from "../utils/useGlobalState";
import { Helmet } from "react-helmet";
import DownloadOwnDataBtn from "./DownloadOwnDataBtn";

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
      <Avatar />
      <hr />
      <UserSettings />
      <hr />
      <PasswordChange />
      <hr />
      <EmailsList />
      <hr />
      <DownloadOwnDataBtn />
      <hr />
      <UserDeletion />
    </div>
  );
};

export default Settings;
