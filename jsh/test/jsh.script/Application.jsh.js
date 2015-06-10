//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

jsh.script.Application.run(new function() {
	this.options = {
		gstring: String,
		gboolean: false
	};

	this.commands = new function() {
		this.doIt = new function() {
			this.getopts = new function() {
				this.options = {
					lstring: "foo",
					lboolean: false
				};
			}

			this.run = function(p) {
				jsh.shell.echo(JSON.stringify(p));
			}
		}
	}
});