from flask import Flask, render_template
from kubernetes import client, config

app = Flask(__name__)

# Function to get pods information
def get_pods_info():
    config.load_incluster_config()
    v1 = client.CoreV1Api()
    pods_info = []
    for ns in v1.list_namespace().items:
        namespace = ns.metadata.name
        pods = v1.list_namespaced_pod(namespace)
        for pod in pods.items:
            node_name = pod.spec.node_name
            node = v1.read_node(name=node_name)
            node_ip = node.status.addresses[0].address
            pods_info.append({
                'pod_name': pod.metadata.name,
                'namespace': namespace,
                'node_name': node_name,
                'node_ip': node_ip
            })
    return pods_info

# Route to display pods information
@app.route('/')
def pods():
    pods_info = get_pods_info()
    return render_template('pods.html', pods_info=pods_info)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)

