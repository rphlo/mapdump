import React from "react";
import { Helmet } from "react-helmet";

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>404 - Page not found | Mapdump.com</title>
      </Helmet>
      <div className="container main-container">
        <h2>404 - Page not found</h2>
      </div>
    </>
  );
};

export default NotFound;
