
if(typeof(DOMParser) == 'undefined') {
  function DOMParser() {};
  DOMParser.prototype.parseFromString = function(str, contentType) {
    if(typeof(XMLHttpRequest) != 'undefined') {
      var xmldata = new XMLHttpRequest();
      if(!contentType) {
        contentType = 'application/xml';
      }
      xmldata.open('GET', 'data:' + contentType + ';charset=utf-8,' + encodeURIComponent(str), false);
      if(xmldata.overrideMimeType) {
        xmldata.overrideMimeType(contentType);
      }
      xmldata.send(null);
      return xmldata.responseXML;
    }
  }
}

const parseGpx = (xmlstr) => {
  var doc = new DOMParser().parseFromString(xmlstr, "text/xml");
  return getGpxData(doc.documentElement);
}

const getGpxData = (node, result) => {
  if(!result) {
    result = { segments: [] };
  }
  switch(node.nodeName) {
    case 'name':
      result.name = node.textContent;
      break;
    case 'trkseg':
      var segment = [];
      result.segments.push(segment)
      for(let i = 0; i < node.childNodes.length; i++) {
        var snode = node.childNodes[i];
        if(snode.nodeName === 'trkpt') {
          var trkpt = { loc: [ parseFloat(snode.attributes['lat'].value), parseFloat(snode.attributes['lon'].value) ] };
          for(var j=0; j < snode.childNodes.length; j++) {
            var ssnode = snode.childNodes[j];
            switch(ssnode.nodeName) {
              case 'time':
                trkpt.time = new Date(ssnode.childNodes[0].data);
                break;
              case 'ele':
                trkpt.ele = parseFloat(ssnode.childNodes[0].data);
                break;
              default:
                break;
            }
          }
          segment.push(trkpt)
        }
      }
      break;
    default:
      break;
  }
  for(let i = 0; i < node.childNodes.length; i++) {
    getGpxData(node.childNodes[i], result);
  }
  return result;
}

const extractCornersCoordsFromFilename = (filename) => {
  const re = /(_\d+\.\d+){8}_\.(gif|png|jpg|jpeg)$/ig;
  const found = filename.match(re);
  if(!found) {
      return false
  } else {
    const coords = found[0].split('_');
    coords.pop();
    coords.shift();
    return coords.join(',');
  }
}

const validateCornersCoords = (coords) => {
  const parts = coords.split(',');
  if (parts.length !== 8) {
      return false;
  }
  return parts.findIndex(part => isNaN(parseFloat(part))) === -1;
}

module.exports = {
  parseGpx,
  extractCornersCoordsFromFilename,
  validateCornersCoords
}