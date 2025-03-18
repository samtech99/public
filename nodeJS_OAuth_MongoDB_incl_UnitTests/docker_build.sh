#!/bin/sh

docker login
docker build . -t markusfischer1/markus1fischer1cloud1computing1coursework:0.0.3

docker push markusfischer1/markus1fischer1cloud1computing1coursework:0.0.3