import * as k8s from "@kubernetes/client-node";

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const batchApi = kc.makeApiClient(k8s.BatchV1Api);
const coreApi = kc.makeApiClient(k8s.CoreV1Api);

export async function createUserPod(sessionId) {
  const jobName = `job-${sessionId}`;
  const serviceName = `service-${sessionId}`;
  const jobManifest = {
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: {
      name: jobName,
    },
    spec: {
      ttlSecondsAfterFinished: 5,
      backoffLimit: 0,
      template: {
        metadata: {
          labels: {
            app: sessionId,
          },
        },
        spec: {
          restartPolicy: "Never",
          containers: [
            {
              name: "user-container",
              image: "pod-server:v1",
              ports: [{ containerPort: 8080 }],
            },
          ],
        },
      },
    },
  };

  const serviceManifest = {
    metadata: {
      name: serviceName,
    },
    spec: {
      selector: {
        app: sessionId,
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
    // Create Service
    await coreApi.createNamespacedService({
      namespace: "default",
      body: serviceManifest,
    });

    // Create Job
    await batchApi.createNamespacedJob({
      namespace: "default",
      body: jobManifest,
    });

    return { serviceName, continue: true };
  } catch (err) {
    return { err, continue: false };
  }
}
