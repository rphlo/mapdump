import React, { useState } from 'react'
import { validateCornersCoords } from '../utils/fileHelpers';


const CornersCoordsInput = (props) => {
  const [coords, setCoords] = useState();
  
  const onSubmit = () => {
    props.coordsCallback && props.coordsCallback(coords);
  }

  const updateCoords = (e) => {
    const tmpCoords = e.target.value;
    if(tmpCoords && validateCornersCoords(tmpCoords)) {
      setCoords(tmpCoords);
    } else {
      setCoords(null);
    }
  }
  return (
    <div>
      <div className="form-group">
        <label htmlFor="corners-coords">Corners Coordinates</label>
        <input id="cornersCoordsInput" className="form-control" type="text" placeholder="Corners Coordinates" onChange={updateCoords}/>
        <p className="help-block">Latitude and longitude of map corners separated by commas in following order Top Left, Top Right, Bottom Right, Bottom Left.<br/>eg: 60.519,22.078,60.518,22.115,60.491,22.112,60.492,22.073<br/><a href="/calibration.html" target="_blank" rel="opener">Use online calibration tool</a></p>
      </div>
      <button className="btn btn-danger" onClick={props.onUndo}><i className="fas fa-undo"></i> Back</button> {coords && <button className="btn btn-primary disabled" onClick={onSubmit}><i className="fas fa-arrow-alt-circle-right"></i> Next</button>}
    </div>
  )
}

export default CornersCoordsInput;