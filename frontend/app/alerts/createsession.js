import React, { useRef } from "react";
import Alert from "../utils/alert";
import Button from "../utils/button";

const CreateSession = ({userid, setcreatesession,setsessiondata }) => {
  const userRef = useRef(null);

  const handleSubmit = async () => {
    const value = userRef.current?.value;
    if (value) {
      try {
        console.log(process.env.NEXT_PUBLIC_BACKEND_URL);
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/session/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: value,userid:userid }),
        });

        if (!res.ok) {
          alert("Failed to create session");
        }
        else {
          const data = await res.json();
          setsessiondata((prev)=>[...prev,data.user?.session]);
          setcreatesession(false);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to add user");
      }
    }
  };

  const handleCancel = () => {
    setcreatesession(false);
  };

  return (
    <Alert>
      <h2 className="text-xl font-semibold text-white text-center">
        Enter Session Name
      </h2>

      <input
        type="text"
        ref={userRef}
        placeholder="Name..."
        className="w-full px-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex gap-4 justify-end pt-3">
        <Button
          onClick={handleSubmit}
          className="bg-blue-700 hover:bg-blue-600"
        >
          Submit
        </Button>
        <Button onClick={handleCancel} className="bg-red-700 hover:bg-red-600">
          Cancel
        </Button>
      </div>
    </Alert>
  );
};

export default CreateSession;
