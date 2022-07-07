import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { DateTime } from "luxon";
import useGlobalState from "../utils/useGlobalState";
import { printTime, printPace } from "../utils/drawHelpers";
import { capitalizeFirstLetter, displayDate, regionNames } from "../utils/Utils";
import { LinkItUrl } from "react-linkify-it";

const RouteHeader = (props) => {
  const [name, setName] = useState();
  const [comment, setComment] = useState();
  const [nameEditing, setNameEditing] = useState(false);
  const [commentEditing, setCommentEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = React.useRef(null);
  const commentInputRef = React.useRef(null);
  const globalState = useGlobalState();
  const { username, api_token } = globalState.user;

  useEffect(() => {
    setName(props.name);
  }, [props.name]);

  useEffect(() => {
    setComment(props.comment);
  }, [props.comment]);

  const enableNameEditing = (ev) => {
    ev.preventDefault();
    if (canEdit()) {
      setNameEditing(true);
    }
  };

  const enableCommentEditing = (ev) => {
    ev.preventDefault();
    if (canEdit()) {
      setCommentEditing(true);
    }
  };

  useEffect(() => {
    if (nameEditing) {
      inputRef.current.focus();
    }
  }, [nameEditing]);

  useEffect(() => {
    if (commentEditing) {
      commentInputRef.current.focus();
    }
  }, [commentEditing]);

  const saveName = async (e) => {
    setNameEditing(false);
    if (e.target.value !== name) {
      await putName(e.target.value);
    }
  };

  const saveComment = async (e) => {
    setCommentEditing(false);
    if (e.target.value !== name) {
      await putComment(e.target.value);
    }
  };

  const putName = async (newName) => {
    if (saving || !username) {
      return;
    }
    setName(newName);
    const tkn = api_token;
    setSaving(true);
    try {
      const response = await fetch(
        process.env.REACT_APP_API_URL + "/v1/route/" + props.id,
        {
          method: "PATCH",
          credentials: "omit",
          headers: {
            Authorization: "Token " + tkn,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newName }),
        }
      );
      setSaving(false);
      if (response.status !== 200) {
        Swal.fire({
          title: "Error!",
          text: "Something went wrong!",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
      props.onNameChanged && props.onNameChanged(newName);
    } catch (e) {}
  };
  const putComment = async (newComment) => {
    if (saving || !username) {
      return;
    }
    setComment(newComment);
    const tkn = api_token;
    setSaving(true);
    try {
      const response = await fetch(
        process.env.REACT_APP_API_URL + "/v1/route/" + props.id,
        {
          method: "PATCH",
          credentials: "omit",
          headers: {
            Authorization: "Token " + tkn,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comment: newComment }),
        }
      );
      setSaving(false);
      if (response.status !== 200) {
        Swal.fire({
          title: "Error!",
          text: "Something went wrong!",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (e) {}
  };

  const canEdit = () => {
    return username === props.athlete.username;
  };

  const deleteMap = async (e) => {
    e.preventDefault();
    const { isConfirmed } = await Swal.fire({
      title: "Confirm",
      icon: "warning",
      text: "Are you sure you want to delete this activity?",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });
    if (isConfirmed) {
      await fetch(process.env.REACT_APP_API_URL + "/v1/route/" + props.id, {
        method: "DELETE",
        credentials: "omit",
        headers: {
          Authorization: "Token " + api_token,
          "Content-Type": "application/json",
        },
      });
      props.history.push("/");
    }
  };

  return (
    <div>
      <Helmet>
        <title>
          {props.name +
            " by " +
            capitalizeFirstLetter(props.athlete.first_name) +
            " " +
            capitalizeFirstLetter(props.athlete.last_name) +
            " | Mapdump.com"}{" "}
        </title>
      </Helmet>
      <h2>
        <Link to={"/athletes/" + props.athlete.username}>
          {capitalizeFirstLetter(props.athlete.first_name)} {capitalizeFirstLetter(props.athlete.last_name)}
        </Link>
      </h2>
      <div style={{display: "flex", justifyContent: "space-between"}}>
        <div style={{display: "flex", justifyContent: "start"}}>
          <div style={{marginRight: "10px", textAlign: "center"}}>
            <img src={"/athletes/" + props.athlete.username + ".png"} alt="profile" style={{borderRadius: "50%", width: "80px"}}></img>
            <br/>
            <span
              title={regionNames.of(props.country)}
              className={"fa-2x flag-icon flag-icon-" + props.country.toLowerCase()}
              style={{marginTop: "15px"}}
            ></span>
          </div>
          <div style={{borderLeft: "1px solid rgb(0, 0, 0, 0.3)"}}>
            <h2 style={{marginTop: "-15px"}}>
              <div style={{paddingLeft: "5px"}}>
              <small style={{fontSize: "0.5em"}}>{displayDate(DateTime.fromISO(props.startTime, { zone: props.tz }))}</small><br/>
              {(!canEdit() || !nameEditing) && <>{name}</>}
              {canEdit() && nameEditing && (
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={52}
                  defaultValue={name}
                  onBlur={saveName}
                  data-testid="editNameInput"
                />
              )}
              </div>
              <div style={{marginLeft: "-1px"}}>
                <div style={{display: "flex", justifyContent: "start", gap: "5px", flexFlow: "row wrap", fontSize: "0.8em"}}>
                  <div style={{borderLeft: "1px solid rgb(0, 0, 0, 0.3)", paddingLeft: "5px"}}>
                    <span style={{color: "#666"}}>Distance</span>
                    <br/>
                    {(props.distance / 1000).toFixed(1) + "km"}
                  </div>
                  {props.duration ? (<><div style={{borderLeft: "1px solid rgb(0, 0, 0, 0.3)", paddingLeft: "5px"}}>
                    <span style={{color: "#666"}}>Duration</span>
                    <br/>
                    {printTime(props.duration * 1000)}
                  </div>
                  <div style={{borderLeft: "1px solid #666", paddingLeft: "5px"}}>
                    <span style={{color: "#666"}}>Pace</span>
                    <br/>
                    {printPace((props.duration / props.distance) * 1000)}
                  </div>
                  </>) : ""}
                </div>
              </div>
            </h2>
          </div>
        </div>
        {canEdit() && (
          <div>
            <button
              type="button"
              className="btn btn-light"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              data-testid="actionMenuBtn"
            >
              <i className="fas fa-ellipsis-h"></i>
            </button>
            <div className="dropdown-menu dropdown-menu-right">
              <a
                className={"dropdown-item" + (nameEditing ? " disabled" : "")}
                href="/#"
                onClick={enableNameEditing}
                data-testid="editNameBtn"
              >
                <i className="fa fa-pen"></i> Edit title
              </a>
              <a
                className={
                  "dropdown-item" + (commentEditing ? " disabled" : "")
                }
                href="/#"
                onClick={enableCommentEditing}
              >
                <i className="fa fa-pen"></i> Edit description
              </a>
              <div className="dropdown-divider"></div>
              <a className="dropdown-item" href="/#" onClick={deleteMap}>
                <i className="fa fa-trash"></i> Delete
              </a>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginBottom: "5px" }}>
        {(!canEdit() || !commentEditing) && (
          <blockquote style={{ whiteSpace: "pre-wrap" }}>
            <p>
              <LinkItUrl>{comment}</LinkItUrl>
            </p>
          </blockquote>
        )}
        {canEdit() && commentEditing && (
          <textarea
            className="form-control"
            ref={commentInputRef}
            defaultValue={comment}
            onBlur={saveComment}
          />
        )}
      </div>
    </div>
  );
};

export default RouteHeader;
