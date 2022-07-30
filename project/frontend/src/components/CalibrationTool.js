import React, { useEffect, useState } from "react";
import * as L from "leaflet";
import CalibrationPreview from "./CalibrationPreview";
import "../utils/Leaflet.SmoothWheelZoom";
import "../utils/Leaflet.ImageTransform";

const resetOrientation = (src, callback) => {
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function() {
        const width = img.width,
            height = img.height,
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0);
        callback(canvas.toDataURL('image/png'), width, height);
    }
    img.src = src;
}

const iconScale = (L.Browser.mobile ? 2 : 1)

const colorIcon = (color) =>{
    return new L.Icon({
        iconUrl: '/static/vendor/leaflet-color-markers-1.0.0/img/marker-icon-2x-' + color + '.png',
        shadowUrl: '/static/vendor/leaflet-1.7.1/images/marker-shadow.png',
        iconSize: [25 * iconScale, 41 * iconScale],
        iconAnchor: [12 * iconScale, 41 * iconScale],
        popupAnchor: [1 * iconScale, -34 * iconScale],
        shadowSize: [41 * iconScale, 41 * iconScale]
    })
}

const icons = [
    colorIcon('blue'),
    colorIcon('red'),
    colorIcon('green'),
    colorIcon('orange')
];

L.TileLayer.Common = L.TileLayer.extend({initialize: function(options){L.TileLayer.prototype.initialize.call(this, this.url, options);}});
L.TileLayer['osm'] = L.TileLayer.Common.extend({url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', options:{attribution: '\u0026copy\u003B \u003Ca href\u003D\u0022http://openstreetmap.org\u0022\u003EOpenStreetMap\u003C/a\u003E contributors, \u003Ca href\u003D\u0022http://creativecommons.org/licenses/by\u002Dsa/2.0/\u0022\u003ECC\u002DBY\u002DSA\u003C/a\u003E'}});
L.TileLayer['gmap-street'] = L.TileLayer.Common.extend({url: 'https://mt0.google.com/vt/x\u003D{x}\u0026y\u003D{y}\u0026z\u003D{z}', options:{attribution: '\u0026copy\u003B Google'}});
L.TileLayer['gmap-hybrid'] = L.TileLayer.Common.extend({url: 'https://mt0.google.com/vt/lyrs\u003Dy\u0026hl\u003Den\u0026x\u003D{x}\u0026y\u003D{y}\u0026z\u003D{z}', options:{attribution: '\u0026copy\u003B Google'}});
L.TileLayer['finland-topo'] = L.TileLayer.Common.extend({url: 'https://tiles.kartat.kapsi.fi/peruskartta/{z}/{x}/{y}.jpg', options:{attribution: '\u0026copy\u003B National Land Survey of Finland'}});
L.TileLayer['mapant-fi'] = L.TileLayer.Common.extend({url: 'https://wmts.mapant.fi/wmts_EPSG3857.php?z\u003D{z}\u0026x\u003D{x}\u0026y\u003D{y}', options:{attribution: 'MapAnt and National Land Survey of Finland'}});
L.TileLayer['norway-topo'] = L.TileLayer.Common.extend({url: 'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers\u003Dtopo4\u0026zoom\u003D{z}\u0026x\u003D{x}\u0026y\u003D{y}', options:{attribution: ''}});
L.TileLayer['mapant-no'] = L.TileLayer.Common.extend({url: 'https://mapant.no/osm-tiles/{z}/{x}/{y}.png', options:{attribution: 'MapAnt Norway'}});
L.TileLayer['mapant-es'] = L.tileLayer.wms('https://mapant.es/mapserv?map=/mapas/geotiff.map&SERVICE=WMS', {layers: 'geotiff', format: 'image/png', version: '1.3.0', transparent: true});
L.TileLayer["world-topo"] = L.TileLayer.Common.extend({url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", options: { attribution: "&copy; OpenTopoMap (CC-BY-SA)" }});
L.TileLayer["world-topo-alt"] = L.TileLayer.Common.extend({url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", options: { attribution: "&copy; ArcGIS Online" }});


const SpheroidProjection = (() => {
  const p = "prototype",
        m = Math,
        pi = m.PI,
        _180 = 180.0,
        rad = 6378137,
        pi_180 = pi/_180;
  const S = function(){
  };
  S[p].latlngToMeters = (latlng) => {
      return {x: latlng.lng * rad * pi_180, y: m.log(m.tan((90 + latlng.lat) * pi_180 / 2)) * rad};
  };
  S[p].metersToLatlng = (mxy) => {
      return {lat: (2 * m.atan(m.exp(mxy.y / rad)) - pi / 2) / pi_180, lng: mxy.x / rad / pi_180};
  };
  return S;
})();
function adj(m) { // Compute the adjugate of m
  return [
      m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
      m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
      m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]
  ];
}
function multmm(a, b) { // multiply two matrices
  var c = Array(9);
  for (var i = 0; i !== 3; ++i) {
      for (var j = 0; j !== 3; ++j) {
          var cij = 0;
          for (var k = 0; k !== 3; ++k) {
              cij += a[3 * i + k] * b[3 * k + j];
          }
          c[3 * i + j] = cij;
      }
  }
  return c;
}
function multmv(m, v) { // multiply matrix and vector
  return [
      m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
      m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
      m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
  ];
}
function basisToPoints(x1, y1, x2, y2, x3, y3, x4, y4) {
  var m = [
      x1, x2, x3,
      y1, y2, y3,
      1,  1,  1
  ];
  var v = multmv(adj(m), [x4, y4, 1]);
  return multmm(m, [
      v[0], 0, 0,
      0, v[1], 0,
      0, 0, v[2]
  ]);
}
function general2DProjection(
  x1s, y1s, x1d, y1d,
  x2s, y2s, x2d, y2d,
  x3s, y3s, x3d, y3d,
  x4s, y4s, x4d, y4d
) {
  var s = basisToPoints(x1s, y1s, x2s, y2s, x3s, y3s, x4s, y4s);
  var d = basisToPoints(x1d, y1d, x2d, y2d, x3d, y3d, x4d, y4d);
  return multmm(d, adj(s));
}
function project(m, x, y) {
  var v = multmv(m, [x, y, 1]);
  return [v[0] / v[2], v[1] / v[2]];
}

const CalibrationTool = (props) => {
  const { onValue, route, mapDataURL } = props;

  const [mapWorld, setMapWorld] = useState()
  const [mapRaster, setMapRaster] = useState()
  const [markersWorld, setMarkersWorld] = useState([])
  const [markersRaster, setMarkersRaster] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [imgDataURI, setImgDataURI] = useState(null)
  const [imgWidth, setImgWidth] = useState(0)
  const [imgHeight, setImgHeight] = useState(0)

  function getCornerCoordinates(){
    const xyA = [];
    const xyB = [];
    const proj = new SpheroidProjection();
    for(let i=0; i< markersRaster.length; i++){
        xyA[i] = mapRaster.project(markersRaster[i].getLatLng(), 0)
    }
    for(let i=0; i< markersWorld.length; i++){
        xyB[i] = proj.latlngToMeters(markersWorld[i].getLatLng())
    }
    const matrix3d = general2DProjection(
      xyA[0].x, xyA[0].y, xyB[0].x, xyB[0].y,
      xyA[1].x, xyA[1].y, xyB[1].x, xyB[1].y,
      xyA[2].x, xyA[2].y, xyB[2].x, xyB[2].y,
      xyA[3].x, xyA[3].y, xyB[3].x, xyB[3].y,
    );
    const corners = [
        project(matrix3d, 0, 0),
        project(matrix3d, imgWidth, 0),
        project(matrix3d, imgWidth, imgHeight),
        project(matrix3d, 0, imgHeight)
    ];
    const cornersLatlng = []
    for(let i=0; i< corners.length; i++){
        cornersLatlng[i] = proj.metersToLatlng({x: corners[i][0], y: corners[i][1]})
    }
    return cornersLatlng;
  }

  useEffect(() => {
    if (markersRaster.length === 4 && markersWorld.length === 4) {
      setIsReady(true)
    } else {
      setIsReady(false)
    }
  }, [markersRaster, markersWorld])

  const onClickRaster = (e) => {
    if(markersRaster.length < 4){
      const marker = L.marker(mapRaster.unproject(mapRaster.project(e.latlng, 0), 0), {icon: icons[markersRaster.length], draggable:'true'}).addTo(mapRaster);
      setMarkersRaster([...markersRaster, marker])
    }
  }

  useEffect(() => {
    if (mapRaster) {
      mapRaster.off('click')
      mapRaster.on('click', onClickRaster)
    }
    // eslint-disable-next-line
  }, [mapRaster, markersRaster])

  const onClickWorld = (e) => {
    if(markersWorld.length < 4){
      const marker = L.marker(e.latlng, {icon: icons[markersWorld.length], draggable:'true'}).addTo(mapWorld);
      setMarkersWorld([...markersWorld, marker])
    }
  }

  useEffect(() => {
    if (mapWorld) {
      mapWorld.off('click')
      mapWorld.on('click', onClickWorld)
    }
    // eslint-disable-next-line
  }, [mapWorld, markersWorld]);

  useEffect(() => {
    resetOrientation(
        mapDataURL,
        function(imgDataURI, width, height) {
            setImgDataURI(imgDataURI)
            setImgWidth(width)
            setImgHeight(height)
            const tmpMapRaster = L.map('mapRaster', {
                crs: L.CRS.Simple,
                minZoom: -5,
                maxZoom:2,
                zoomSnap: 0,
                scrollWheelZoom: false,
                smoothWheelZoom: true,
            });
            const boundsRaster = [tmpMapRaster.unproject([0,0]), tmpMapRaster.unproject([width, height])];
            L.imageOverlay(imgDataURI, boundsRaster).addTo(tmpMapRaster);
            tmpMapRaster.fitBounds(boundsRaster);
            setMapRaster(tmpMapRaster);
        }
    );
    // display world map;
    const routeData = route || [];
    const tmpMapWorld = L.map('mapWorld', {
      zoomSnap: 0,
      scrollWheelZoom: false,
      smoothWheelZoom: true,
    });
    const latlngs = routeData.map(pt => [pt.latLon[0], pt.latLon[1]]);
    const polyline = L.polyline(latlngs, {color: 'red'}).addTo(tmpMapWorld);
    if (routeData.length > 1) {
        tmpMapWorld.fitBounds(polyline.getBounds());
    } else {
        tmpMapWorld.setView([0, 0], 2)
    }

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

    tmpMapWorld.addLayer(defaultLayer);
    tmpMapWorld.addControl(new L.Control.Layers(baseLayers))
    setMapWorld(tmpMapWorld);
    // eslint-disable-next-line
  }, [])

  return (
      <>
        <div style={{display: previewOpen ? "none" : "block"}}>
            <div className="row">
                <div className="col-md-12">
                    <div className="alert alert-info" role="alert">
                        <span id="help_text">Indicate the location of 4 distincts references points both on your map and on the world map.</span>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <div id="mapRaster" className="leaflet_map"></div>
                    <button className="btn btn-danger" onClick={() => {for(let i=0; i< markersRaster.length; i++){markersRaster[i].remove();};setMarkersRaster([]);}}>Delete Your Map Reference Points</button>
                </div>
                <div className="col-md-6">
                    <div id="mapWorld" className="leaflet_map"></div>
                    <button className="btn btn-danger" onClick={() => {for(let i=0; i< markersWorld.length; i++){markersWorld[i].remove();};setMarkersWorld([]);}}>Delete World Map Reference Points</button>
                </div>
            </div>
            <div className="row" style={{marginTop: "10px"}}>
                <div className="col-md-12">
                <button className="btn btn-danger" onClick={() => {onValue(null)}}><i className="fas fa-undo"></i> Back</button>&nbsp;
                <button className="btn btn-primary" disabled={!isReady} onClick={() => setPreviewOpen(true)}><i className="fas fa-arrow-alt-circle-right"></i> Test Calibration</button>
                </div>
            </div>
        </div>
        { previewOpen && (
          <CalibrationPreview imgDataURI={imgDataURI} cornersCoordinates={getCornerCoordinates()} route={route} onValue={(v) => {if(v) {onValue(v)};setPreviewOpen(false)}}></CalibrationPreview>
        )}
    </>
  );
};

export default CalibrationTool;
