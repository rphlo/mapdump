import { Point, LatLon, cornerCalTransform, cornerBackTransform } from './Utils';


const extractSpeed = (route) => {
  const speeds = [];
  let prevSpeed = 1;
  //const data = [];
  for (let i = 0; i < route.length; i++) {
    const minIdx = Math.max(i - 10, 0);
    const maxIdx = Math.min(minIdx + 10, route.length);
    const partial = route.slice(minIdx, maxIdx);
    let d = 0;
    for(let j=0; j < partial.length - 1; j++) {
      const a = new LatLon(partial[j].latLon[0], partial[j].latLon[1]);
      const b = new LatLon(partial[j+1].latLon[0], partial[j+1].latLon[1]);
      d += a.distance(b);
    }
    let speed = d/(route[maxIdx].time - route[minIdx].time)*3600;
    if (isNaN(speed)) {
      speed = prevSpeed;
    }
    speeds.push(speed);
    prevSpeed = speed;
    //data.push([route[i].latLon[0], route[i].latLon[1]]);
  }
  return speeds; //[speeds, data];
};
const extractDistance = (route) => {
  let d = 0;
  for (let i = 0; i < route.length-1; i++) {
    const a = new LatLon(route[i].latLon[0], route[i].latLon[1]);
    const b = new LatLon(route[i+1].latLon[0], route[i+1].latLon[1]);
    d += a.distance(b);
  }
  return d;
};

const extractBounds = function(img, corners_coords, route) {
  const transform = cornerCalTransform(
    img.width,
    img.height,
    corners_coords.top_left,
    corners_coords.top_right,
    corners_coords.bottom_right,
    corners_coords.bottom_left
  );
  let minX = 0;
  let maxX = img.width;
  let minY = 0;
  let maxY = img.height;
  for(let i = 0; i < route.length; i++) {
    const pt = transform(new LatLon(route[i].latLon[0], route[i].latLon[1]));
    minX = pt.x < minX ? pt.x : minX;
    maxX = pt.x > maxX ? pt.x : maxX;
    minY = pt.y < minY ? pt.y : minY;
    maxY = pt.y > maxY ? pt.y : maxY;
  }
  return {
    minX: Math.floor(minX),
    maxX: Math.ceil(maxX),
    minY: Math.floor(minY),
    maxY: Math.ceil(maxY)
  }
};
export const getCorners = function(img, corners_coords, route, includeHeader=false) {
  const bounds = extractBounds(img, corners_coords, route);
  const transform = cornerBackTransform(
    img.width,
    img.height,
    corners_coords.top_left,
    corners_coords.top_right,
    corners_coords.bottom_right,
    corners_coords.bottom_left
  );
  if (includeHeader) {
    bounds.minY -= 70;
  }
  return {
    top_left: transform(new Point(bounds.minX, bounds.minY)),
    top_right: transform(new Point(bounds.maxX, bounds.minY)),
    bottom_right: transform(new Point(bounds.maxX, bounds.maxY)),
    bottom_left: transform(new Point(bounds.minX, bounds.maxY))
  }
}

export const drawOriginalMap = function(img, includeHeader) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width  = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  if (includeHeader) {
    const headerHeight = 70;
    const canvas3 = document.createElement('canvas');
    canvas3.width  = canvas.width;
    canvas3.height = canvas.height + headerHeight;
    

    const ctx3 = canvas3.getContext('2d');
    ctx3.drawImage(canvas, 0, headerHeight)
    // draw a background
    ctx3.fillStyle = '#222';
    ctx3.fillRect(0, 0, canvas3.width, headerHeight);
    return canvas3
  }
  return canvas;
};

