export SLIME="$(dirname ${BASH_SOURCE})/../../.."
LOCAL="${HOME}/local"
if [ ! -d "${LOCAL}" ]; then
	mkdir -p "${LOCAL}"
fi
export JSH_LOCAL_JDKS="${LOCAL}/jdk"
export JSH_SHELL_LIB="${LOCAL}/jsh/lib"
export SLIME_WF_JDK_8=${JSH_LOCAL_JDKS}/default
