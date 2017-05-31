#!/bin/bash

# Creates a folder .node-red then creates
# a link of the module we will develop
# and assigns link to .node-red so that we can
# test it within Node-RED

DEV_DIR=$(pwd)
DEV_NODERED_DIR=".node-red"

if  [ ! -d $DEV_NODERED_DIR ]; then
  mkdir $DEV_NODERED_DIR
  npm link
  cd $DEV_NODERED_DIR
  npm link node-red-contrib-xbee
  cd $DEV_DIR
  echo "Setup complete, Happy Coding!!!"
else
  echo "Happy coding!!!"
fi
