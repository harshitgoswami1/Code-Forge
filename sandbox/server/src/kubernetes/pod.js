import { k8sCoreV1Api } from "./config.js";

export async function createPod(sandboxId) {

    const podManifest = {
        metadata: {
            name: `sandbox-${sandboxId}`,
            labels: {
                sandboxId: sandboxId
            }
        },
        spec: {
            volumes: [
                {
                    name: 'workspace-volume',
                    emptyDir: {}
                }
            ],
            initContainers: [
                {
                    name: 'workspace-init',
                    image: 'template',
                    imagePullPolicy: 'IfNotPresent',
                    command: ['sh', '-c', 'cp -r /workspace/. /mnt/workspace/'],
                    volumeMounts: [
                        {
                            name: 'workspace-volume',
                            mountPath: '/mnt/workspace'
                        }
                    ]
                }
            ],
            containers: [
                {
                    image: "template",
                    imagePullPolicy: "IfNotPresent",
                    ports: [{ containerPort: 5173, name: "http" }],
                    name:"sandbox-container",
                    resources: {
                        limits: { cpu: "500m", memory: "1Gi" },
                        requests: { cpu: "250m", memory: "500Mi" }
                    },
                    volumeMounts: [
                        {
                            name: 'workspace-volume',
                            mountPath : '/workspace'
                        }
                    ]
                },
                {
                    image: "agent",
                    imagePullPolicy: "IfNotPresent",
                    ports: [{ containerPort: 3000, name: "http" }],
                    name:"agent-container",
                    resources: {
                        limits: { cpu: "500m", memory: "1Gi" },
                        requests: { cpu: "250m", memory: "500Mi" }
                    },
                    volumeMounts: [
                        {
                            name: 'workspace-volume',
                            mountPath : '/workspace'
                        }
                    ]
                }

            ]
        }
    }

    const response = await k8sCoreV1Api.createNamespacedPod({
        namespace: "default",
        body: podManifest
    });

    console.log(response);

    return response.body;
}