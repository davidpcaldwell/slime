set -x
BASE=$(dirname $0)
SLIME=${BASE}/../../../..
$SLIME/jsh.bash $BASE/suite.jsh.js "$@"
