#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

#	Currently, the purpose of this Docker image is to provide facilities for developing SLIME itself; the image is not intended to
#	support any deployment use cases.

FROM debian
RUN apt update && apt install -y git chromium curl
#	Why running apt update again is necessary and this needs to be a separate layer is completely unknown as of this writing
# RUN apt update && apt install -y chromium
COPY contributor/devcontainer/boot /boot
RUN /bin/bash /boot/install-x-libraries
COPY . /slime
