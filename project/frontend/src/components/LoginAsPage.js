import React from "react";
import useGlobalState from "../utils/useGlobalState";

const LoginAsPage = (props) => {
  const globalState = useGlobalState();

  React.useEffect(() => {
    (async () => {
      const qs = new URLSearchParams(window.location.search);
      const api_token = qs.get("token");
      if (api_token) {
        console.log(api_token);
        const res = await fetch(
          process.env.REACT_APP_API_URL + "/v1/auth/user/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Token " + api_token,
            },
          }
        );
        if (res.status === 200) {
          const json = await res.json();
          globalState.setUser({ username: json.username, api_token });
        } else {
          globalState.setUser(null);
        }
        props.history.push("/");
      }
    })();
  }, [props.history, globalState]);

  return <div className="container main-container">Please wait...</div>;
};

export default LoginAsPage;
