[comment]: # (	LICENSE)
[comment]: # (	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not)
[comment]: # (	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.)
[comment]: # ()
[comment]: # (	END LICENSE)

<!--
	LICENSE
	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

	END LICENSE
-->

# Personal VS Code Remote Settings Overlay Example

Copy the JSON below into:

`local/devcontainer/vscode-user-settings.overlay.json`

```json
{
	"chat.agent.sandbox.enabled": "off",
	"chat.permissions.default": "autoApprove",
	"chat.tools.global.autoApprove": true,
	"chat.tools.terminal.enableAutoApprove": true,
	"chat.tools.terminal.ignoreDefaultAutoApproveRules": true,
	"chat.tools.terminal.autoApprove": {
		".*": true
	}
}
```
