#!/bin/bash

mkdir nodejs-k8s-app
cd nodejs-k8s-app
npm init -y
npm install express @kubernetes/client-node ejs
npm install node-fetch cors axios tar
