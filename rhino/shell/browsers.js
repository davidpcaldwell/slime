//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var Chrome = function(b) {
	this.toString = function() {
		return "Google Chrome: " + b.program;
	}

	this.User = function(u) {
		this.open = function(m) {
			$context.run({
				command: b.program,
				arguments: [
					"--user-data-dir=" + u.directory,
					m.uri
				],
				on: {
					start: function(p) {
						if (m.on && m.on.start) {
							m.on.start.call(m,p);
						}
					}
				}
			});
		}
	};
}

if ($context.os.name == "Mac OS X") {
	if ($context.api.file.Pathname("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").file) {
		$exports.chrome = new Chrome({
			program: $context.api.file.Pathname("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").file
		});
	}
}