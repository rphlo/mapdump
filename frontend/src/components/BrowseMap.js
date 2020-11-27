import React, { useEffect } from 'react'
import * as L from 'leaflet';
import '../utils/Leaflet.SmoothWheelZoom';
import '../utils/Leaflet.ImageTransform';

const RouteReplay = () => {

  const loadMap = (lmap, m, polygon) => {
    console.log(m)
    const bound = [m.bounds.top_left, m.bounds.top_right, m.bounds.bottom_right, m.bounds.bottom_left];
    const transformedImage = L.imageTransform(m.image_url, bound, {opacity: 0.7});
    polygon.remove();
    transformedImage.addTo(lmap);
  };

  useEffect(() => {   
    const map = L.map('map', {minZoom: 0, maxZoom:18, zoomSnap: 0, scrollWheelZoom: false, smoothWheelZoom: true});
    L.TileLayer.Common = L.TileLayer.extend({initialize: function(options){L.TileLayer.prototype.initialize.call(this, this.url, options);}});
    const osmLayer = L.TileLayer.Common.extend({url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', options:{attribution: '\u0026copy\u003B \u003Ca href\u003D\u0022http://openstreetmap.org\u0022\u003EOpenStreetMap\u003C/a\u003E contributors, \u003Ca href\u003D\u0022http://creativecommons.org/licenses/by\u002Dsa/2.0/\u0022\u003ECC\u002DBY\u002DSA\u003C/a\u003E'}});
    map.addLayer(new osmLayer())  
    const bounds = [L.latLng(-180, 60), L.latLng(180, -60)];
    map.fitBounds(bounds);
    map.invalidateSize();
    (async () => {
      const res = await fetch(process.env.REACT_APP_API_URL + '/v1/maps/');
      const loadedMaps = await res.json();
      loadedMaps.forEach((m) => {
        const bound = [m.bounds.top_left, m.bounds.top_right, m.bounds.bottom_right, m.bounds.bottom_left];
        const polygon = new L.Polygon(bound);
        polygon.on('click', () => {loadMap(map, m, polygon)})
        map.addLayer(polygon);
      })
    })();
  }, []);


  return (
    <div>
      <div id="map" style={{marginBottom:'5px', height: '500px', width: '100%'}}></div>
    </div>)
}

export default RouteReplay;
