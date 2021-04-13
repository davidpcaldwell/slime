#!/bin/bash
export JSH_LOCAL_JDKS=$HOME/src/local/jdk
export JSH_SHELL_LIB=$HOME/src/local/jsh/lib
SLIME=/mnt/hgfs/slime
"${SLIME}/jsh.bash" jsh/test/jsh-data.jsh.js