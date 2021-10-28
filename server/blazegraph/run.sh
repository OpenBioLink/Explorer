#!/usr/bin/bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
java -server -Xmx4g -DjettyXml=${SCRIPT_DIR}/jetty.xml -jar blazegraph.jar