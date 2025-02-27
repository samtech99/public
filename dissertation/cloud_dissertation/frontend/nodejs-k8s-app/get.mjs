// get.mjs
import { app, __dirname, k8sApi } from './common.mjs';
import path from 'path';

// Setup view engine (if only used for GET requests, otherwise move to common.mjs)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// Function to get pods information
async function getPodsInfo() {
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromCluster();
    const k8sApi = kubeConfig.makeApiClient(CoreV1Api);

    const podsInfo = [];

    const namespaces = await k8sApi.listNamespace();
    for (const ns of namespaces.body.items) {
        const namespace = ns.metadata.name;
        const pods = await k8sApi.listNamespacedPod(namespace);
        for (const pod of pods.body.items) {
            const node_name = pod.spec.nodeName;
            const node = await k8sApi.readNode(node_name);
            const node_ip = node.body.status.addresses.find(addr => addr.type === 'InternalIP').address;

            // Extract container names
            const containerNames = pod.spec.containers.map(container => container.name);

    
            let controllerKind = 'Unknown'; // Default to 'Unknown'
            if (pod.metadata.ownerReferences && pod.metadata.ownerReferences.length > 0) {
                const owner = pod.metadata.ownerReferences[0];
                controllerKind = owner.kind; // This could be 'ReplicaSet', 'StatefulSet', etc.
                
            }

            podsInfo.push({
                pod_name: pod.metadata.name,
                namespace: namespace,
                node_name: node_name,
                node_ip: node_ip,
                containers: containerNames,
                controllerKind: controllerKind // Include the determined controller kind
            });
        }
    }

    const uniqueNamespaces = [...new Set(podsInfo.map(pod => pod.namespace))];

    return { podsInfo, uniqueNamespaces };

}


// Route to display pods information
app.get('/', async (req, res) => {
    const { podsInfo, uniqueNamespaces } = await getPodsInfo(); // Destructuring here
    res.render('pods', { podsInfo, uniqueNamespaces });
});

app.get('/get-pods', async (req, res) => {
    const { namespace } = req.query;
    try {
        const pods = await getPodsForNamespace(namespace);
        res.json(pods);
    } catch (error) {
        console.error('Failed to get pods:', error);
        res.status(500).send('Error fetching pods');
    }
});



async function getPodsForNamespace(namespace) {
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromCluster();
    const k8sApi = kubeConfig.makeApiClient(CoreV1Api);

    try {
        const res = await k8sApi.listNamespacedPod(namespace);
        // Extract relevant pod information
        const pods = res.body.items.map(pod => ({
            name: pod.metadata.name,
            namespace: pod.metadata.namespace,
            nodeName: pod.spec.nodeName
            // The node IP will be added later
        }));

        // Use a map to avoid fetching the same node information multiple times
        const nodeInfoCache = new Map();

        // Fetch node information for each pod
        for (const pod of pods) {
            if (!nodeInfoCache.has(pod.nodeName)) {
                try {
                    const nodeRes = await k8sApi.readNode(pod.nodeName);
                    const nodeIP = nodeRes.body.status.addresses.find(addr => addr.type === 'InternalIP').address;
                    // Store this node's information in the cache
                    nodeInfoCache.set(pod.nodeName, { nodeIP });
                } catch (nodeError) {
                    console.error(`Failed to get node ${pod.nodeName} information:`, nodeError);
                    // If node details can't be fetched, you may choose to set a default value or handle the error as needed
                    nodeInfoCache.set(pod.nodeName, { nodeIP: 'Unavailable' });
                }
            }

            // Now that we have the node's information, add the node IP to the pod details
            pod.nodeIp = nodeInfoCache.get(pod.nodeName).nodeIP;
        }

        return pods;
    } catch (error) {
        console.error(`Failed to get pods for namespace ${namespace}:`, error);
        throw error;
    }
}

app.get('/get-nodes', async (req, res) => {
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromCluster();
    const k8sApi = kubeConfig.makeApiClient(CoreV1Api);
    
    try {
        const nodes = await k8sApi.listNode();
        const nodeDetails = nodes.body.items.map(node => ({
            name: node.metadata.name,
            ip: node.status.addresses.find(addr => addr.type === 'InternalIP').address
        }));
        res.json(nodeDetails);
    } catch (error) {
        console.error('Failed to get nodes:', error);
        res.status(500).send('Error fetching nodes');
    }
});

