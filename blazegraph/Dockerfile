# syntax=docker/dockerfile:1

FROM openjdk:11

RUN apt-get update && apt-get -y install python3

WORKDIR /usr/src/app
COPY ./blazegraph ./blazegraph
EXPOSE 9999

WORKDIR /usr/src/app/blazegraph
CMD ["python3", "run.py"]
