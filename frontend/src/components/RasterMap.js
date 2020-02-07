import React from 'react'
import RouteViewing from './RouteViewing'

const pkg = require('../../package.json');

const RasterMap = ({match, history}) => {
    const [found, setFound] = React.useState(null)
    const [data, setData] = React.useState()
  
    const transformMapBounds = (v) => {
      return {
        top_left: {lat: parseFloat(v.top_left[0]), lon: parseFloat(v.top_left[1])},
        top_right: {lat: parseFloat(v.top_right[0]), lon: parseFloat(v.top_right[1])},
        bottom_right: {lat: parseFloat(v.bottom_right[0]), lon: parseFloat(v.bottom_right[1])},
        bottom_left: {lat: parseFloat(v.bottom_left[0]), lon: parseFloat(v.bottom_left[1])}
      }
    }
    const transformRoute = (v) => {
      return v.map(p=>{return {time: p.time*1e3, latLon: p.latlon.slice()}})
    }
  
    React.useEffect(()=> {
      (async ()=> {
        const res = await fetch(pkg.api_url + '/v1/route/' + match.params.uid)
        if(res.status === 200){
          const rawData = await res.json()
          setData({
            id: rawData.id,
            athlete: rawData.athlete,
            tz: rawData.tz,
            startTime: rawData.start_time,
            country: rawData.country,
            mapBounds: transformMapBounds(rawData.map_bounds),
            mapImage: rawData.map_image_url,
            name: rawData.name,
            route: transformRoute(rawData.route_data)
          })
          setFound(true)
        } else if(res.status === 404) {
          setFound(false)
        }
      })()
    }, [match])
  
    return (
    <div>
      { found && data &&   
        <>
          <RouteViewing
            athlete={data.athlete}
            history={history}
            id={data.id}
            route={data.route}
            startTime={data.startTime}
            tz= {data.tz}
            country={data.country}
            mapCornersCoords={data.mapBounds}
            mapDataURL={data.mapImage}
            onReset={null}
            name={data.name}
            />
        </>
      }
      { found === false && <h2>Not found</h2> }
    </div>
    );
  }

  export default RasterMap