'use client';
import React, { useRef } from 'react';
import Alert from '../utils/alert';
import Button from '../utils/button';
import { useRouter } from 'next/navigation';

const JoinSession = ({ setjoinsession,userid }) => {
    const router = useRouter();
  const userRef = useRef(null);

  const handleSubmit = async () => {
    const sessionid = userRef.current?.value;

    if (!sessionid) {
      alert("Please enter a session ID.");
      return;
    }
    try {
        const response=await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessioncontrol/checkallowed`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ userid,sessionid })  // Add "name" if required
          })
        const data=await response.json();
        if(!response.ok){
            alert(data.message || "Failed to join session.");
            return;
        }
        if(data.allowed) {
            router.push(`/session/${sessionid}?name=${encodeURIComponent(
                        data.owner_userid)}&userid=${userid}`);
            return;
        }
    } catch (error) {
        
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessioncontrol/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userid,sessionid })  // Add "name" if required
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Session request submitted successfully.");
        setjoinsession(false);
      } else {
        alert(data.message || "Failed to join session.");
      }
    } catch (error) {
      console.error("Error submitting session request:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleCancel = () => {
    setjoinsession(false);
  };

  return (
    <Alert>
      <h2 className="text-xl font-semibold text-white text-center">Enter Session ID</h2>
      
      <input
        type="text"
        ref={userRef}
        placeholder="Type Session ID here"
        className="w-full px-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex gap-4 justify-end pt-3">
        <Button onClick={handleSubmit} className="bg-blue-700 hover:bg-blue-600">
          Submit
        </Button>
        <Button onClick={handleCancel} className="bg-red-700 hover:bg-red-600">
          Cancel
        </Button>
      </div>
    </Alert>
  );
};

export default JoinSession;
