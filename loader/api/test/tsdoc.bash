BASE="$(dirname $0)/../../.."
PATH="${PATH}:$BASE/local/jsh/lib/node/bin"
node --version
export NODE_PATH="$BASE/local/jsh/lib/node/lib/node_modules"
node $(dirname $0)/tsdoc.node.js "$@"
