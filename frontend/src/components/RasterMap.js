import React from 'react'
import RouteViewing from './RouteViewing'
import RouteReplay from './RouteReplay'

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
        const res = await fetch(process.env.REACT_APP_API_URL + '/v1/route/' + match.params.uid)
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
            gpx: rawData.gpx_url,
            name: rawData.name,
            route: transformRoute(rawData.route_data),
            distance: rawData.distance,
            duration: rawData.duration,
            comment: rawData.comment,
          })
          setFound(true)
        } else if(res.status === 404) {
          setFound(false)
        }
      })()
    }, [match.params.uid])
  
    const getComponent = () => {
      const props = {
        athlete: data.athlete,
        history,
        id: data.id,
        route: data.route,
        startTime: data.startTime,
        tz: data.tz,
        country: data.country,
        mapCornersCoords: data.mapBounds,
        mapDataURL: data.mapImage,
        gpx: data.gpx,
        onReset: null,
        name: data.name,
        duration: data.duration,
        distance: data.distance,
        comment: data.comment,
      }
      if(match.path.slice(-6) === 'player') {
        return <RouteReplay {...props}/>
      }
      return <RouteViewing {...props} />
    }
    return (
    <div>
      { found && data && getComponent() }
      { found !== false && !data && <h2><i className="fa fa-spin fa-spinner"></i> Loading...</h2>}
      { found === false && <h2>Not found</h2> }
    </div>
    );
  }

  export default RasterMap