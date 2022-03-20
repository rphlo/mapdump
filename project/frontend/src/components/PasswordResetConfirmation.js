import React from "react";
import useGlobalState from "../utils/useGlobalState";
import Swal from "sweetalert2";

const Register = (props) => {
  const globalState = useGlobalState();
  const { username } = globalState.user;
  const [pass, setPass] = React.useState();
  const [pass2, setPass2] = React.useState();
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    if (username) {
      props.history.push("/");
    }
  }, [username, props]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const [uid, token] = props.match.params.key.split(":");
    const res = await fetch(
      process.env.REACT_APP_API_URL + "/v1/auth/password/reset/confirm/",
      {
        method: "POST",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_password1: pass,
          new_password2: pass2,
          uid,
          token,
        }),
      }
    );
    if (res.status === 400) {
      const data = await res.json();
      setErrors(data);
    } else if (res.status === 200) {
      await Swal.fire({
        title: "Success!",
        text: "Password Reset Done!",
        icon: "success",
        confirmButtonText: "OK",
      });
      props.history.push("/");
    }
  };
  return (
    <div className="container main-container">
      <h1>
        <i className="fas fa-key"></i> Reset Password
      </h1>
      <hr />
      {errors.token && (
        <div className="alert alert-danger" role="alert">
          Invalid token.
        </div>
      )}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="password">
            <i className="fas fa-key"></i> New Password
          </label>
          <input
            onChange={(e) => {
              setPass(e.target.value);
            }}
            type="password"
            className={
              "form-control" + (errors.new_password1 ? " is-invalid" : "")
            }
            id="password"
            name="password"
            placeholder="Password"
          />
          {errors.new_password1 && (
            <div className="invalid-feedback">{errors.new_password1}</div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="passwordRepeat">
            <i className="fas fa-key"></i> New Password Confirmation
          </label>
          <input
            onChange={(e) => {
              setPass2(e.target.value);
            }}
            type="password"
            className={
              "form-control" + (errors.new_password2 ? " is-invalid" : "")
            }
            id="passwordRepeat"
            name="passwordRepeat"
            placeholder="Password Confirmation"
          />
          {errors.new_password2 && (
            <div className="invalid-feedback">{errors.new_password2}</div>
          )}
        </div>
        <button type="submit" className="btn btn-primary">
          <i className="fas fa-paper-plane"></i> Reset password
        </button>
      </form>
    </div>
  );
};

export default Register;
