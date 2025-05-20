#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

FROM debian AS bare
COPY . /slime

FROM bare AS test
RUN apt update && apt install -y git
RUN /bin/bash /slime/contributor/devcontainer/install-x-libraries
