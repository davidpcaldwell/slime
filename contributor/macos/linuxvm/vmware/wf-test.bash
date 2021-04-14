#!/bin/bash
export JSH_LOCAL_JDKS=$HOME/src/local/jdk
export JSH_SHELL_LIB=$HOME/src/local/jsh/lib
SLIME=/mnt/hgfs/slime
export SLIME_WF_JDK_8=$HOME/src/local/jdk/default
"${SLIME}/wf" test
