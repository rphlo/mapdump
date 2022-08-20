import React, { useEffect } from "react";
import * as L from "leaflet";
import "../utils/Leaflet.SmoothWheelZoom";

const BrowseMap = () => {
  const onClickLayer = (e, map, m) => {
    const point = e.latlng;
    const layers = [];
    map.eachLayer((layer) => {
      if (layer instanceof L.Polygon) {
        const bounds = layer.getBounds();
        if (bounds.contains(point)) {
          layers.push(layer);
        }
      }
    });
    e.target
      .bindPopup(
        layers
          .map((n) =>
            n.myData.routes
              .map(
                (r) =>
                  `<span><a href="/routes/${r.id}"><i class='fa fa-circle' style="color: ${n.options.color}"></i> ${r.name}</a></span>`
              )
              .join("<br/>")
          )
          .join("<br/>")
      )
      .openPopup();
  };
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };
  useEffect(() => {
    const map = L.map("map", {
      minZoom: 0,
      maxZoom: 18,
      zoomSnap: 0,
      scrollWheelZoom: false,
      smoothWheelZoom: true,
    });
    L.TileLayer.Common = L.TileLayer.extend({
      initialize: function (options) {
        L.TileLayer.prototype.initialize.call(this, this.url, options);
      },
    });
    const osmLayer = L.TileLayer.Common.extend({
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: {
        attribution:
          "\u0026copy\u003B \u003Ca href\u003D\u0022http://openstreetmap.org\u0022\u003EOpenStreetMap\u003C/a\u003E contributors, \u003Ca href\u003D\u0022http://creativecommons.org/licenses/by\u002Dsa/2.0/\u0022\u003ECC\u002DBY\u002DSA\u003C/a\u003E",
      },
    });
    map.addLayer(new osmLayer());
    const bounds = [L.latLng(-180, 60), L.latLng(180, -60)];
    map.fitBounds(bounds);
    map.invalidateSize();
    (async () => {
      const res = await fetch(process.env.REACT_APP_API_URL + "/v1/maps/");
      const loadedMaps = await res.json();
      loadedMaps.forEach((m) => {
        const bound = [
          m.bounds.top_left,
          m.bounds.top_right,
          m.bounds.bottom_right,
          m.bounds.bottom_left,
        ];
        const color = getRandomColor();
        const polygon = new L.Polygon(bound, { color });
        polygon.myData = m;
        polygon.on("click", (e) => {
          onClickLayer(e, map);
        });
        map.addLayer(polygon);
      });
    })();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="container-fluid" style={{ margin: "-23px 0 0 0", padding: "0"}}>
      <div
        id="map"
        style={{ margin: "0 0 -30em 0", padding: "0px", height: "calc(100vh - 276px)", width: "100%", borderTop: "1px solid #b4b4b4"}}
      ></div>
    </div>
  );
};

export default BrowseMap;
