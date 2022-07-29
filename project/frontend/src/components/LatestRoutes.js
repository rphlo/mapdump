import React from "react";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import LazyImage from "./LazyImage";
import { printPace, printTime } from "../utils/drawHelpers";
import {
  capitalizeFirstLetter,
  displayDate,
  regionNames,
} from "../utils/Utils";

const LatestRoute = () => {
  const [routes, setRoutes] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const res = await fetch(
        process.env.REACT_APP_API_URL + "/v1/latest-routes/"
      );
      setRoutes(await res.json());
    })();
  }, []);

  return (
    <>
      <h3>
        Latest Routes{" "}
        <a href={process.env.REACT_APP_API_URL + "/v1/latest-routes/feed/"}>
          <i className="fa fa-rss" title="RSS"></i>
        </a>
      </h3>
      <div className="container" style={{ textAlign: "left" }}>
        {routes === false && (
          <div style={{ textAlign: "center" }}>
            <span>
              <i className="fa fa-spinner fa-spin"></i> Loading
            </span>
          </div>
        )}
        {routes &&
          (!routes.length ? (
            <div style={{ textAlign: "center" }}>
              <span>No routes have been yet uploaded...</span>
            </div>
          ) : (
            <div className="row">
              {routes.map((r) => (
                <div
                  key={r.id}
                  className="col-12 col-md-4"
                  style={{ marginBottom: "15px" }}
                >
                  <div className="card route-card">
                    <Link to={"/routes/" + r.id}>
                      <LazyImage
                        src={r.map_thumbnail_url}
                        alt="map thumbnail"
                      ></LazyImage>
                    </Link>
                    <div className="card-body">
                      <div style={{ display: "flex", justifyContent: "start" }}>
                        <div
                          style={{ marginRight: "10px", textAlign: "center" }}
                        >
                          <img
                            src={"/athletes/" + r.athlete.username + ".png"}
                            alt="profile"
                            style={{ borderRadius: "50%", width: "40px" }}
                          ></img>
                          <br />
                          <span
                            title={regionNames.of(r.country)}
                            style={{ fontSize: "1.5em", margin: "5px" }}
                            className={
                              "flag-icon flag-icon-" + r.country.toLowerCase()
                            }
                          ></span>
                        </div>
                        <div
                          style={{
                            width: "calc(100% - 46px)",
                            borderLeft: "1px solid #B4B4B4",
                          }}
                        >
                          <div className="card-text">
                            <div style={{ paddingLeft: "5px" }}>
                              <div
                                style={{
                                  color: "black",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                <Link to={"/athletes/" + r.athlete.username}>
                                  {capitalizeFirstLetter(r.athlete.first_name)}{" "}
                                  {capitalizeFirstLetter(r.athlete.last_name)}
                                </Link>
                              </div>
                              <div style={{ fontSize: "0.8em" }}>
                                {displayDate(
                                  DateTime.fromISO(r.start_time, {
                                    zone: r.tz,
                                  })
                                )}
                              </div>
                              <div
                                style={{
                                  color: "black",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                <b>
                                  <Link
                                    style={{
                                      color: "black",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                    to={"/routes/" + r.id}
                                  >
                                    {r.name}
                                  </Link>
                                </b>
                              </div>
                            </div>
                            <div style={{ marginLeft: "-1px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "start",
                                  gap: "5px",
                                  flexFlow: "row wrap",
                                  fontSize: "0.8em",
                                }}
                              >
                                <div
                                  style={{
                                    borderLeft: "1px solid #B4B4B4",
                                    paddingLeft: "5px",
                                  }}
                                >
                                  <span style={{ color: "#666" }}>
                                    Distance
                                  </span>
                                  <br />
                                  {(r.distance / 1000).toFixed(1) + "km"}
                                </div>
                                {r.duration ? (
                                  <>
                                    <div
                                      style={{
                                        borderLeft: "1px solid #B4B4B4",
                                        paddingLeft: "5px",
                                      }}
                                    >
                                      <span style={{ color: "#666" }}>
                                        Duration
                                      </span>
                                      <br />
                                      {printTime(r.duration * 1000)}
                                    </div>
                                    <div
                                      style={{
                                        borderLeft: "1px solid #B4B4B4",
                                        paddingLeft: "5px",
                                      }}
                                    >
                                      <span style={{ color: "#666" }}>
                                        Pace
                                      </span>
                                      <br />
                                      {printPace(
                                        (r.duration / r.distance) * 1000
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  ""
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>
    </>
  );
};

export default LatestRoute;
