#	TODO	calculate EXTENSION from ICON
mkdir $NAME.iconset
sips -z 16 16     $ICON --out $NAME.iconset/icon_16x16.$EXTENSION
sips -z 32 32     $ICON --out $NAME.iconset/icon_16x16@2x.$EXTENSION
sips -z 32 32     $ICON --out $NAME.iconset/icon_32x32.$EXTENSION
sips -z 64 64     $ICON --out $NAME.iconset/icon_32x32@2x.$EXTENSION
sips -z 128 128   $ICON --out $NAME.iconset/icon_128x128.$EXTENSION
sips -z 256 256   $ICON --out $NAME.iconset/icon_128x128@2x.$EXTENSION
sips -z 256 256   $ICON --out $NAME.iconset/icon_256x256.$EXTENSION
sips -z 512 512   $ICON --out $NAME.iconset/icon_256x256@2x.$EXTENSION
sips -z 512 512   $ICON --out $NAME.iconset/icon_512x512.$EXTENSION
cp $ICON $NAME.iconset/icon_512x512@2x.png
iconutil -c icns $NAME.iconset
rm -R $NAME.iconset
mv $NAME.icns $TO
