//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	this code is currently unused but was used to build the JNI-based native launcher when it existed. Keeping around
//			because it shows how to add JNI to the "capabilities" of the JVM on OS X, in case native code makes its way into the
//			shell
var osx = new function() {
	var jdk = jsh.shell.java.home.parent;
	var parse = function() {
		var file = jdk.parent.getFile("Info.plist");
		var plist = new jsh.document.Document({ file: file });
		var capabilitiesArray = (function(plist) {
			var top = plist.document.getElement();
			var dict = top.children.filter(function(node) {
				return node.element && node.element.type.name == "dict";
			})[0];
			var isCapabilitiesKey = function(child) {
				return child.element && child.element.type.name == "key" && child.children[0].getString() == "JVMCapabilities";
			};
			var javavm = dict.children.filter(function(node) {
				return node.element && node.element.type.name == "dict" && node.children.filter(isCapabilitiesKey)[0];
			})[0];
			var next;
			for (var i=0; i<javavm.children.length; i++) {
				if (isCapabilitiesKey(javavm.children[i])) {
					next = true;
				} else if (next && javavm.children[i].element) {
					return javavm.children[i];
				}
			}
		})(plist);
		var indentInner = capabilitiesArray.children[0].getString();
		var capabilities = [];
		for (var i=0; i<capabilitiesArray.children.length; i++) {
			if (capabilitiesArray.children[i].element) {
				capabilities.push(capabilitiesArray.children[i].children[0].getString());
			}
		}
		return {
			file: file,
			plist: plist,
			element: capabilitiesArray,
			array: capabilities,
			indent: {
				inner: indentInner
			}
		}
	}

	this.check = function() {
		//	Check whether we can build native launcher
		var parsed = parse();
		jsh.shell.echo("Capabilities: [" + parsed.array + "]");
		if (parsed.array.indexOf("JNI") == -1) {
			var SUDO_ASKPASS = jsh.shell.java({
				jar: install.getFile("jsh.jar"),
				arguments: [install.getFile("src/rhino/tools/askpass.jsh.js"), "-prompt", "Enter password to modify JDK installation"],
				stdio: {
					output: String
				},
				evaluate: function(result) {
					return result.stdio.output;
				}
			});
//			var SCRIPT = jsh.shell.TMPDIR.createTemporary({ prefix: "askpass.", suffix: ".bash" });
//			SCRIPT.remove();
//			SCRIPT.pathname.write("#!/bin/bash"
//				+ "\n" + jsh.shell.java.launcher + " -jar " + install.getRelativePath("jsh.jar")
//				+ " " + install.getRelativePath("src/rhino/tools/askpass.jsh.js")
//				+ " " + "\"Enter password to modify JDK installation\""
//			);
//			jsh.shell.run({
//				command: "chmod",
//				arguments: ["+x", SCRIPT.toString()]
//			});
			jsh.shell.echo("SUDO_ASKPASS: [" + SUDO_ASKPASS + "]");
			jsh.shell.echo("Cannot build Mac OS X native installer; JDK must be modified to include JNI capability.");
			jsh.shell.echo("To build native launcher, enter password in the graphical dialog displayed.");
//			var password = jsh.shell.run({
//				command: "/bin/bash",
//				arguments: [ SUDO_ASKPASS ],
//				stdio: {
//					output: String
//				}
//			});
			//	TODO	jsh.shell.os.sudo should be adapted for this purpose
//			jsh.shell.echo("script: " + SCRIPT);
			var SUDO_ASKPASS_WORKS = true;
			//	TODO	try to get SUDO_ASKPASS to work by appending newline?
			if (SUDO_ASKPASS_WORKS) {
				jsh.shell.run({
					command: "sudo",
					arguments: ["-k", "-A", jsh.shell.java.launcher, "-jar", install.getRelativePath("jsh.jar"), install.getRelativePath("etc/install.jsh.js"), "-OSX-add-JNI-to-JVMCapabilities"],
					environment: jsh.js.Object.set({}, jsh.shell.environment, {
						SUDO_ASKPASS: SUDO_ASKPASS
					}),
					evaluate: function(result) {
						if (result.status) {
							jsh.shell.echo("Running env SUDO_ASKPASS=" + SUDO_ASKPASS + " " + result.command + " " + result.arguments.join(" "));
							throw new Error("Exit status " + result.status);
						}
					}
				});
			} else {
				var password = jsh.shell.run({
					command: "/bin/bash",
					arguments: [ SUDO_ASKPASS ],
					stdio: {
						output: String
					}
				});
				jsh.shell.run({
					command: "sudo",
					arguments: ["-k", "-S", jsh.shell.java.launcher, "-jar", install.getRelativePath("jsh.jar"), install.getRelativePath("etc/install.jsh.js"), "-OSX-add-JNI-to-JVMCapabilities"],
					stdio: {
						input: password + "\n"
					},
					evaluate: function(result) {
						if (result.status) {
							jsh.shell.echo("Running env SUDO_ASKPASS=" + SUDO_ASKPASS + " " + result.command + " " + result.arguments.join(" "));
							throw new Error("Exit status " + result.status);
						}
					}
				});
			}
			var success = (parse().array.indexOf("JNI") != -1);
			if (!success) {
				jsh.shell.echo("Could not build native launcher: " + parsed.file + " does not contain JNI in JVMCapabilities.");
				jsh.shell.exit(1);
			}
		}
	};

	this.fix = function() {
		var parsed = parse();
		parsed.element.children.splice(parsed.element.children.length-1,0,
			new jsh.js.document.Text({ text: parsed.indent.inner }),
			new jsh.js.document.Element({
				type: {
					name: "string"
				},
				children: [
					new jsh.js.document.Text({ text: "JNI" })
				]
			})
		);
		jsh.shell.echo("Would write to " + parsed.file);
		jsh.shell.echo(parsed.plist);
		parsed.file.pathname.write(parsed.plist.toString(), { append: false });
	}
}

if (parameters.options["OSX-add-JNI-to-JVMCapabilities"]) {
	osx.fix();
	jsh.shell.exit(0);
}

