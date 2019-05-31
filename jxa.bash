SRC=$(dirname $0)
osascript -l JavaScript $SRC/jxa/api.js "$@"
