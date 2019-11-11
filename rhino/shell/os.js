//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var ps = new function() {
	var unix = function() {
		//	Was thinking about developing an algorithm to try to detect left- and right-justification using the header
		//	row, but instead going to try an approach where we determine justification by experiment and hard-code it in the code.
		//	There are some constraints about justification and spaces; see the loop that determines the column indices in evaluate()
		//	for details.
		var columns = [{ name: "pid", align: "right" },{ name: "ppid", align: "right" },{ name: "command", align: "left", spaces: true }];
		var args = ["-A"];
		columns.forEach(function(column) {
			args.push("-o",column.name);
		});
		var result = $context.run({
			command: "ps",
			arguments: args,
			stdio: {
				output: String,
				error: String
			},
			evaluate: function(result) {
				if (result.status != 0) {
					throw new Error("ps failed.");
				} else {
					var lines = result.stdio.output.split("\n");
					var headers = lines[0];
					var startIndex = function(i) {
						return headers.indexOf(columns[i].name.toUpperCase());
					}
					var endIndex = function(i) {
						return headers.indexOf(columns[i].name.toUpperCase()) + columns[i].name.length;
					}
					var indices = [];
					indices[0] = 0;
					for (var i=1; i<columns.length; i++) {
						if (columns[i].align == "left") {
							indices[i] = startIndex(i);
						} else if (columns[i-1].align == "right") {
							indices[i] = endIndex(i-1) + 1;
						} else /* left followed by right; determine demarcation */ {
							if (!columns[i].spaces) {
								//	determine last column in range that is always a space
								throw new Error("Unimplemented.");
							} else if (!columns[i-1].spaces) {
								//	determine first column in range that is always a space
								throw new Error("Unimplemented.");
							} else {
								//	TODO	probably should try to see if there is a single space-only column, and if not, fail,
								//			but for now will just fail
								throw new Error("Cannot have two consecutive ps processes that can contain spaces");
							}
						}
					}
					var processes = lines.slice(1,lines.length-1);
					var byId = {};
					var rv = [];
					processes.forEach(function(line) {
						var object = {
							children: []
						};
						rv.push(object);
						for (var i=0; i<columns.length; i++) {
							var value = line.substring(indices[i],indices[i+1]).trim();
							if (columns[i].name == "pid") {
								object.id = Number(value);
								byId[object.id] = object;
							} else if (columns[i].name == "ppid") {
								object.parent = { id: Number(value) };
							} else {
								object[columns[i].name] = value;
							}
						}
					});

					var kill = function(p) {
						$context.run({
							command: "kill",
							arguments: [
								String(this.id)
							]
						});
					}

					rv.forEach(function(process) {
						process.kill = kill;
						var parent = byId[process.parent.id];
						if (parent) {
							process.parent = parent;
							parent.children.push(process);
						}
					});
					return rv;
					//	TODO	probably we want to check for columns in which every line has a space and use those as delimiters;
					//			consecutive numbers should be collapsed; then again perhaps should count consecutive non-space
					//			columns; think of 1-line ps with a space in the COMMAND column; this would not work properly either,
					//			more thinking required
				}
			}
		});
		return result;
	}

	this["Mac OS X"] = unix;

	this.Linux = unix;
};
$exports.ps = ps;

