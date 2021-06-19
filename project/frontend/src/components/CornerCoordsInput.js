import React, { useState, useRef } from 'react'
import { validateCornersCoords } from '../utils/fileHelpers';


const CornersCoordsInput = (props) => {
  const [coords, setCoords] = useState();
  const [isValidCoords, setIsValidCoords] = useState(false);
  const [submited, setSubmited] = useState(false)
  const inputEl = useRef(null);

  const onSubmit = () => {
    updateCoords(inputEl.current.value);
    setSubmited(true)
    if (isValidCoords) {
      props.coordsCallback && props.coordsCallback(coords);
    }
  }

  const updateCoords = (tmpCoords) => {
    if (coords !== tmpCoords) {
      setSubmited(false);
    }
    if(tmpCoords && validateCornersCoords(tmpCoords)) {
      setIsValidCoords(true);
      setCoords(tmpCoords);
    } else {
      setIsValidCoords(false);
      setCoords(null);
    }
  }
  return (
    <div>
      <div className="form-group">
        <label htmlFor="corners-coords">Corners Coordinates</label>
        <input ref={inputEl}
               id="cornersCoordsInput"
               className={"form-control" + ((submited && !isValidCoords) ? ' is-invalid' : '')}
               type="text" placeholder="Corners Coordinates"
               onChange={(e)=>updateCoords(e.target.value)}/>
        {submited && !isValidCoords && (<div className="invalid-feedback">
          {'Invalid coordinates'}
        </div>)}
        <p className="help-block">Latitude and longitude of map corners separated by commas in following order Top Left, Top Right, Bottom Right, Bottom Left.<br/>eg: 60.519,22.078,60.518,22.115,60.491,22.112,60.492,22.073<br/><a href="/static/calibration.html" target="_blank" rel="opener">Use online calibration tool</a></p>
      </div>
      <button className="btn btn-danger" onClick={props.onUndo}><i className="fas fa-undo"></i> Back</button> <button data-testid="nextBtn" className="btn btn-primary" onClick={onSubmit}><i className="fas fa-arrow-alt-circle-right"></i> Next</button>
    </div>
  )
}

export default CornersCoordsInput;