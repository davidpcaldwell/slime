#!/bin/bash
SLIME="$(dirname $0)/../../../.."
export LOGS="${SLIME}/local/test/jsh/launcher/suite-under-jdk-11"
export RHINO="mozilla/1.7.12"
$(dirname $0)/suite-with-clean-jdk-install.bash --install-jdk-11
