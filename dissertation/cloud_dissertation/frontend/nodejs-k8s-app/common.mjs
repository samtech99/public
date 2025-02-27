// common.mjs
import express from 'express';
import cors from 'cors';
import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import https from 'https';
import axios from 'axios';
import util from 'util';

// Now that util has been imported, you can define execProm
export const execProm = util.promisify(exec);

// Derive __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const app = express();
app.use(cors());
app.use(express.json());

export const kubeConfig = new KubeConfig();
kubeConfig.loadFromCluster();
export const k8sApi = kubeConfig.makeApiClient(CoreV1Api);
