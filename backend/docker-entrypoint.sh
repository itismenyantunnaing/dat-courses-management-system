#!/bin/sh
set -e

mkdir -p /data/uploads/certificates /data/uploads/profiles /data/uploads/courses
chown -R appuser:appuser /data/uploads

exec su appuser -c "/opt/java/openjdk/bin/java -Dspring.profiles.active=prod -jar /app/app.jar"