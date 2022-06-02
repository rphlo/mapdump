import React from "react";
import NotFound from "./NotFound";
import RouteViewing from "./RouteViewing";
import RouteReplay from "./RouteReplay";

const RasterMap = ({ match, history }) => {
  const [found, setFound] = React.useState(null);
  const [data, setData] = React.useState();
  const [showPlayer, setShowPlayer] = React.useState(false);

  const transformMapBounds = (v) => {
    return {
      top_left: {
        lat: parseFloat(v.top_left[0]),
        lon: parseFloat(v.top_left[1]),
      },
      top_right: {
        lat: parseFloat(v.top_right[0]),
        lon: parseFloat(v.top_right[1]),
      },
      bottom_right: {
        lat: parseFloat(v.bottom_right[0]),
        lon: parseFloat(v.bottom_right[1]),
      },
      bottom_left: {
        lat: parseFloat(v.bottom_left[0]),
        lon: parseFloat(v.bottom_left[1]),
      },
    };
  };
  const transformRoute = (v) => {
    return v.map((p) => {
      return { time: p.time * 1e3, latLon: p.latlon.slice() };
    });
  };

  React.useEffect(() => {
    (async () => {
      const res = await fetch(
        process.env.REACT_APP_API_URL + "/v1/route/" + match.params.uid
      );
      if (res.status === 200) {
        const rawData = await res.json();
        setData({
          id: rawData.id,
          athlete: rawData.athlete,
          tz: rawData.tz,
          startTime: rawData.start_time,
          modificationDate: +new Date(rawData.modification_date),
          country: rawData.country,
          mapCornersCoords: transformMapBounds(rawData.map_bounds),
          mapDataURL: rawData.map_url,
          gpx: rawData.gpx_url,
          name: rawData.name,
          route: transformRoute(rawData.route_data),
          distance: rawData.distance,
          duration: rawData.duration,
          comment: rawData.comment,
          mapSize: rawData.map_size,
        });
        setFound(true);
      } else if (res.status === 404) {
        setFound(false);
      }
    })();
  }, [match.params.uid]);

  const togglePlayer = () => {
    setShowPlayer(!showPlayer);
  };

  const getComponent = () => {
    const props = {
      history,
      onReset: null,
      togglePlayer,
      ...data,
    };
    if (showPlayer) {
      return <RouteReplay {...props} />;
    }
    return <RouteViewing {...props} />;
  };

  return (
    <>
      {found && data && getComponent()}
      {found !== false && !data && (
        <h2>
          <i className="fa fa-spin fa-spinner"></i> Loading...
        </h2>
      )}
      {found === false && <NotFound />}
    </>
  );
};

export default RasterMap;
