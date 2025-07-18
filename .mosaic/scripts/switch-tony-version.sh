#!/bin/bash
VERSION=${1:-2.8.0}
echo "Switching to Tony $VERSION..."
export TONY_VERSION=$VERSION
echo "TONY_VERSION=$VERSION" > .mosaic/conf/tony-version.conf
echo "Switched to Tony $VERSION"