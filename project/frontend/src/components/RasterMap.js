import React from "react";
import NotFound from "./NotFound";
import RouteViewing from "./RouteViewing";
import RouteReplay from "./RouteReplay";
import useGlobalState from "../utils/useGlobalState";
import { LatLng } from "../utils";

const RasterMap = ({ match, history }) => {
  const [found, setFound] = React.useState(null);
  const [data, setData] = React.useState();
  const [showPlayer, setShowPlayer] = React.useState(false);

  const globalState = useGlobalState();
  const { api_token } = globalState.user;

  const transformMapBounds = (v) => {
    return {
      top_left: new LatLng(
        parseFloat(v.top_left[0]),
        parseFloat(v.top_left[1])
      ),
      top_right: new LatLng(
        parseFloat(v.top_right[0]),
        parseFloat(v.top_right[1])
      ),
      bottom_right: new LatLng(
        parseFloat(v.bottom_right[0]),
        parseFloat(v.bottom_right[1])
      ),
      bottom_left: new LatLng(
        parseFloat(v.bottom_left[0]),
        parseFloat(v.bottom_left[1])
      ),
    };
  };

  const transformRoute = (v) => {
    return v.map((p) => {
      return { time: p.time * 1e3, latlng: p.latlon.slice() };
    });
  };

  React.useEffect(() => {
    (async () => {
      const headers = {};
      if (api_token) {
        headers.Authorization = "Token " + api_token;
      }
      const res = await fetch(
        process.env.REACT_APP_API_URL + "/v1/route/" + match.params.uid,
        {
          credentials: "omit",
          headers,
        }
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
          isPrivate: rawData.is_private,
        });
        setFound(true);
      } else if (res.status === 404) {
        setFound(false);
      }
    })();
  }, [match.params.uid, api_token]);

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
        <div className="container main-container">
          <h2>
            <i className="fa fa-spin fa-spinner"></i> Loading...
          </h2>
        </div>
      )}
      {found === false && <NotFound />}
    </>
  );
};

export default RasterMap;
