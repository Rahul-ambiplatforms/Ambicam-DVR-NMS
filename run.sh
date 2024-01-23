#!/bin/sh

set -e


# Function to start the Node.js app using PM2
start_app() {
    echo "Starting Node.js app..."
    pm2 start npm --cron-restart="0 0 * * *" --name nms-dvr -- start # Replace with your actual app start script and PM2 app name
}

# Set the timezone to Asia/Kolkata (Indian Standard Time)
export TZ="Asia/Kolkata"


# Start the app using PM2
start_app

# Keep the script running (infinite loop)
while true; do
    sleep 10
done


