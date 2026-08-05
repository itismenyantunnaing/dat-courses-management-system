#!/bin/sh
set -e

mkdir -p /data/uploads/certificates
chown -R appuser:appuser /data/uploads

exec su appuser -c "/opt/java/openjdk/bin/java -Dspring.profiles.active=prod -jar /app/app.jar"