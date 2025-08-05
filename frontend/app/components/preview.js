import React from "react";

const Preview = ({ priview }) => {
  return (
    <div className="h-full w-full justify-center items-center">
      {priview?.data ? (
        <iframe
          src={priview.data}
          className="w-full h-full border border-amber-900"
          title="Live Pod Preview"
        />
      ) : (
        <p className="text-white text-2xl text-center">No preview available</p>
      )}
    </div>
  );
};

export default Preview;