export const drawRoute = (img, corners_coords, route, includeHeader=false, includeRoute=true) => {
  const bounds = extractBounds(img, corners_coords, route);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width  = bounds.maxX - bounds.minX;
  canvas.height = bounds.maxY - bounds.minY;
  // draw a background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(img, -bounds.minX, -bounds.minY, img.width, img.height);

  const outlineWidth = 3;
  const weight = 3;

  const speeds = extractSpeed(route);

  let minSpeed = null;
  let maxSpeed = null;
  if (speeds.length){
    const sumSpeeds = speeds.reduce((a, b) => a + b, 0);
    const avgSpeed = sumSpeeds / speeds.length
    const sumVariance = speeds.reduce((a, b) => a + (b - avgSpeed) ** 2, 0)
    const standardDev = Math.sqrt(sumVariance / speeds.length)
    minSpeed = avgSpeed - standardDev;
    maxSpeed = avgSpeed + standardDev;
  }

  const palette = (function (initPalette) {
    const pCanvas = document.createElement('canvas'),
      pCtx = pCanvas.getContext('2d'),
      gradient = pCtx.createLinearGradient(0, 0, 0, 256);

    pCanvas.width = 1;
    pCanvas.height = 256;

    for (let i in initPalette) {
      gradient.addColorStop(i, initPalette[i]);
    }

    pCtx.fillStyle = gradient;
    pCtx.fillRect(0, 0, 1, 256);
    return pCtx.getImageData(0, 0, 1, 256).data;
  })({
    0.0: '#ff0000',
    0.5: '#ffff00',
    1.0: '#008800'
  });

  const getRGBForPercent = function (valueRelative) {
    const paletteIndex = Math.min(Math.floor(valueRelative * 256) * 4, palette.length - 4);

    return [
        palette[paletteIndex],
        palette[paletteIndex + 1],
        palette[paletteIndex + 2]
    ];
  };

  const getRGBForValue = function (value) {
    let valueRelative = Math.min(Math.max((value - minSpeed) / (maxSpeed - minSpeed), 0), 0.999);
    if(isNaN(valueRelative)) {
      valueRelative = 0;
    }
    return getRGBForPercent(valueRelative);
  };

  if (includeRoute) {
    const canvas2 = document.createElement('canvas');
    canvas2.width  = canvas.width;
    canvas2.height = canvas.height;
    
    const ctx2 = canvas2.getContext('2d');
    const transform = cornerCalTransform(
      img.width,
      img.height,
      corners_coords.top_left,
      corners_coords.top_right,
      corners_coords.bottom_right,
      corners_coords.bottom_left
    );

    // drawOutline
    ctx2.lineWidth = weight + 2 * outlineWidth;
    ctx2.strokeStyle = 'black';
    ctx2.beginPath();
    for(let i=0; i < route.length; i++) {
      const pt = transform(new LatLon(route[i].latLon[0], route[i].latLon[1]));
      ctx2.lineTo(pt.x - bounds.minX, pt.y - bounds.minY);
    }
    ctx2.stroke();

      // drawColoredPath
    for (let j = 1; j < route.length; j++) {
      const pointStart = transform(new LatLon(route[j-1].latLon[0], route[j-1].latLon[1]));
      const pointEnd = transform(new LatLon(route[j].latLon[0], route[j].latLon[1]));

      // Create a gradient for each segment, pick start end end colors from palette gradient
      const gradient = ctx2.createLinearGradient(
          pointStart.x - bounds.minX,
          pointStart.y - bounds.minY,
          pointEnd.x - bounds.minX,
          pointEnd.y - bounds.minY
      );
      const gradientStartRGB = getRGBForValue(speeds[j-1]);
      const gradientEndRGB = getRGBForValue(speeds[j]);
      gradient.addColorStop(0, 'rgb(' + gradientStartRGB.join(',') + ')');
      gradient.addColorStop(1, 'rgb(' + gradientEndRGB.join(',') + ')');

      ctx2.lineWidth = weight;
      ctx2.strokeStyle = gradient;
      ctx2.beginPath();
      ctx2.moveTo(pointStart.x - bounds.minX, pointStart.y - bounds.minY);
      ctx2.lineTo(pointEnd.x - bounds.minX, pointEnd.y - bounds.minY);
      ctx2.stroke();

    }

    ctx.globalAlpha = 0.45;
    ctx.drawImage(canvas2, 0, 0);
  }
  if (includeHeader) {
    const headerHeight = 70;
    const paletteWidth = 180;
    const paletteX = 40;
    const paletteY = 30
    const lineWidth = 16;
    const canvas3 = document.createElement('canvas');
    canvas3.width  = canvas.width;
    canvas3.height = canvas.height + headerHeight;
    

    const ctx3 = canvas3.getContext('2d');
    ctx3.drawImage(canvas, 0, headerHeight)
    // draw a background
    ctx3.fillStyle = '#222';
    ctx3.fillRect(0, 0, canvas3.width, headerHeight);
    
    ctx3.font = '10px Arial';
    ctx3.fillStyle = 'white';
    if (includeRoute && route.length && route[0].time) {
      const gradient = ctx3.createLinearGradient(paletteX, 0, paletteWidth + paletteX, 0);
      gradient.addColorStop(0, 'rgb(' + getRGBForPercent(0).join(',') + ')');
      gradient.addColorStop(0.5, 'rgb(' + getRGBForPercent(0.5).join(',') + ')');
      gradient.addColorStop(1, 'rgb(' + getRGBForPercent(1).join(',') + ')');

      ctx3.lineWidth = 16;
      ctx3.strokeStyle = gradient;
      ctx3.beginPath();
      ctx3.moveTo(paletteX, paletteY);
      ctx3.lineTo(paletteX + paletteWidth, paletteY);
      ctx3.stroke();

      ctx3.lineWidth = 1;
      ctx3.strokeStyle = '#222'
      ctx3.beginPath();
      ctx3.moveTo(paletteX + paletteWidth / 2, paletteY - lineWidth / 2);
      ctx3.lineTo(paletteX + paletteWidth / 2, paletteY + lineWidth / 2);
      ctx3.stroke();


      const minSpeedTxt = getSpeedText(minSpeed);
      const medSpeedTxt = getSpeedText((maxSpeed + minSpeed)/2);
      const maxSpeedTxt = getSpeedText(maxSpeed);
      
      ctx3.textAlign = 'center';
      ctx3.fillText(minSpeedTxt, paletteX, paletteY + lineWidth / 2 + 12);
      ctx3.fillText(medSpeedTxt, paletteX + paletteWidth/2, paletteY + lineWidth / 2 + 12);
      ctx3.fillText(maxSpeedTxt, paletteX + paletteWidth, paletteY + lineWidth / 2 + 12);
    }
    ctx3.textAlign = 'left';
    if (includeRoute && route.length && route[0].time) {
      const dist = extractDistance(route);
      ctx3.fillText(`${(dist/1e3).toFixed(3)}km`, paletteX + paletteWidth + 30, paletteY - 5);
      ctx3.fillText(printTime(route[route.length-1].time-route[0].time), paletteX + paletteWidth + 100, paletteY - 5);
      ctx3.fillText(`${(new Date(route[0].time))}`, paletteX + paletteWidth + 30, paletteY + 15);
    }
    ctx3.fillText('https://drawmyroute.com', canvas.width - 120, headerHeight - 5);
    return canvas3;
  }
  return canvas;
};

const getSpeedText = (s) => {
  return `${s.toFixed(2)}km/h`;
}

export const printTime = (t) => {
  var date = new Date(null);
  date.setSeconds(t/1e3);
  const iso = date.toISOString().substr(11, 8);
  const h = parseInt(iso.slice(0, 2))
  const hasH = h > 0
  const hPart = hasH ? (h + 'h') : ''
  const m = parseInt(iso.slice(3, 5))
  const hasM = hasH || m > 0
  let mPart = hasM ? (m + 'm') : ''
  if (hasH) {
    mPart = mPart.padStart(3, '0')
  }
  const s = parseInt(iso.slice(6, 8))
  const hasS = hasM || s > 0
  let sPart = hasS? (s + 's') : ''
  if (hasM) {
    sPart = sPart.padStart(3, '0')
  }
  return hPart + mPart + sPart
}
