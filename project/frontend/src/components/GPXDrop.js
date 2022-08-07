import React, { useMemo } from "react";
import { useDropzone } from "react-dropzone";
const baseStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#333",
  borderStyle: "dashed",
  backgroundColor: "#fafafa",
  color: "#333",
  outline: "none",
  transition: "border .24s ease-in-out",
  marginBottom: "5px",
};

const activeStyle = {
  borderColor: "#2196f3",
};

const acceptStyle = {
  borderColor: "#00e676",
};

const rejectStyle = {
  borderColor: "#ff1744",
};

const GPXDropzone = (props) => {
  const onDrop = props.onDrop;
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({ onDrop, accept: ".gpx,.tcx,.fit" });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

  return (
    <div data-testid="dropzone" {...getRootProps({ style })}>
      <input {...getInputProps()} multiple={false} />
      {isDragActive ? (
        <p>Drop a GPX, FIT or TCX file here ...</p>
      ) : (
        <p>
          Drag and drop a GPX, FIT or TCX file here, or click to select a file
        </p>
      )}
    </div>
  );
};

export default GPXDropzone;
