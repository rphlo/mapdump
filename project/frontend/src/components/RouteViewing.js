import React, { useEffect, useState, createRef } from "react";
import { getCorners } from "../utils/drawHelpers";
import { saveAs } from "file-saver";
import RouteHeader from "./RouteHeader";
import ShareModal from "./ShareModal";
import { saveKMZ } from "../utils/fileHelpers";

const RouteViewing = (props) => {
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeRoute, setIncludeRoute] = useState(true);
  const [name, setName] = useState();
  const [togglingRoute, setTogglingRoute] = useState();
  const [togglingHeader, setTogglingHeader] = useState();
  const [zoom, setZoom] = useState(100);
  const [imgURL, setImgURL] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  let finalImage = createRef();

  const loadCache = async (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
  };

  useEffect(() => {
    const qp = new URLSearchParams();
    qp.set("m", props.modificationDate);
    if (!includeHeader && !includeRoute) {
      qp.set("out_bounds", "1");
    }
    if (includeHeader) {
      qp.set("show_header", "1");
    }
    if (includeRoute) {
      qp.set("show_route", "1");
    }
    const url = props.mapDataURL + "?" + qp.toString();
    setImgURL(url);
  }, [
    includeHeader,
    includeRoute,
    props.mapDataURL,
    props.modificationDate,
    togglingHeader,
    togglingRoute,
  ]);

  useEffect(() => {
    setName(props.name);
  }, [props.name]);

  const round5 = (v) => {
    return Math.round(v * 1e5) / 1e5;
  };

  const printCornersCoords = (corners_coords, separator) => {
    return [
      corners_coords.top_left.lat,
      corners_coords.top_left.lon,
      corners_coords.top_right.lat,
      corners_coords.top_right.lon,
      corners_coords.bottom_right.lat,
      corners_coords.bottom_right.lon,
      corners_coords.bottom_left.lat,
      corners_coords.bottom_left.lon,
    ]
      .map((c) => round5(c))
      .join(separator);
  };

  const downloadMap = () => {
    const newCorners = getCorners(
      props.mapSize,
      props.mapCornersCoords,
      props.route,
      includeHeader,
      includeRoute
    );
    const downloadName =
      name +
      "_" +
      (includeRoute ? "" : "blank_") +
      printCornersCoords(newCorners, "_") +
      "_.jpg";
    saveAs(finalImage.current.src, downloadName);
  };

  const downloadKmz = (e) => {
    fetch(props.mapDataURL)
      .then((r) => r.blob())
      .then((blob) => {
        const newCorners = getCorners(
          props.mapSize,
          props.mapCornersCoords,
          [],
          false,
          false
        );
        saveKMZ(name + "_blank.kmz", name, newCorners, blob);
      });
  };

  const downloadGPX = (ev) => {
    saveAs(props.gpx, name + ".gpx");
  };

  const toggleHeader = (ev) => {
    if (togglingHeader) {
      return;
    }
    setIncludeHeader(!includeHeader);
    setTogglingHeader(true);
  };
  const toggleRoute = (ev) => {
    if (togglingRoute) {
      return;
    }
    setIncludeRoute(!includeRoute);
    setTogglingRoute(true);
  };

  const hasRouteTime = () => {
    return !!props.route[0].time;
  };

  const zoomOut = () => {
    setZoom(Math.max(10, zoom - 10));
  };

  const zoomIn = () => {
    setZoom(zoom + 10);
  };

  const onImgLoaded = async () => {
    setImgLoaded(true);
    if (togglingHeader) {
      setTogglingHeader(false);
    }
    if (togglingRoute) {
      setTogglingRoute(false);
    }
    if (firstLoad) {
      setFirstLoad(false);
      const qp = new URLSearchParams();
      qp.set("m", props.modificationDate);
      qp.set("show_header", "1");
      const url = props.mapDataURL + "?" + qp.toString();
      await loadCache(url);
    }
  };

  let webShareApiAvailable = false;
  if (navigator.canShare) {
    webShareApiAvailable = true;
  }

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const share = () => {
    if (webShareApiAvailable) {
      try {
        navigator
          .share({ url: document.location.href })
          .then(() => {})
          .catch(() => {});
      } catch (e) {}
    } else {
      setShareModalOpen(true);
    }
  };

  return (
    <>
      <div className="container main-container">
        <RouteHeader {...props} onNameChanged={setName} />
        <div>
          <button
            style={{ marginBottom: "5px" }}
            className="btn btn-sm btn-warning"
            onClick={share}
          >
            <i className="fas fa-share"></i> Share
          </button>
          <br />
          <button
            style={{ marginBottom: "5px" }}
            className="btn btn-sm btn-success"
            onClick={downloadMap}
          >
            <i className="fas fa-download"></i> JPEG{" "}
            {`(Map${includeRoute ? " w/ Route" : ""})`}
          </button>
          &nbsp;
          <button
            style={{ marginBottom: "5px" }}
            className="btn btn-sm btn-success"
            onClick={downloadKmz}
          >
            <i className="fas fa-download"></i> KMZ (Map)
          </button>
          &nbsp;
          <button
            style={{ marginBottom: "5px" }}
            className="btn btn-sm btn-success"
            onClick={downloadGPX}
          >
            <i className="fas fa-download"></i> GPX (Route)
          </button>
          {hasRouteTime() && (
            <button
              style={{ marginBottom: "5px" }}
              className="btn btn-sm btn-primary float-right"
              onClick={props.togglePlayer}
            >
              <i className="fas fa-play"></i> View animation
            </button>
          )}
        </div>
        <button
          className="btn btn-sm btn-default"
          onClick={zoomIn}
          aria-label="Zoom in"
        >
          <i className={"fa fa-plus"}></i>
        </button>
        &nbsp;
        <button
          className="btn btn-sm btn-default"
          onClick={zoomOut}
          aria-label="Zoom out"
        >
          <i className={"fa fa-minus"}></i>
        </button>
        &nbsp;
        <button className="btn btn-sm btn-default" onClick={toggleHeader}>
          <i
            className={
              togglingHeader
                ? "fa fa-spinner fa-spin"
                : "fa fa-toggle-" + (includeHeader ? "on" : "off")
            }
            style={includeHeader ? { color: "#3c2" } : {}}
          ></i>{" "}
          Header
        </button>
        &nbsp;
        <button className="btn btn-sm btn-default" onClick={toggleRoute}>
          <i
            className={
              togglingRoute
                ? "fa fa-spinner fa-spin"
                : "fa fa-toggle-" + (includeRoute ? "on" : "off")
            }
            style={includeRoute ? { color: "#3c2" } : {}}
          ></i>{" "}
          Route
        </button>
        &nbsp;
      </div>
      <div className="container-fluid">
        <div>
          {imgURL && (
            <center>
              <img
                ref={finalImage}
                crossOrigin="anonymous"
                onLoad={onImgLoaded}
                className="final-image"
                src={imgURL}
                alt="route"
                onClick={toggleRoute}
                style={{ marginTop: "5px", width: zoom + "%" }}
              />
            </center>
          )}
          {!imgLoaded && (
            <div>
              <h3>
                <i className="fa fa-spin fa-spinner"></i> Loading
              </h3>
            </div>
          )}
        </div>
        {shareModalOpen && (
          <ShareModal
            url={document.location.href}
            onClose={() => setShareModalOpen(false)}
          />
        )}
      </div>
    </>
  );
};

export default RouteViewing;
