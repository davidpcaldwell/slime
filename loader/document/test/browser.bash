PARENT=$(dirname $0)
CODE=$PARENT/..
SLIME=$PARENT/../../..
$SLIME/jsh.bash $SLIME/loader/browser/test/suite.jsh.js -definition $CODE/api.html -browser chrome -chrome:instance $SLIME/local/chrome/browser "$@"
