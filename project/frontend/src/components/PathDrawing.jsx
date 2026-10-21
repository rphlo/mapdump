import React, { useEffect, useState } from "react";
import { Point, cornerBackTransform, resetOrientation } from "../utils";
import * as L from "leaflet";

const PathDrawing = (props) => {
  const [mapImage, setMapImage] = useState(false);
  const [leafletMap, setLeafletMap] = useState(null);
  const [route, setRoute] = React.useState([]);
  const [pl] = React.useState(L.polyline([], { color: "red" }));

  useEffect(() => {
    resetOrientation(props.mapDataURL, function (imgDataURI, width, height) {
      setMapImage({ width, height });
      const map = L.map("rasterMap", {
        crs: L.CRS.Simple,
        minZoom: -5,
        maxZoom: 2,
        zoomSnap: 0,
        scrollWheelZoom: true,
        attributionControl: false,
      });
      setLeafletMap(map);
      const bounds = [map.unproject([0, 0]), map.unproject([width, height])];
      new L.imageOverlay(imgDataURI, bounds).addTo(map);
      map.fitBounds(bounds);
      map.invalidateSize();
    });
  }, [props.mapDataURL]);

  useEffect(() => {
    if (leafletMap) {
      leafletMap.on("click", (e) => setRoute((r) => addPoint(e, r)));
    }
  }, [leafletMap]);

  useEffect(() => {
    if (leafletMap && route.length >= 2) {
      pl.removeFrom(leafletMap);
      pl.setLatLngs(route);
      pl.addTo(leafletMap);
    } else if (route.length < 2) {
      pl.remove();
    }
  }, [leafletMap, route, pl]);

  const addPoint = (e, prevRoute) => {
    return [...prevRoute, e.latlng];
  };

  const removeLastPoint = (e, prevRoute) => {
    return prevRoute.slice(0, -1);
  };

  const onSubmit = (e) => {
    const transform = cornerBackTransform(
      mapImage.width,
      mapImage.height,
      props.mapCornersCoords.top_left,
      props.mapCornersCoords.top_right,
      props.mapCornersCoords.bottom_right,
      props.mapCornersCoords.bottom_left
    );
    const out = route.map((ll) => {
      var latlng = transform(new Point(ll.lng, -ll.lat));
      return { latlng: [latlng.lat, latlng.lng] };
    });
    props.onRoute(out);
  };

  return (
    <>
      <h1>Draw Route</h1>
      <div className="alert alert-primary">
        Click on map to add points to your route
      </div>
      <div
        id="rasterMap"
        style={{ marginBottom: "5px", height: "500px", width: "100%" }}
      ></div>
      <div>
        <button
          type="button"
          className="btn btn-danger"
          disabled={route.length < 1}
          onClick={(e) => setRoute((r) => removeLastPoint(e, r))}
        >
          <i className="fas fa-undo"></i> Remove last point
        </button>
      </div>
      <div style={{ marginTop: "10px" }}>
        <button type="button" className="btn btn-danger" onClick={props.onUndo}>
          <i className="fas fa-undo"></i> Back
        </button>{" "}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={route.length < 2}
        >
          <i className="fa fa-save"></i> Save route
        </button>
      </div>
    </>
  );
};

export default PathDrawing;
