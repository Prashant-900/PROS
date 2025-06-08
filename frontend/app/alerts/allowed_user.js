"use client";
import React, { useState, useEffect } from "react";
import Alert from "../utils/alert";
import Button from "../utils/button";
import { ArrowLeftIcon, XIcon } from "lucide-react";

const AllowedUser = ({ onBack, heading, userid, sessionid }) => {
  const [users, setUsers] = useState([]);
  const backurl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (!userid || !sessionid) return;

    if (heading === "Allowed Users") {
      fetchAllowedUsers(userid, sessionid);
    } else {
      fetchUserRequests(userid, sessionid);
    }
  }, [heading, userid, sessionid]);

  const fetchAllowedUsers = async (userid, sessionid) => {
    try {
      const response = await fetch(`${backurl}/sessioncontrol/getallowed`, {
        method: "POST",
        body: JSON.stringify({ userid, sessionid }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setUsers(data.allowed_users || []);
    } catch (err) {
      console.error("Failed to fetch allowed users:", err);
    }
  };

  const fetchUserRequests = async (userid, sessionid) => {
    try {
      const response = await fetch(`${backurl}/sessioncontrol/getrequest`, {
        method: "POST",
        body: JSON.stringify({ userid, sessionid }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setUsers(data.users_requests || []);
    } catch (err) {
      console.error("Failed to fetch user requests:", err);
    }
  };

  const handleRemove = async (name) => {
    const response=await fetch(`${backurl}/sessioncontrol/allowed`, {
      method: "DELETE",
      body: JSON.stringify({ userid, sessionid, name }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    const data=await response.json();
    if(response.ok){
      alert(data.message);
    }

    setUsers((prevUsers) =>
      prevUsers.filter((user) =>
        typeof user === "string" ? user !== name : user.name !== name
      )
    );
    // Optionally: call API to remove user request
  };

  const handleSave = async (name, right) => {
    const response = await fetch(`${backurl}/sessioncontrol/allowed`, {
      method: "POST",
      body: JSON.stringify({ userid, sessionid, name, right }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      setUsers((prevUsers) =>
        prevUsers.filter((user) =>
          typeof user === "string" ? user !== name : user.name !== name
        )
      );
    } else {
      alert("failed to accept user");
    }
  };

  return (
    <Alert>
      {/* Header */}
      <div className="flex items-center overflow-y-auto max-h-40 justify-between mb-4 gap-2">
        <Button onClick={onBack} className="p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <h2 className="text-white font-semibold text-lg">{heading}</h2>
        <div className="w-8" />
      </div>

      {/* User List */}
      <div className="flex flex-col gap-2 w-full">
        {users.length === 0 ? (
          <p className="text-gray-400 text-center">No users found.</p>
        ) : (
          users.map((user, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-gray-800 px-4 py-2 rounded border border-gray-700 text-white"
            >
              <div className="flex flex-col">
                <span className="font-mono text-blue-400">
                  {typeof user === "string" ? user : user.name}
                </span>
                {user.right && (
                  <span className="text-xs text-gray-400">
                    Right: {user.right}
                  </span>
                )}
              </div>

              {heading !== "Allowed Users" && (
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() =>
                      handleRemove(typeof user === "string" ? user : user.name)
                    }
                    className="text-red-400 hover:text-red-600"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      handleSave(
                        typeof user === "string" ? user : user.name,
                        "read"
                      )
                    }
                    className="text-blue-400 hover:text-blue-600 text-sm"
                  >
                    Read
                  </button>

                  <button
                    onClick={() =>
                      handleSave(
                        typeof user === "string" ? user : user.name,
                        "write"
                      )
                    }
                    className="text-green-400 hover:text-green-600 text-sm"
                  >
                    Write
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Alert>
  );
};

export default AllowedUser;
