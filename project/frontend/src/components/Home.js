import React from "react";
import { Link } from "react-router-dom";
import useGlobalState from "../utils/useGlobalState";
import LatestRoutes from "./LatestRoutes";
import { Helmet } from "react-helmet";

const Home = () => {
  const globalState = useGlobalState();
  const { username } = globalState.user;
  return (
    <>
      <Helmet>
        <title>Mapdump.com</title>
      </Helmet>

      <div className="container main-container">
        <div style={{ textAlign: "center" }}>
          <Link to="/new">
            <button className="btn btn-primary">
              <i className="fas fa-plus"></i> Create New Route
            </button>
          </Link>
          <> </>
          <Link to="/map">
            <button className="btn btn-info">
              <i className="fas fa-globe"></i> Browse Maps
            </button>
          </Link>
          {username && (
            <>
              <hr />
              <Link to={"/athletes/" + username}>
                <button className="btn btn-primary">
                  <i className="fas fa-link"></i> Your routes
                </button>
              </Link>
            </>
          )}
          <hr />
          <LatestRoutes />
        </div>
      </div>
    </>
  );
};

export default Home;
