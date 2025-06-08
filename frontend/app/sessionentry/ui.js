"use client";
import React from "react";
import Button from "../utils/button";
import { ArrowLeftIcon, User, PlusCircle, UserPlus, X } from "lucide-react";
import AllowedUser from "../alerts/allowed_user";
import CreateSession from "../alerts/createsession";

export const SessionsUI = ({
  error,
  userid,
  loading,
  sessiondata,
  router,
  alloweduser,
  createsession,
  setsessiondata,
  currentsessionid,
  heading,
  setalloweduser,
  setcreatesession,
  setcurrentsessionid,
  setheading,
  handleSession,
  handleDelete
}) => {
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-900 text-white flex flex-col">
      {alloweduser && (
        <AllowedUser
          userid={userid}
          sessionid={currentsessionid}
          heading={heading}
          onBack={() => setalloweduser(false)}
        />
      )}
      {createsession && (
        <CreateSession
          userid={userid}
          setsessiondata={setsessiondata}
          setcreatesession={setcreatesession}
        />
      )}

      {/* Top bar - fixed height */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <Button onClick={() => router.back()}>
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>

        <span className="text-lg font-semibold">
          User ID:{" "}
          <span className="text-blue-400 font-mono ml-2">
            {userid ?? "No ID found"}
          </span>
        </span>
      </div>

      {/* Content area - flex-1 to take remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        {/* Session header - fixed height */}
        <div className="shrink-0 flex items-center mb-6 justify-between">
          <h1 className="text-3xl font-bold">Sessions</h1>
          <Button
            onClick={() => setcreatesession(true)}
            className="hover:bg-blue-600 flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Create
          </Button>
        </div>

        {/* Session list - scrollable area */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading sessions...</p>
            </div>
          ) : sessiondata.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center p-8 bg-gray-800 rounded-lg max-w-md">
                <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No Sessions Found
                </h3>
                <p className="text-gray-400 mb-6">
                  You dont have any sessions yet.
                </p>
                <Button
                  onClick={() => setcreatesession(true)}
                  className="bg-blue-700 hover:bg-blue-600"
                >
                  Create First Session
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pr-2">
              {sessiondata.map((session) => (
                <div
                  key={session._id}
                  onClick={() => handleSession(session._id, session.name)}
                  className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold truncate">
                      {session.name}
                    </h2>
                    <p className="text-sm text-gray-400 truncate">
                      ID: {session._id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <UserPlus
                      className="w-6 h-6 shrink-0 text-green-500"
                      onClick={(event) => {
                        setcurrentsessionid(session._id);
                        setheading("User Request");
                        setalloweduser(true);
                        event.stopPropagation();
                      }}
                    />
                    <User
                      className="shrink-0 w-6 h-6 text-blue-400"
                      onClick={(event) => {
                        setcurrentsessionid(session._id);
                        setheading("Allowed Users");
                        setalloweduser(true);
                        event.stopPropagation();
                      }}
                    />
                    <X onClick={(event) => {
                        handleDelete(session._id);
                        event.stopPropagation();
                        }} className="w-6 h-6 shrink-0 text-red-500"/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};