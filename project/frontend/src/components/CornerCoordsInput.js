import React, { useState, useRef } from "react";
import { validateCornersCoords } from "../utils/fileHelpers";
import { Link } from "react-router-dom";
import CalibrationTool from "./CalibrationTool";

const CornersCoordsInput = (props) => {
  const [coords, setCoords] = useState();
  const [isValidCoords, setIsValidCoords] = useState(false);
  const [calibrationToolOpen, setCalibrationToolOpen] = useState(false);
  const [submited, setSubmited] = useState(false);
  const inputEl = useRef(null);

  const onSubmit = (val) => {
    updateCoords(val || inputEl.current.value);
    setSubmited(true);
    if (isValidCoords) {
      props.coordsCallback && props.coordsCallback(coords);
    }
  };

  const updateCoords = (tmpCoords) => {
    if (coords !== tmpCoords) {
      setSubmited(false);
    }
    if (tmpCoords && validateCornersCoords(tmpCoords)) {
      setIsValidCoords(true);
      setCoords(tmpCoords);
    } else {
      setIsValidCoords(false);
      setCoords(null);
    }
  };
  return calibrationToolOpen ? (
    <CalibrationTool
      onValue={(v) => {
        setCalibrationToolOpen(false);
        updateCoords(v ? v : "");
        if (v) {
          props.coordsCallback && props.coordsCallback(v);
        }
      }}
      route={props.route}
      mapDataURL={props.mapDataURL}
    ></CalibrationTool>
  ) : (
    <div>
      <div className="form-group">
        <label htmlFor="corners-coords">Corners Coordinates</label>
        <input
          ref={inputEl}
          id="cornersCoordsInput"
          className={
            "form-control" + (submited && !isValidCoords ? " is-invalid" : "")
          }
          type="text"
          placeholder="Corners Coordinates"
          defaultValue={coords}
          onChange={(e) => updateCoords(e.target.value)}
        />
        {submited && !isValidCoords && (
          <div className="invalid-feedback">{"Invalid coordinates"}</div>
        )}
        <p className="help-block">
          Latitude and longitude of map corners separated by commas in following
          order Top Left, Top Right, Bottom Right, Bottom Left.
          <br />
          eg: 60.519,22.078,60.518,22.115,60.491,22.112,60.492,22.073
          <br />
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              setCalibrationToolOpen(true);
            }}
            data-testid="to-calib-tool-link"
          >
            Use online calibration tool
          </Link>
        </p>
      </div>
      <button className="btn btn-danger" onClick={props.onUndo}>
        <i className="fas fa-undo"></i> Back
      </button>{" "}
      <button
        data-testid="nextBtn"
        className="btn btn-primary"
        onClick={() => onSubmit()}
      >
        <i className="fas fa-arrow-alt-circle-right"></i> Next
      </button>
    </div>
  );
};

export default CornersCoordsInput;
