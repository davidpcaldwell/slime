[comment]: # (	LICENSE)
[comment]: # (	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not)
[comment]: # (	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.)
[comment]: # ()
[comment]: # (	END LICENSE)

# Bootstrapping by executing a remote bash script directly from GitHub

The `cat` script can be used for this purpose, with code like this:

```shell
# If there is a personal access token needed because the bootstrap script is in a private repository, create a file containing the
# token and export its location as GITHUB_PAT_FILE
export GITHUB_PAT_FILE="$(dirname "$0")/pat"

# The GITHUB_PAT variable can be provided to the downloaded script as below if the script needs the value for some reason.
curl -H "Accept: application/vnd.github.v3.raw" \
    "https://api.github.com/repos/davidpcaldwell/slime/contents/rhino/tools/github/cat" \
    | bash -s davidpcaldwell/slime rhino/tools/github/test/cat-hello.sh \
    | GITHUB_PAT=$(cat "$GITHUB_PAT_FILE") bash -s "$@"
```
