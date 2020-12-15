const fs = require('fs');
const {loadImage} = require('canvas');
const {drawRoute} = require('./drawHelpers');

const [imgFile, routeFile, cornersJSON, type, tz] = process.argv.slice(2);

const routeJSON = fs.readFileSync(routeFile, {encoding:'utf8', flag:'r'});
const routeRaw = JSON.parse(routeJSON);
const route = routeRaw.map(p=>{return {time: p.time*1e3, latLon: p.latlon}})
const cornersRaw = JSON.parse(cornersJSON);
const corners = {
    top_left: {lat: parseFloat(cornersRaw.top_left[0]), lon: parseFloat(cornersRaw.top_left[1])},
    top_right: {lat: parseFloat(cornersRaw.top_right[0]), lon: parseFloat(cornersRaw.top_right[1])},
    bottom_right: {lat: parseFloat(cornersRaw.bottom_right[0]), lon: parseFloat(cornersRaw.bottom_right[1])},
    bottom_left: {lat: parseFloat(cornersRaw.bottom_left[0]), lon: parseFloat(cornersRaw.bottom_left[1])},
}
const showHeader = type.includes('h');
const showRoute = type.includes('r');

(async (imageFile, route, corners, showHeader, showRoute, timezone) => {
    const img = await loadImage(imageFile);
    const canvas = await drawRoute(img, corners, route, showHeader, showRoute, timezone);
    console.log(canvas.toDataURL('image/jpeg', {quality: 0.4}));
})(imgFile, route, corners, showHeader, showRoute, tz);
