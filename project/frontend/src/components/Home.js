import React from "react";
import LatestRoutes from "./LatestRoutes";
import { Helmet } from "react-helmet";

import { Link } from "react-router-dom";
import useGlobalState from "../utils/useGlobalState";
import { capitalizeFirstLetter } from "../utils/Utils";

const Home = () => {
  const [userData, setUserData] = React.useState(null);
  const globalState = useGlobalState();
  const { api_token, username } = globalState.user;

  React.useEffect(() => {
    if (api_token) {
      (async () => {
        const res = await fetch(
          process.env.REACT_APP_API_URL + "/v1/auth/user/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Token " + api_token,
            },
          }
        );
        const data = await res.json();
        setUserData(data);
      })();
    } else {
      setUserData(null);
    }
  }, [api_token]);

  return (
    <>
      <Helmet>
        <title>Mapdump.com</title>
      </Helmet>
      <div className="container" style={{ textAlign: "center" }}>
        {username && userData && (
          <div
            className="col-12 col-md-4 offset-md-4"
            style={{ marginBottom: "15px", zIndex: 100 }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ marginRight: "10px", textAlign: "center" }}>
                <img
                  src={
                    process.env.REACT_APP_AVATAR_ROOT +
                    "/athletes/" +
                    username +
                    ".png"
                  }
                  alt="profile"
                  style={{ borderRadius: "50%", width: "80px" }}
                ></img>
              </div>
              <Link
                to={"/athletes/" + username}
                style={{
                  color: "black",
                  fontSize: "1.7em",
                  fontWeight: "bold",
                }}
              >
                {capitalizeFirstLetter(userData.first_name)}{" "}
                {capitalizeFirstLetter(userData.last_name)}
              </Link>
            </div>
            <hr />
            <div>
              <Link to={"/athletes/" + username}>Your Activities</Link> -{" "}
              <Link to="/new">Upload New Route</Link>
              <br />
              <Link to="/map">Browse Maps</Link>
            </div>
          </div>
        )}
        {!username && (
          <div
            className="col-12 col-md-4 offset-md-4"
            style={{ marginBottom: "15px" }}
          >
            <div
              style={{
                textAlign: "center",
                fontSize: "1.7em",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              You are not logged in...
              <br />
              <Link to={"/sign-up"}>
                <button className="btn btn-primary btn-success">Sign Up</button>
              </Link>
              <span style={{ fontSize: ".7em", fontWeight: "normal" }}>
                {" "}
                or <Link to={"/login"}>Login</Link>
              </span>
            </div>
            <hr />
            <div>
              <Link to="/new">Test without Registering</Link>
              <br />
              <Link to="/map">Browse Maps</Link>
            </div>
          </div>
        )}
      </div>
      <div className="container main-container">
        <LatestRoutes />
      </div>
    </>
  );
};

export default Home;
