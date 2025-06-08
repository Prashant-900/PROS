import React from "react";

const Alert = ({ children, ...props }) => {
  return (
    <div className="h-screen w-full fixed">
    <div
      {...props}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 min-w-[250px] max-w-md bg-gray-950 text-white border border-blue-300 rounded-md px-4 py-3 shadow-lg flex flex-col items-center justify-center gap-5"
      >
      {children}
    </div>
      </div>
  );
};

export default Alert;
