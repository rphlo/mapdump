import React from "react";
import useGlobalState from "../utils/useGlobalState";

const PasswordChange = (props) => {
  const globalState = useGlobalState();
  const { api_token } = globalState.user;
  const [changed, setChanged] = React.useState();
  const [oldPass, setOldPass] = React.useState();
  const [pass, setPass] = React.useState();
  const [pass2, setPass2] = React.useState();
  const [errors, setErrors] = React.useState({});

  const onSubmit = async (e) => {
    e.preventDefault();
    setChanged(false);

    const res = await fetch(
      process.env.REACT_APP_API_URL + "/v1/auth/password/change/",
      {
        method: "POST",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token " + api_token,
        },
        body: JSON.stringify({
          old_password: oldPass,
          new_password1: pass,
          new_password2: pass2,
        }),
      }
    );
    if (res.status === 400) {
      const data = await res.json();
      setErrors(data);
    } else if (res.status === 200) {
      setChanged(true);
      document.getElementById("password").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("newPasswordRepeat").value = "";
      setErrors({});
    }
  };
  return (
    <div>
      {
        <>
          <h3>
            <i className="fas fa-key"></i> Change Password
          </h3>
          <hr />
          {changed && (
            <div className="alert alert-success" role="alert">
              Success! Password Changed!
            </div>
          )}
          {errors.non_field_errors &&
            errors.non_field_errors.map((e) => (
              <div className="alert alert-danger" role="alert">
                {e}
              </div>
            ))}
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="oldPassword">
                <i className="fas fa-key"></i> Current Password
              </label>
              <input
                onChange={(e) => {
                  setOldPass(e.target.value);
                }}
                type="password"
                className={
                  "form-control" + (errors.old_password ? " is-invalid" : "")
                }
                id="password"
                name="password"
                placeholder="Current Password"
              />
              {errors.old_password && (
                <div className="invalid-feedback">{errors.old_password}</div>
              )}
            </div>
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
                id="newPassword"
                name="newPassword"
                placeholder="New Password"
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
                id="newPasswordRepeat"
                name="newPasswordRepeat"
                placeholder="New Password Confirmation"
              />
              {errors.new_password2 && (
                <div className="invalid-feedback">{errors.new_password2}</div>
              )}
            </div>
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-save"></i> Change Password
            </button>
          </form>
        </>
      }
    </div>
  );
};

export default PasswordChange;
