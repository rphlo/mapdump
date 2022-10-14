import React, { useEffect, useState } from "react";
import * as L from "leaflet";
import "../utils/Leaflet.SmoothWheelZoom";
import "../utils/Leaflet.ImageTransform";

L.TileLayer.Common = L.TileLayer.extend({
  initialize: function (options) {
    L.TileLayer.prototype.initialize.call(this, this.url, options);
  },
});
L.TileLayer["osm"] = L.TileLayer.Common.extend({
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  options: {
    attribution:
      "\u0026copy\u003B \u003Ca href\u003D\u0022http://openstreetmap.org\u0022\u003EOpenStreetMap\u003C/a\u003E contributors, \u003Ca href\u003D\u0022http://creativecommons.org/licenses/by\u002Dsa/2.0/\u0022\u003ECC\u002DBY\u002DSA\u003C/a\u003E",
  },
});
L.TileLayer["gmap-street"] = L.TileLayer.Common.extend({
  url: "https://mt0.google.com/vt/x\u003D{x}\u0026y\u003D{y}\u0026z\u003D{z}",
  options: { attribution: "\u0026copy\u003B Google" },
});
L.TileLayer["gmap-hybrid"] = L.TileLayer.Common.extend({
  url: "https://mt0.google.com/vt/lyrs\u003Dy\u0026hl\u003Den\u0026x\u003D{x}\u0026y\u003D{y}\u0026z\u003D{z}",
  options: { attribution: "\u0026copy\u003B Google" },
});
L.TileLayer["finland-topo"] = L.TileLayer.Common.extend({
  url: "https://tiles.kartat.kapsi.fi/peruskartta/{z}/{x}/{y}.jpg",
  options: { attribution: "\u0026copy\u003B National Land Survey of Finland" },
});
L.TileLayer["mapant-fi"] = L.TileLayer.Common.extend({
  url: "https://wmts.mapant.fi/wmts_EPSG3857.php?z\u003D{z}\u0026x\u003D{x}\u0026y\u003D{y}",
  options: { attribution: "MapAnt and National Land Survey of Finland" },
});
L.TileLayer["norway-topo"] = L.TileLayer.Common.extend({
  url: "https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers\u003Dtopo4\u0026zoom\u003D{z}\u0026x\u003D{x}\u0026y\u003D{y}",
  options: { attribution: "" },
});
L.TileLayer["mapant-no"] = L.TileLayer.Common.extend({
  url: "https://mapant.no/osm-tiles/{z}/{x}/{y}.png",
  options: { attribution: "MapAnt Norway" },
});
L.TileLayer["mapant-es"] = L.tileLayer.wms(
  "https://mapant.es/mapserv?map=/mapas/geotiff.map&SERVICE=WMS",
  {
    layers: "geotiff",
    format: "image/png",
    version: "1.3.0",
    transparent: true,
  }
);
L.TileLayer["world-topo"] = L.TileLayer.Common.extend({
  url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
  options: { attribution: "&copy; OpenTopoMap (CC-BY-SA)" },
});
L.TileLayer["world-topo-alt"] = L.TileLayer.Common.extend({
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  options: { attribution: "&copy; ArcGIS Online" },
});

function round5(x) {
  return Math.round(x * 1e5) / 1e5;
}

function getCalibrationString(c) {
  var parts = [];
  for (var i = 0; i < c.length; i++) {
    parts.push(round5(c[i].lat) + "," + round5(c[i].lon));
  }
  return parts.join(",");
}

const CalibrationPreview = (props) => {
  const { onValue, route, imgDataURI, cornersCoordinates } = props;

  const [mapPreview, setMapPreview] = useState();

  useEffect(() => {
    const routeData = route || [];
    if (mapPreview) {
      mapPreview.off();
      mapPreview.remove();
      document.getElementById("mapPreview").innerHTML = "";
    }
    const tmpMapPreview = L.map("mapPreview", {
      zoomSnap: 0,
      scrollWheelZoom: false,
      smoothWheelZoom: true,
    }).fitBounds(cornersCoordinates);
    const transformedImage = L.imageTransform(imgDataURI, cornersCoordinates, {
      opacity: 0.7,
    });
    transformedImage.addTo(tmpMapPreview);
    const latlngs = routeData.map((pt) => [pt.latLon[0], pt.latLon[1]]);
    L.polyline(latlngs, { color: "red" }).addTo(tmpMapPreview);

    const baseLayers = {};
    const defaultLayer = new L.TileLayer["osm"]();
    baseLayers["Open Street Map"] = defaultLayer;
    baseLayers["Google Map Street"] = new L.TileLayer["gmap-street"]();
    baseLayers["Google Map Satellite"] = new L.TileLayer["gmap-hybrid"]();
    baseLayers["Mapant Finland"] = new L.TileLayer["mapant-fi"]();
    baseLayers["Mapant Norway"] = new L.TileLayer["mapant-no"]();
    baseLayers["Mapant Spain"] = L.TileLayer["mapant-es"];
    baseLayers["Topo Finland"] = new L.TileLayer["finland-topo"]();
    baseLayers["Topo Norway"] = new L.TileLayer["norway-topo"]();
    baseLayers["Topo World (OpenTopo)"] = new L.TileLayer["world-topo"]();
    baseLayers["Topo World (ArcGIS)"] = new L.TileLayer["world-topo-alt"]();

    tmpMapPreview.addLayer(defaultLayer);
    tmpMapPreview.addControl(
      new L.Control.Layers(baseLayers, { Map: transformedImage })
    );
    setMapPreview(tmpMapPreview);
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <div>
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info" role="alert">
              <span id="help_text">
                Check that your map is well aligned with the world map.
              </span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div id="mapPreview" className="leaflet_map"></div>
          </div>
        </div>
        <div className="row" style={{ marginTop: "10px" }}>
          <div className="col-md-12">
            <button
              className="btn btn-danger"
              onClick={() => {
                onValue(false);
              }}
            >
              <i className="fas fa-undo"></i> Back
            </button>
            &nbsp;
            <button
              className="btn btn-primary"
              onClick={() => onValue(getCalibrationString(cornersCoordinates))}
              data-testid="validate-button"
            >
              <i className="fas fa-arrow-alt-circle-right"></i> Validate
              Calibration
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CalibrationPreview;
