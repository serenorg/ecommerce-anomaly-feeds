#!/bin/bash
set -e

PLUGIN_NAME="serenai-monitor"
VERSION=$(grep "Version:" serenai-monitor.php | sed 's/.*Version: //')
BUILD_DIR="build"
ZIP_NAME="${PLUGIN_NAME}-${VERSION}.zip"

echo "Building ${PLUGIN_NAME} version ${VERSION}..."

# Clean build directory
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR/$PLUGIN_NAME

# Copy plugin files
cp serenai-monitor.php $BUILD_DIR/$PLUGIN_NAME/
cp uninstall.php $BUILD_DIR/$PLUGIN_NAME/
cp readme.txt $BUILD_DIR/$PLUGIN_NAME/
cp -r includes $BUILD_DIR/$PLUGIN_NAME/
cp -r assets $BUILD_DIR/$PLUGIN_NAME/
cp -r languages $BUILD_DIR/$PLUGIN_NAME/

# Create zip
cd $BUILD_DIR
zip -r $ZIP_NAME $PLUGIN_NAME
mv $ZIP_NAME ../

echo "Build complete: ${ZIP_NAME}"
