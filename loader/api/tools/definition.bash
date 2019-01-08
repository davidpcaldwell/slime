BASE=$(dirname $0)/../../..
jrunscript $BASE/rhino/jrunscript/api.js jsh $BASE/loader/api/tools/definition.jsh.js "$@"
