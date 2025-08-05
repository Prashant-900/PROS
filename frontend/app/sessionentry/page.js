"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionsUI } from "./ui.js";

const Page = () => {
  const [alloweduser, setalloweduser] = useState(false);
  const [userid, setUserid] = useState(null);
  const [error, setError] = useState(null);
  const [createsession, setcreatesession] = useState(false);
  const [sessiondata, setsessiondata] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heading, setheading] = useState("");
  const [currentsessionid, setcurrentsessionid] = useState("");
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem("userid");
      if (!storedUserId) {
        setError("No user ID found. Please login first.");
        return;
      }
      setUserid(storedUserId);
    } catch (err) {
      console.error("Failed to access localStorage:", err);
      setError("Failed to access user ID.");
    }
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!userid) return;
      setLoading(true);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/session/user`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userid }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch sessions");
        }

        const data = await response.json();
        setsessiondata(data.user?.sessions || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [userid]);

  const handleDelete = async (sessionid) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/session/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionid,userid }),
      });
      const data=await response.json();
      if (!response.ok) {
        alert("Failed to delete session");
      }
      else {
        alert(data.user?.message)
        setsessiondata((prev) => prev.filter((session) => session._id !== sessionid));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete session");
    }
  };

  const handleSession = async (sessionid, sessionname) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/container/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionid }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to create session");
      } else {
        router.push(
          `/session/${sessionid}?name=${encodeURIComponent(sessionname)}&userid=${userid}`
        );
      }
    } catch (err) {
      console.error("❌ Error in handleSession:", err);
      alert("Something went wrong while creating the session.");
    }
  };

  return (
    <SessionsUI
      error={error}
      userid={userid}
      loading={loading}
      sessiondata={sessiondata}
      router={router}
      alloweduser={alloweduser}
      createsession={createsession}
      currentsessionid={currentsessionid}
      heading={heading}
      setalloweduser={setalloweduser}
      setcreatesession={setcreatesession}
      setcurrentsessionid={setcurrentsessionid}
      setheading={setheading}
      handleSession={handleSession}
      handleDelete={handleDelete}
      setsessiondata={setsessiondata}
    />
  );
};

export default Page;