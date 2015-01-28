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
		return "Google Chrome: " + b.program + " user=" + b.user;
	}

	this.User = function(u) {
		var Data = function(p) {
			this.getProfileDirectory = function(x) {
				return p.base.getSubdirectory(x);
			}

			this.read = function(path) {
				return eval("(" + p.base.getFile(path).read(String) + ")");
			}

			var localState = this.read("Local State");
			var profiles = localState.profile.info_cache;

			var ProfileData = function(p) {
				this.name = p.name;
				this.data = p.data;

				this.read = function(path) {
					return eval("(" + p.base.getFile(path).read(String) + ")");
				}
			};

			this.profiles = [];
			for (var x in profiles) {
				this.profiles.push(new ProfileData({
					name: x,
					base: this.getProfileDirectory(x),
					data: profiles[x]
				}));
			};
		};

		var open = function(m) {
			var running = u.directory.list().filter(function(node) {
				return node.pathname.basename == "RunningChromeVersion";
			}).length > 0;

			var args = [];

			var addProfileArguments = function() {
				if (u.directory) args.push("--user-data-dir=" + u.directory);
				if (m.profile) args.push("--profile-directory=" + m.profile);
			};


			if (running) {
				addProfileArguments();
				args.push(m.uri);
				Packages.java.lang.System.err.println("using program: args = " + JSON.stringify(args));
				$context.run({
					command: b.program,
					arguments: args,
					on: {
						start: function(p) {
							if (m.on && m.on.start) {
								m.on.start.call(m,p);
							}
						}
					}
				});
			} else {
				args.push("-b","com.google.Chrome");
				args.push(m.uri);
				args.push("--args");
				addProfileArguments();
				Packages.java.lang.System.err.println("using open: args = " + JSON.stringify(args));
				$context.run({
					command: "/usr/bin/open",
					arguments: args
				});
			}
		}

		var Profile = function(data) {
			this.name = data.data.name;

			this.open = function(m) {
				open($context.api.js.Object.set({}, m, {
					profile: data.name
				}));
			}
		}

		var data = new Data({ base: u.directory });
		this.profiles = data.profiles.map(function(profile) {
			return new Profile(profile);
		});

		this.open = function(m) {
			open(m);
		}
	};

	if (b.user) {
		this.user = new this.User({
			directory: b.user
		});
	}
}

if ($context.os.name == "Mac OS X") {
	if ($context.api.file.Pathname("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").file) {
		$exports.chrome = new Chrome({
			program: $context.api.file.Pathname("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").file,
			user: $context.HOME.getSubdirectory("Library/Application Support/Google/Chrome")
		});
	}
}