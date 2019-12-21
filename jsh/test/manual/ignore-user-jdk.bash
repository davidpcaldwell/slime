BASE=$(dirname $0)/../../..
rm -Rvf ${BASE}/local/jdk/default
export JSH_USER_JDK=/dev/null
#	TODO	could invoke a script that outputs java.home and then compare it to desired value
$BASE/jsh.bash $BASE/jsh/test/jsh-data.jsh.js
