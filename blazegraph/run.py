import os
import subprocess
from pathlib import Path

if __name__ == "__main__":
    SCRIPT_DIR = os.path.splitdrive(os.path.abspath(os.path.dirname(__file__)))[1].replace("\\", "/")
    print("java -server -Xmx4g -DjettyXml=" + SCRIPT_DIR + "/jetty.xml -jar " + SCRIPT_DIR + "/blazegraph.jar")
    subprocess.run(("java -server -Xmx4g -DjettyXml=" + SCRIPT_DIR + "/jetty.xml -jar " + SCRIPT_DIR + "/blazegraph.jar").split(" "))

