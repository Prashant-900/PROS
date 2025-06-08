'use client';
import Button from "./utils/button";
import CreateId from "./alerts/create_id";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import JoinSession from "./alerts/join_session";

export default function Home() {
  const router = useRouter();
  const [createid, setcreateid] = useState(false);
  const [joinsession, setjoinsession] = useState(false);
  const [userid, setUserid] = useState(null);

  useEffect(() => {
    setUserid(localStorage.getItem("userid"));
  }, []);

  const handleEntry = () => {
    if (!userid) {
      setcreateid(true);
      return;
    } else {
      router.push("/sessionentry");
    }
  };

  const handleCreate = () => {
    if (!userid) {
      setcreateid(true);
    } else {
      localStorage.removeItem("userid");
      setUserid(null); // Update state to reflect logout
    }
  };

  return (
    <div className="flex items-center justify-evenly h-screen w-full bg-gray-900">
      {createid && <CreateId setcreateid={(v) => {
        setcreateid(v);
        setUserid(localStorage.getItem("userid")); // Update after CreateId is done
      }} />}

      {joinsession && <JoinSession userid={userid} setjoinsession={setjoinsession} />}

      <Button
        className={`text-2xl ${userid ? "bg-red-500" : ""}`}
        onClick={handleCreate}
      >
        {userid ? "Logout" : "Create ID"}
      </Button>

      <Button className="text-2xl" onClick={handleEntry}>
        Session
      </Button>

      <Button className="text-2xl" onClick={() => setjoinsession(true)}>
        Join Session
      </Button>
    </div>
  );
}
