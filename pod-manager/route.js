import express from "express";
import * as k8s from "@kubernetes/client-node";

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const coreApi = kc.makeApiClient(k8s.CoreV1Api);

const router = express.Router();

const NAMESPACE = "default";

router.post("/create", async (req, res) => {
  const { sessionid } = req.body;
  console.log("Creating session:", sessionid);

  if (!sessionid) {
    return res.status(400).send("sessionid is required in request body");
  }

  const podName = `pod-${sessionid}`;
  const svcName = `svc-${sessionid}`;

  const podManifest = {
    apiVersion: "v1",
    kind: "Pod",
    metadata: {
      name: podName,
      labels: {
        sessionid: sessionid,
      },
    },
    spec: {
      restartPolicy: "Never",
      containers: [
        {
          name: "user-container",
          image: "container:v1", // replace with your actual image
          workingDir: "/mnt/data",
          ports: [{ containerPort: 8080 }],
        },
      ],
    },
  };

  const serviceManifest = {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name: svcName,
    },
    spec: {
      selector: {
        sessionid: sessionid,
      },
      ports: [
        {
          port: 8080,
          targetPort: 8080,
        },
      ],
    },
  };

  try {
    await coreApi.createNamespacedPod({namespace:NAMESPACE, body:podManifest});
    await coreApi.createNamespacedService({namespace:NAMESPACE,body: serviceManifest});
    res.status(201).send(`Pod and service for session ${sessionid} created`);
  } catch (error) {
    console.error("❌ Error creating pod/service:", error.body || error);
    res.status(500).send("Failed to create pod or service");
  }
});

router.delete("/delete", async (req, res) => {
  const { sessionid } = req.body;
  console.log("Deleting session:", sessionid);

  if (!sessionid) {
    return res.status(400).send("sessionid is required in request body");
  }

  const podName = `pod-${sessionid}`;
  const svcName = `svc-${sessionid}`;

  try {
    await coreApi.deleteNamespacedPod({name:podName,namespace: NAMESPACE});
    await coreApi.deleteNamespacedService({name:svcName, namespace:NAMESPACE});
    res.status(200).send(`Pod and service for session ${sessionid} deleted`);
  } catch (error) {
    console.error("❌ Error deleting pod/service:", error.body || error);
    res.status(500).send("Failed to delete pod or service");
  }
});

export default router;
