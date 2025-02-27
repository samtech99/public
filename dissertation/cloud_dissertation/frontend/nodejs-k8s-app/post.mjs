// post.mjs
import { app, execProm, k8sApi } from './common.mjs';




app.post('/create-checkpoint', async (req, res) => {
    // Extract the necessary data from the request body
    const { nodeIp, namespace, podName, controllerKind, containerName } = req.body;

    console.log(`Received request to create checkpoint for pod ${podName}/${containerName} in namespace ${namespace} at node ${nodeIp}`);

    try {
        // Assuming createCheckpointForPod sends a request to a specific endpoint and returns the response
       const checkpointResponse = await createCheckpointForPod(nodeIp, namespace, podName, controllerKind, containerName); // Include containerName here
       
         // Send the response back to the client
        res.json({
            message: "Checkpoint creation request processed",
            data: checkpointResponse
        });
    } catch (error) {
        console.error("Error processing checkpoint creation request:", error);
        res.status(500).json({ message: "Failed to create checkpoint", error: error.toString() });
    }
});






async function createCheckpointForPod(nodeIp, namespace, podName, controllerKind, containerName) {
    // Read the service account token
    const token = await fs.readFile('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8');

    const url = `https://${nodeIp}:10250/checkpoint/${namespace}/${podName}/${containerName}`;
    console.log(`Creating checkpoint for pod ${podName}/${containerName} in namespace ${namespace} at node ${nodeIp}`);
    console.log(`URL: ${url}`);

    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    try {
        const response = await axios.post(url, {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            httpsAgent: agent
        });

        console.log("Checkpoint creation response:", response.data);
    processCheckpointsDirectory(namespace, podName, controllerKind, containerName)
  .then(() => console.log("All checkpoint images processed successfully"))
  .catch(error => console.error("An error occurred while processing checkpoint images", error));
return response.data;
    } catch (error) {
        console.error("Error during fetch operation:", error);
        throw error;
    }
}

function reconstructPodName(podName) {
    // Split the pod name into parts
    const parts = podName.split('-');
    
    // Determine how many parts to exclude
    const excludePartsCount = 2; // example for "deployment-name-random-hash"

    // Reconstruct the meaningful part of the name
    const meaningfulParts = parts.slice(0, -excludePartsCount);
    
    return meaningfulParts.join('-');
}


// Function to ensure directory exists
async function ensureDir(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
}

// Modified function to extract and read base image name from config.dump
async function getBaseImageNameFromCheckpoint(tarFilePath) {
    const extractDir = path.join('/tmp', path.basename(tarFilePath, '.tar'));
    
    // Ensure the directory exists
    await ensureDir(extractDir);

    try {
        await tar.x({
          file: tarFilePath,
          cwd: extractDir,
          filter: (path) => path.includes('config.dump'),
        });
    
        const configDumpPath = path.join(extractDir, 'config.dump');
        const configContent = await fs.readFile(configDumpPath, 'utf8');
        const config = JSON.parse(configContent);
        const baseImageName = config.rootfsImageName;
    
        return baseImageName;
    } finally {
        // Cleanup: Remove the extracted directory regardless of success or failure
        await fs.rm(extractDir, { recursive: true });
    }
}


  

async function buildPushDeleteDockerImage(tarFilePath, namespace, workloadType, fullPodName, containerName, dateTime) {
    const registryUrl = process.env.DOCKER_REGISTRY_URL;
    if (!registryUrl) {
        throw new Error("DOCKER_REGISTRY_URL environment variable is not set.");
    }

    const baseImageName = await getBaseImageNameFromCheckpoint(tarFilePath);
    const podName = reconstructPodName(fullPodName);

    // Define the image name using namespace, workload type, and pod name
    const imageName = `${namespace}_${workloadType}_${podName}_${containerName}`.toLowerCase();
    const tagName = dateTime.replace(/-|:/g, '_').replace('T', '_').replace('Z', '').toLowerCase();
    const imageFullName = `${registryUrl}/${imageName}:${tagName}`;

    // Define dockerfilePath here
    const dockerfilePath = `./Dockerfile-${imageName}-${tagName}`;
    const localTarFileName = path.basename(tarFilePath);

    try {
        // Copy the tar file to the current working directory
        await fs.copyFile(tarFilePath, `./${localTarFileName}`);

        // Generate a Dockerfile dynamically with the correct relative path to the tar file
        const dockerfileContents = `FROM ${baseImageName}\nADD ${localTarFileName} /\n`;
        await fs.writeFile(dockerfilePath, dockerfileContents);

        console.log(`Building Docker image with base image: ${baseImageName}`);
        // Build the Docker image from the dynamically generated Dockerfile
        await execProm(`podman build -t ${imageFullName} -f ${dockerfilePath} .`);

        console.log(`Image ${imageFullName} built successfully`);

        // Push the image to the Docker registry
        console.log(`Pushing ${imageFullName} to registry`);
        await execProm(`podman push ${imageFullName}`);
        console.log(`Image ${imageFullName} pushed successfully`);

        // Cleanup: Delete local image, temporary Dockerfile, and tar file
        console.log(`Deleting local image ${imageFullName}`);
        await execProm(`podman rmi ${imageFullName}`);
        console.log(`Image ${imageFullName} deleted locally`);

        console.log(`Deleting temporary Dockerfile ${dockerfilePath}`);
        await fs.unlink(dockerfilePath);
        console.log(`Temporary Dockerfile ${dockerfilePath} deleted`);

        console.log(`Deleting tar file ${localTarFileName}`);
        await fs.unlink(`./${localTarFileName}`);
        console.log(`Tar file ${localTarFileName} deleted successfully`);
    } catch (error) {
        console.error("An error occurred:", error);
        throw error;
    }
}



const checkpointsDir = process.env.CHECKPOINTS_DIR; 



async function renameTarFileForImport(originalTarFilePath) {
  // Replace colons with hyphens to ensure filename is valid
  const validTarFilePath = originalTarFilePath.replace(/:/g, '-');
  await fs.rename(originalTarFilePath, validTarFilePath);
  return validTarFilePath;
}

async function processCheckpointsDirectory(namespace, podName, controllerKind, containerName) {
    const checkpointsDir = process.env.CHECKPOINTS_DIR;
    if (!checkpointsDir) {
        throw new Error("CHECKPOINTS_DIR environment variable is not set.");
    }

    try {
        const files = await fs.readdir(checkpointsDir);
        const tarFiles = files.filter(file => file.endsWith('.tar'));

        for (const tarFile of tarFiles) {
            const tarFilePath = path.join(checkpointsDir, tarFile); // Construct the full path to the tar file
            const dateTime = new Date().toISOString();

            console.log(`Processing ${tarFile} for pod ${podName} in namespace ${namespace} with workload type ${controllerKind}`);
            
            // Rename the tar file to replace colons with hyphens
            const sanitizedTarFilePath = await renameTarFileForImport(tarFilePath);
            
            // Now use the buildPushDeleteDockerImage function with the detailed information
            await buildPushDeleteDockerImage(sanitizedTarFilePath, namespace, controllerKind, podName, containerName, dateTime);
        }
    } catch (error) {
        console.error("An error occurred while processing checkpoint images", error);
        throw error;
    }
}






