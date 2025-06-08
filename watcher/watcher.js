import * as k8s from "@kubernetes/client-node";

async function main() {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  const coreApi = kc.makeApiClient(k8s.CoreV1Api);
  const watch = new k8s.Watch(kc);

  async function startWatch() {
    console.log("Starting pod watcher...");

    watch.watch(
      "/api/v1/namespaces/default/pods",
      {},
      async (type, pod) => {
        if (type === "DELETED") {
          const podName = pod.metadata?.name;

          // Only proceed if pod name starts with "job"
          if (!podName || !podName.startsWith("job")) return;

          const parts = podName.split("-");
          const sessionId = parts.slice(1, -1).join("-");

          const serviceName = `service-${sessionId}`;

          console.log(
            `Pod deleted: ${podName}. Deleting service: ${serviceName}`
          );

          try {
            await coreApi.deleteNamespacedService({name:serviceName,namespace: "default"});
            console.log(`Service ${serviceName} deleted successfully.`);
          } catch (err) {
            console.error(
              `Failed to delete service ${serviceName}:`,
              err.body?.message || err.message
            );
          }
        }
      },
      (err) => {
        if (err) {
          console.error("Watcher error:", err);
          setTimeout(startWatch, 5000); // restart watcher after delay
        }
      }
    );
  }

  startWatch();
}

main().catch((err) => {
  console.error("Fatal error in watcher:", err);
  process.exit(1);
});
