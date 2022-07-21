import React, { useEffect, useState, useRef } from "react";
import { LatLon, cornerCalTransform } from "../utils/Utils";
import * as L from "leaflet";
import Slider from "react-input-slider";
import "../utils/Leaflet.SmoothWheelZoom";
import RouteHeader from "./RouteHeader";
import ShareModal from "./ShareModal";
import { Position, PositionArchive } from "../utils/positions";
import { scaleImage } from "../utils/drawHelpers";

const RouteReplay = (props) => {
  const [playing, setPlaying] = useState(false);
  const [route, setRoute] = useState(false);

  const [mapImage, setMapImage] = useState(false);
  const [speed, setSpeed] = useState(8);
  const [progress, setProgress] = useState(0);
  const [leafletMap, setLeafletMap] = useState(null);
  const [leafletTail, setLeafletTail] = useState(null);
  const [leafletMarker, setLeafletMarker] = useState(null);
  const [playInterval, setPlayInterval] = useState(null);
  const [isPortrait, setIsPortrait] = useState(false);
  const mapDiv = useRef(null);

  const FPS = 15;
  const tailLength = 60;

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
      callback(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = src;
  }

  useEffect(() => {
    const arch = new PositionArchive();
    props.route.forEach((p) =>
      arch.add(
        new Position({
          timestamp: p.time,
          coords: { latitude: p.latLon[0], longitude: p.latLon[1] },
        })
      )
    );
    setRoute(arch);
  }, [props.route]);

  useEffect(() => {
    if (mapDiv.current) {
      resetOrientation(props.mapDataURL, function (imgDataURI) {
        var img = new Image();
        img.onload = function () {
          setMapImage(this);
          const map = L.map("raster_map", {
            crs: L.CRS.Simple,
            minZoom: -5,
            maxZoom: 2,
            zoomSnap: 0,
            scrollWheelZoom: false,
            smoothWheelZoom: true,
          });
          setLeafletMap(map);
          const bounds = [
            map.unproject([0, 0]),
            map.unproject([this.width, this.height]),
          ];
          new L.imageOverlay(this.src, bounds).addTo(map);
          map.fitBounds(bounds);
          map.invalidateSize();
        };
        img.src = imgDataURI;
      });
    }
  }, [props.mapDataURL, mapDiv]);

  useEffect(() => {
    const getCurrentTime = () => {
      const lastT = route.getByIndex(route.getPositionsCount() - 1).timestamp;
      const firstT = route.getByIndex(0).timestamp;
      return firstT + ((lastT - firstT) * progress) / 100;
    };
    if (!route) {
      return;
    }
    const transform = cornerCalTransform(
      mapImage.width,
      mapImage.height,
      props.mapCornersCoords.top_left,
      props.mapCornersCoords.top_right,
      props.mapCornersCoords.bottom_right,
      props.mapCornersCoords.bottom_left
    );
    const currentPos = route.getByTime(getCurrentTime());
    const hasPointLast30sec = route.hasPointInInterval(
      getCurrentTime() - 30 * 1e3,
      getCurrentTime()
    );
    if (!hasPointLast30sec) {
      if (leafletMarker) {
        leafletMap.removeLayer(leafletMarker);
      }
      setLeafletMarker(null);
    } else if (currentPos && !isNaN(currentPos.coords.latitude)) {
      const pt = transform(
        new LatLon(currentPos.coords.latitude, currentPos.coords.longitude)
      );
      if (!leafletMarker) {
        var svgRect =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" preserveAspectRatio="xMidYMid meet" x="955"  stroke="red"><g fill="none" fill-rule="evenodd" stroke-width="2"><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="0s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"/><animate attributeName="stroke-opacity" begin="0s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"/></circle><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="-0.9s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"/><animate attributeName="stroke-opacity" begin="-0.9s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"/></circle></g></svg>';
        var pulseIcon = L.icon({
          iconUrl: encodeURI("data:image/svg+xml," + svgRect).replace(
            "#",
            "%23"
          ),
          iconSize: [40, 40],
          shadowSize: [40, 40],
          iconAnchor: [20, 20],
          shadowAnchor: [0, 0],
          popupAnchor: [0, 0],
        });
        const m = new L.marker([-pt.y, pt.x], { icon: pulseIcon });
        m.addTo(leafletMap);
        setLeafletMarker(m);
      } else {
        leafletMarker.setLatLng([-pt.y, pt.x]);
      }
    }
    const tailPts = route.extractInterval(
      getCurrentTime() - tailLength * 1e3,
      getCurrentTime()
    );
    const hasPointInTail = route.hasPointInInterval(
      getCurrentTime() - tailLength * 1e3,
      getCurrentTime()
    );
    if (!hasPointInTail) {
      if (leafletTail) {
        leafletMap.removeLayer(leafletTail);
      }
      setLeafletTail(null);
    } else {
      var tailLatLng = [];
      tailPts.getArray().forEach(function (pos) {
        if (!isNaN(pos.coords.latitude)) {
          const pt = transform(
            new LatLon(pos.coords.latitude, pos.coords.longitude)
          );
          tailLatLng.push([-pt.y, pt.x]);
        }
      });
      if (!leafletTail) {
        const t = L.polyline(tailLatLng, {
          color: "red",
          opacity: 0.75,
          weight: 5,
        });
        t.addTo(leafletMap);
        setLeafletTail(t);
      } else {
        leafletTail.setLatLngs(tailLatLng);
      }
    }
  }, [
    route,
    progress,
    props.mapCornersCoords,
    leafletMap,
    leafletTail,
    leafletMarker,
    mapImage,
    tailLength,
  ]);

  const getTimeProgress = (t) => {
    const lastT = props.route[props.route.length - 1].time;
    const firstT = props.route[0].time;
    return ((t - firstT) / (lastT - firstT)) * 100;
  };

  const increaseTime = (pr, sp, pi) => {
    const lastT = route.getByIndex(route.getPositionsCount() - 1).timestamp;
    const firstT = route.getByIndex(0).timestamp;
    const newTime = firstT + ((lastT - firstT) * pr) / 100 + (sp / FPS) * 1000;
    const p = Math.min(100, getTimeProgress(newTime));
    if (p === 100) {
      clearInterval(pi);
      onPause();
    }
    return p;
  };

  const onPlay = () => {
    if (!leafletMap) {
      return false;
    }
    setPlaying(true);
    const interval = setInterval(() => {
      setPlayInterval((pi) => {
        setSpeed((s) => {
          setProgress((progress) => increaseTime(progress, s, pi));
          return s;
        });
        return pi;
      });
    }, 1000 / FPS);
    setPlayInterval(interval);
  };
  const onPause = () => {
    clearInterval(playInterval);
    setPlayInterval(null);
    setPlaying(false);
  };
  const onChangeProgress = ({ x }) => {
    setProgress(x);
  };
  const onSlower = () => {
    setSpeed(Math.max(1, speed / 2));
  };
  const onFaster = () => {
    setSpeed(speed * 2);
  };

  const getFormattedTimeSinceStart = () => {
    if (!route) {
      return "";
    }
    const lastT = route.getByIndex(route.getPositionsCount() - 1).timestamp;
    const firstT = route.getByIndex(0).timestamp;
    const t = ((lastT - firstT) * progress) / 100;
    const date = new Date(null);
    date.setSeconds(t / 1e3);
    return date.toISOString().substr(11, 8);
  };

  const hasRouteTime = () => {
    return !!props.route[0].time;
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
    <div className="container main-container">
      <RouteHeader {...props} />
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
          className="btn btn-sm btn-primary float-right"
          onClick={props.togglePlayer}
        >
          <i className="fas fa-map"></i> View full map{" "}
        </button>
      </div>
      {hasRouteTime() ? (
        <>
          <div
            id="raster_map"
            ref={mapDiv}
            style={{
              marginBottom: "5px",
              width: "100%",
              aspectRatio: isPortrait ? "9 / 16" : "16 / 9",
            }}
          ></div>
          <div style={{ marginBottom: "5px" }}>
            {!playing ? (
              <button className="btn btn-light" onClick={onPlay}>
                <i className="fa fa-play"></i>
              </button>
            ) : (
              <button className="btn btn-light" onClick={onPause}>
                <i className="fa fa-pause"></i>
              </button>
            )}
            <span style={{ float: "right" }}>
              <button
                className="btn btn-light"
                onClick={() => {
                  setIsPortrait(!isPortrait);
                  leafletMap.invalidateSize();
                }}
              >
                <i className="fa fa-sync"></i>
              </button>
            </span>
            <span style={{ paddingLeft: "15px" }}>
              <Slider
                style={{ width: "100%" }}
                axis="x"
                onChange={onChangeProgress}
                xmin="0"
                xmax="100"
                xstep=".1"
                x={progress}
              />
            </span>
          </div>
          <div>
            <span
              className="badge badge-secondary"
              style={{ fontSize: "1em", fontVariantNumeric: "tabular-nums" }}
            >
              {getFormattedTimeSinceStart()}
            </span>
            <span
              className="badge badge-secondary"
              style={{ fontSize: "1em", marginLeft: "5px" }}
            >
              {"x" + speed}
            </span>{" "}
            <button className="btn btn-sm btn-light" onClick={onSlower}>
              Slower
            </button>{" "}
            <button onClick={onFaster} className="btn btn-sm btn-light">
              Faster
            </button>{" "}
            <span
              className="badge badge-info float-right"
              style={{ fontSize: "1em", marginLeft: "25px" }}
            >
              Tail: 1min
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle"></i> Can not display
            player as route does not contain time information.
          </div>
          <div id="raster_map"></div>
        </>
      )}
      {shareModalOpen && (
        <ShareModal
          url={document.location.href}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default RouteReplay;
