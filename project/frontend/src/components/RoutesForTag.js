import React from "react";
import LatestRoutes from "./LatestRoutes";
import { Helmet } from "react-helmet";

const RoutesForTags = ({ match }) => {
  return (
    <>
      <Helmet>
        <title>Mapdump.com</title>
      </Helmet>
      <div className="container main-container">
        <LatestRoutes tag={match.params.tag} />
      </div>
    </>
  );
};

export default RoutesForTags;
