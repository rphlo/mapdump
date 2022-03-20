import React from "react";

const RasterMapRedirect = ({ match, history }) => {
  history.push("/routes/" + match.params.uid);
  return <></>;
};

export default RasterMapRedirect;
