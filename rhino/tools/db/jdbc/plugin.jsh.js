//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return Boolean(jsh.js) && Boolean(jsh.java) && Boolean(jsh.shell);
	},
	load: function() {
		if (!jsh.db) jsh.db = {};
		//	Try to find Derby
		//	Not present with Apple JDK 6
		if (jsh.shell.java.home.getSubdirectory("db")) {
			jsh.loader.java.add(jsh.shell.java.home.getSubdirectory("db").getRelativePath("lib/derby.jar"));
		} else if (jsh.shell.java.home.getRelativePath("../db").directory) {
			jsh.loader.java.add(jsh.shell.java.home.getRelativePath("../db/lib/derby.jar"));
		}
		//	TODO	this does not seem to be a complete list of context properties
		jsh.db.jdbc = $loader.module("module.js", {
			api: {
				js: jsh.js,
				java: jsh.java,
				io: jsh.io,
				shell: jsh.shell
			},
			getJavaClass: function(name) {
				return jsh.java.getClass(name);
			}
		});

		/**
		 *
		 * @param { { to: slime.jrunscript.file.Pathname } } p
		 */
		jsh.db.jdbc.mysql.install = function(p) {
			if (jsh.shell.os.name == "Mac OS X") {
				jsh.tools.install.install({
					url: "https://downloads.mysql.com/archives/get/p/23/file/mysql-8.0.23-macos10.15-x86_64.tar.gz",
					to: p.to
				});
				return {
					server: function(pp) {
						return new jsh.db.jdbc.mysql.server.Server(
							$api.Object.compose(
								{
									base: p.to.directory,
									//	TODO	do not hard-code
									port: 3306,
									data: (pp && pp.data) ? pp.data : void(0)
								}
							)
						);
					}
				}
			}
		}
	}
})