if ($context.os.name == "Mac OS X") {
	var correctPassword;
	var sudo = function(p) {
		if (!correctPassword) {
			if (p.password) {
				if (typeof(p.password) == "string") {
					arguments.callee.initialize(p.password);
				} else if (typeof(p.password) == "function") {
					arguments.callee.initialize(p.password());
				} else {
					throw new TypeError("p.password is incorrect type: " + typeof(p.password));
				}
			} else {
				throw new arguments.callee.PasswordRequired("Password required for sudo.");
			}
		}
		var args = [p.command];
		if (p.arguments) {
			args.push.apply(args,p.arguments);
		}
		$context.run($context.api.js.Object.set({}, p, {
			command: "sudo",
			arguments: args
		}));
	};
	sudo.PasswordIncorrect = $context.api.js.Error.Type("PasswordIncorrect");
	sudo.PasswordRequired = $context.api.js.Error.Type("PasswordRequired");
	//	TODO	the below method results in 3 failures from OS point of view; apparently askpass program is run three times before
	//			giving up. Is there a way to verify password in one try and then use it?
	//	TODO	developing a true graphical program would be one way to deal with the above
	sudo.initialize = function(password) {
		$context.run({
			command: "sudo",
			arguments: ["-k"]
		});
		var script = $context.TMPDIR.createTemporary({ prefix: "askpass", suffix: ".bash" });
		script.remove();
		var writer = script.pathname.write($context.api.io.Streams.text);
		writer.write("#!/bin/bash\n")
		writer.write("echo " + password);
		writer.close();
		//	TODO	should somehow attach this to rhino/file/ file object
		$context.run({
			command: "chmod",
			arguments: ["+x", script.pathname]
		});
		$context.run({
			command: "sudo",
			arguments: ["-A", "sleep", "0"],
			environment: $context.api.js.Object.set({}, $context.environment, {
				SUDO_ASKPASS: script.pathname.toString()
			}),
			stdio: {
				error: null
			},
			evaluate: function(result) {
				if (result.status == 1) {
					throw new sudo.PasswordIncorrect("Incorrect password.");
				}
			}
		});
		script.remove();
		correctPassword = password;
	};
	$exports.sudo = sudo;
	$exports.sudo.desktop = function(p) {
		if (p.askpass && (p.askpass.author || p.askpass.prompt)) {
			var args = (p.arguments) ? p.arguments : [];
			if (true) {
				//	TODO	could check to see whether password is necessary; currently askpass.force is essentially implied
				if (false) {
					var SUDO_ASKPASS = $context.run($context.api.js.Object.set({}, p.askpass.author, {
						stdio: {
							output: String
						},
						evaluate: function(result) {
							return $context.api.file.Pathname(result.stdio.output).file;
						}
					}));
					var password = $context.run({
						command: SUDO_ASKPASS.pathname,
						stdio: {
							output: String
						},
						evaluate: function(result) {
							return result.stdio.output;
						}
					});
				} else {
					var password = jsh.ui.askpass.gui({
						prompt: p.askpass.prompt
					});
				}
				var stdio = $context.api.js.Object.set({}, (p.stdio) ? p.stdio : {}, {
					input: password + "\n"
				});
				return $context.run($context.api.js.Object.set({}, p, {
					command: "sudo",
					arguments: /*(p.askpass.force ? ["-k"] : [])*/[].concat(["-S"]).concat([p.command]).concat(args),
					stdio: stdio
				}));
			} else {
				//	For some reason the -A strategy just did not work on Mac OS X 10.9.5
				return $context.run($context.api.js.Object.set({}, p, {
					command: "sudo",
					arguments: (p.askpass.force ? ["-k"] : []).concat(["-A"]).concat([p.command]).concat(args),
					environment: $context.api.js.Object.set({}, $context.environment, {
						SUDO_ASKPASS: SUDO_ASKPASS.pathname.toString()
					})
				}));
			}
		}
	};

	$exports.ping = function(p) {
		//	tested on Mac OS X
		//	TODO	where should stderr go?
		return $context.run({
			command: "ping",
			arguments: (function(rv) {
				rv.push("-c","1");
				if (p.timeout) {
					rv.push("-t",String(p.timeout));
				}
				rv.push(p.host);
				return rv;
			})([]),
			stdio: {
				output: String
			},
			evaluate: function(result) {
				var successline = result.stdio.output.split("\n")[1];
				var successmatch = /(?:.*)time\=(\d+\.\d+) ms$/;
				var success;
				if (successline && successmatch.test(successline)) {
					success = Number(successmatch.exec(successline)[1]) / 1000;
				}
				return {
					status: result.status,
					output: result.stdio.output.split("\n"),
					success: success
				}
			}
		});
	}
} else if ($context.os.name == "Linux") {

}

if ($context.os.name == "Mac OS X") {
	$context.api.file.Searchpath = (function(was) {
		return function() {
			var rv = was.apply(this,arguments);
			rv.getCommand = (function(was) {
				return function(name) {
					var directoryExists = function(path) {
						return $context.api.file.Pathname(path).directory;
					}

					if (name == "git" || name == "gcc" || name == "clang++") {
						if (!directoryExists("/Applications/Xcode.app") && !directoryExists("/Library/Developer/CommandLineTools")) {
							return null;
						}
					}
					return was.apply(this,arguments);
				}
			})(rv.getCommand);
			return rv;
		}
	})($context.api.file.Searchpath);
	$context.replacePath($context.api.file.Searchpath($context.PATH.pathnames));
}