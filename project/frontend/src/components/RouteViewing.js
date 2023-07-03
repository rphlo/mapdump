import React, { useEffect, useState, createRef } from "react";
import { getCorners } from "../utils/drawHelpers";
import { saveAs } from "file-saver";
import RouteHeader from "./RouteHeader";
import ShareModal from "./ShareModal";
import { saveKMZ } from "../utils/fileHelpers";
import useGlobalState from "../utils/useGlobalState";
import * as L from "leaflet";
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';
import { LatLng, cornerCalTransform } from "../utils";
import { Position, PositionArchive } from "../utils/positions";
import { scaleImage } from "../utils/drawHelpers";
import Swal from "sweetalert2";

function resetOrientation(src, callback) {
  var img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = function () {
    var width = img.width,
      height = img.height;
    const MAX = 3000;
    let canvas = null;
    if (height > MAX || width > MAX) {
      canvas = scaleImage(img, MAX / Math.max(height, width));
    } else {
      canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0);
    }
    // export base64
    callback(canvas.toDataURL("image/png"), width, height);
  };
  img.src = src;
}

const RouteViewing = (props) => {
  const [mapImage, setMapImage] = useState(false);
  const [route, setRoute] = useState(false);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeRoute, setIncludeRoute] = useState(true);
  const [name, setName] = useState();
  const [isPrivate, setIsPrivate] = useState(props.isPrivate);
  const [togglingRoute, setTogglingRoute] = useState();
  const [togglingHeader, setTogglingHeader] = useState();
  const [zoom, setZoom] = useState(100);
  const [imgURL, setImgURL] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [cropping, setCropping] = useState(false);
  const [leafletRoute, setLeafletRoute] = useState(null);
  const [croppingRange, setCroppingRange] = useState([0, 100])
  const [savingCrop, setSavingCrop] = useState(false)
  let finalImage = createRef();

  const globalState = useGlobalState();
  const { api_token } = globalState.user;

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
    const arch = new PositionArchive();
    props.route.forEach((p) =>
      arch.add(
        new Position({
          timestamp: p.time,
          coords: { latitude: p.latlng[0], longitude: p.latlng[1] },
        })
      )
    );
    setRoute(arch);
  }, [props.route]);

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
    if (isPrivate) {
      qp.set("auth_token", api_token);
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
    isPrivate,
    api_token,
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
      corners_coords.top_left.lng,
      corners_coords.top_right.lat,
      corners_coords.top_right.lng,
      corners_coords.bottom_right.lat,
      corners_coords.bottom_right.lng,
      corners_coords.bottom_left.lat,
      corners_coords.bottom_left.lng,
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
    fetch(imgURL)
      .then((r) => r.blob())
      .then((b) => saveAs(b, downloadName));
  };

  const downloadKmz = (e) => {
    fetch(props.mapDataURL + (isPrivate ? "?auth_token=" + api_token : ""))
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
    saveAs(
      props.gpx + (isPrivate ? "?auth_token=" + api_token : ""),
      name + ".gpx"
    );
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
      if (isPrivate) {
        qp.set("auth_token", api_token);
      }
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

  const cropRoute = () => {
    setCropping(true);
    resetOrientation(
      props.mapDataURL + (props.isPrivate ? "?auth_token=" + api_token : ""),
      function (imgDataURI, width, height) {
        setMapImage({ width, height });
        const map = L.map("croppingMap", {
          crs: L.CRS.Simple,
          minZoom: -5,
          maxZoom: 2,
          zoomSnap: 0,
          scrollWheelZoom: true,
        });
        const bounds = [
          map.unproject([0, 0]),
          map.unproject([width, height]),
        ];
        new L.imageOverlay(imgDataURI, bounds).addTo(map);
        map.fitBounds(bounds);
        map.invalidateSize();

        const transform = cornerCalTransform(
          width,
          height,
          props.mapCornersCoords.top_left,
          props.mapCornersCoords.top_right,
          props.mapCornersCoords.bottom_right,
          props.mapCornersCoords.bottom_left
        );
        const routeLatLng = [];
        route.getArray().forEach(function (pos) {
          if (!isNaN(pos.coords.latitude)) {
            const pt = transform(
              new LatLng(pos.coords.latitude, pos.coords.longitude)
            );
            routeLatLng.push([-pt.y, pt.x]);
          }
        });
        const t = L.polyline(routeLatLng, {
          color: "red",
          opacity: 0.75,
          weight: 5,
        });
        t.addTo(map);
        setLeafletRoute(t);
      }
    );
  }


  const onCropChange = (range) => {
    setCroppingRange(range)
    const arr = route.getArray()
    const minIdx = Math.floor(range[0] * arr.length / 100)
    const maxIdx = Math.ceil(range[1] * arr.length / 100)
    const arr2 = arr.slice(minIdx, maxIdx)

    const transform = cornerCalTransform(
      mapImage.width,
      mapImage.height,
      props.mapCornersCoords.top_left,
      props.mapCornersCoords.top_right,
      props.mapCornersCoords.bottom_right,
      props.mapCornersCoords.bottom_left
    );
    const routeLatLng = [];
    arr2.forEach(function (pos) {
      if (!isNaN(pos.coords.latitude)) {
        const pt = transform(
          new LatLng(pos.coords.latitude, pos.coords.longitude)
        );
        routeLatLng.push([-pt.y, pt.x]);
      }
    });
    leafletRoute.setLatLngs(routeLatLng)
  }

  const saveCropping = async () => {
    const arr = route.getArray()
    const minIdx = Math.floor(croppingRange[0] * arr.length / 100)
    const maxIdx = Math.ceil(croppingRange[1] * arr.length / 100)
    const arr2 = arr.slice(minIdx, maxIdx)

    setSavingCrop(true);
    try {
      const response = await fetch(
        process.env.REACT_APP_API_URL + "/v1/route/" + props.id,
        {
          method: "PATCH",
          credentials: "omit",
          headers: {
            Authorization: "Token " + api_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ route_data: arr2.map(p => {return {time: p.timestamp / 1e3, latlon: [p.coords.latitude, p.coords.longitude]}}) }),
        }
      );
      setSavingCrop(false);
      if (response.status !== 200) {
        Swal.fire({
          title: "Error!",
          text: "Something went wrong!",
          icon: "error",
          confirmButtonText: "OK",
        });
        return
      }
      window.location.reload()
    } catch (e) {}
  }

  return (
    <>
      <div className="container main-container">
        <RouteHeader
          {...props}
          onNameChanged={setName}
          onPrivacyChanged={setIsPrivate}
        />
        {!cropping && (<>
        <div>
          {!isPrivate && (
            <button
              style={{ marginBottom: "5px" }}
              className="btn btn-sm btn-warning"
              onClick={share}
            >
              <i className="fas fa-share"></i> Share
            </button>
          )}
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
            data-testid="dl-kmz"
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
          &nbsp;
          <button
              style={{ marginBottom: "5px" }}
              className="btn btn-sm btn-primary"
              onClick={cropRoute}
            >
              <i className="fas fa-cut"></i> Crop GPS
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
        <div>
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
        </div>
      </>)}
      </div>
      <div className="container-fluid">
        <div>
          {cropping && (<div className="container">
            <h3>Crop GPS</h3>
            <button className="btn btn-primary mb-3 mr-1" onClick={saveCropping} disabled={savingCrop}><i className="fas fa-save"></i> Save</button><button className="btn btn-danger mb-3" onClick={() => window.location.reload()} disabled={savingCrop}><i className="fas fa-times"></i> Cancel</button>
            <RangeSlider className={"mb-3"} defaultValue={[0, 100]} step={0.001} onInput={onCropChange}/>
            <div id="croppingMap" style={{height: "500px"}}></div>
          </div>)}
          {!cropping && imgURL && (
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
          {!cropping && !imgLoaded && (
            <div>
              <h3>
                <i className="fa fa-spin fa-spinner"></i> Loading...
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
