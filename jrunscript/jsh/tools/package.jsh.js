//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.jrunscript.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,$api,jsh) {
		var getRhinoInstallation = function() {
			if (jsh.internal.api.rhino.compatible().local(jsh.shell.jsh.lib.pathname.os.adapt())) {
				var installed = jsh.internal.api.rhino.compatible().local(jsh.shell.jsh.lib.pathname.os.adapt());
				if (installed.length != 1) throw new Error("Unreachable.");
				jsh.shell.console("Adding Rhino to arguments for building shell ...");
				return jsh.file.Pathname(installed[0].pathname);
			} else {
				jsh.shell.console("Rhino not found in " + jsh.shell.jsh.lib + ".");
				return void(0);
			}
		};

		if (!jsh.shell.jsh.home) {
			jsh.test.requireBuiltShell({
				rhino: getRhinoInstallation(),
				src: void(0)
			});
		}

		var parameters = jsh.script.getopts({
			options: {
				script: jsh.file.Pathname
				//	module format is name=pathname
				,module: jsh.script.getopts.ARRAY(String)
				//	file format is topath=pathname
				,file: jsh.script.getopts.ARRAY(String)
				,plugin: jsh.script.getopts.ARRAY(jsh.file.Pathname)
				,directory: false
				,to: jsh.file.Pathname
				,norhino: false
			}
		});

		var UNZIP_RHINO_WHEN_PACKAGING = !parameters.options.norhino;

		if (!parameters.options.to) {
			jsh.shell.echo("Required: -to <pathname>");
			jsh.shell.exit(1);
		}

		if (!parameters.options.script) {
			jsh.shell.echo("Required: -script <pathname>");
			jsh.shell.exit(1);
		}

		if (!parameters.options.script.file) {
			jsh.shell.echo("Not found: -script " + parameters.options.script);
			jsh.shell.exit(1);
		}

		var slime = jsh.loader.file(jsh.script.file.parent.getRelativePath("slime.js")).slime;

		var compile = function(args) {
			Packages.javax.tools.ToolProvider.getSystemJavaCompiler().run(
				Packages.java.lang.System["in"],
				Packages.java.lang.System.out,
				Packages.java.lang.System.err,
				jsh.java.toJavaArray( args, Packages.java.lang.String, function(x) { return new Packages.java.lang.String(x) } )
			);
		}

		/** @type { slime.jrunscript.file.Directory } */
		var to = (function() {
			if (parameters.options.directory) return parameters.options.to.createDirectory({ ifExists: function(d) { d.remove(); return true; }, recursive: true });
			return jsh.file.filesystems.os.Pathname(String(jsh.shell.properties.object.java.io.tmpdir)).directory.createTemporary({ directory: true });
		})();

		var JSH = jsh.shell.jsh.home;

		jsh.shell.console("Using built shell at " + JSH + " to package.");

		if (UNZIP_RHINO_WHEN_PACKAGING) {
			var installedRhino = jsh.internal.api.rhino.compatible().local(jsh.shell.jsh.lib.pathname.os.adapt());
			if (!installedRhino) throw new Error("No Rhino present.");
			installedRhino.forEach(function(rhino) {
				jsh.file.unzip({ zip: jsh.file.Pathname(rhino.pathname).file, to: to });
			});
		}
		if (!parameters.options.norhino) {
			var installedRhino = jsh.internal.api.rhino.compatible().local(jsh.shell.jsh.lib.pathname.os.adapt());
			if (!installedRhino) throw new Error("No Rhino present.");
			if (installedRhino.length != 1) throw new Error("Unreachable.");
			var rhino = jsh.file.Pathname(installedRhino[0].pathname).file;
			jsh.shell.console("Including rhino.jar from " + rhino.pathname + " ...");
			to.getRelativePath("$jsh/rhino.jar").write(rhino.read(jsh.file.Streams.binary), { recursive: true });
		}

		jsh.file.unzip({ zip: JSH.getFile("jsh.jar"), to: to });
		["jsh.js","slime.js","launcher.js","javac.js"].forEach(function(name) {
			to.getRelativePath("$jsh/launcher/" + name).write(JSH.getFile(name).read(String), { recursive: true });
		});

		jsh.file.unzip({ zip: JSH.getFile("lib/jsh.jar"), to: to });

		JSH.getSubdirectory("script/loader").copy(to.getRelativePath("$jsh/loader"), { recursive: true });
		JSH.getSubdirectory("script/jsh").list().forEach(function(node) {
			if (/\.js/.test(node.pathname.basename)) {
				/** @type { slime.js.Cast<slime.jrunscript.file.File> } */
				var asFile = $api.fp.cast.unsafe;

				var file = asFile(node);
				to.getRelativePath("$jsh/" + node.pathname.basename).write(file.read(String));
			}
		});

		JSH.getSubdirectory("modules").list().forEach( function(module) {
			var tokens = module.pathname.basename.split(".");
			tokens = tokens.slice(0,tokens.length-1);
			jsh.shell.console("Creating: " + tokens.join("/"));
			var destination = to
				.getRelativePath("$jsh/modules/" + tokens.join("/"))
				.createDirectory({ exists: function(dir) { return false; }, recursive: true })
			;
			jsh.shell.console("Created " + destination);
			jsh.file.unzip({ zip: module, to: destination });
		} );

		//	TODO	This is undesirable hard-coding
		if (JSH.getFile("bin/inonit.script.runtime.io.cygwin.cygpath.exe")) {
			to.getRelativePath("$jsh/bin/inonit.script.runtime.io.cygwin.cygpath.exe")
				.write(JSH.getFile("bin/inonit.script.runtime.io.cygwin.cygpath.exe").read(jsh.io.Streams.binary), { recursive: true })
			;
		}

		//	TODO	this implementation of plugins is essentially dependent on launcher jsh.rhino.js
		//	TODO	this is pretty awful, blindly copying all shell modules into the plugins directory
		var plugins = JSH.getSubdirectory("modules").list().map(function(node) { return node.pathname; }).concat(parameters.options.plugin);
		plugins.forEach( function(library,index) {
			var toUnixPath = function(pathname) {
				if (jsh.file.filesystems.cygwin) {
					return jsh.file.filesystems.cygwin.toUnix(pathname);
				}
				return pathname;
			}

			var destination = "$plugins/" + String(index) + ".slime";

			if (false) {
			} else if (library.directory) {
				jsh.shell.console("Creating " + library.directory.toString() + " as " + destination + " ...");
				jsh.shell.jsh({
					script: jsh.script.getRelativePath("slime.jsh.js"),
					arguments: [
						"-from", library.directory.toString(),
						"-to", toUnixPath(to.getRelativePath("$plugins/" + String(index) + ".slime")).toString()
					]
				});
				jsh.shell.console("Created " + destination);
			} else if (/\.jar$/.test(library.basename)) {
				jsh.shell.console("Creating " + library + " as " + destination + " ...");
				to.getRelativePath("$plugins/" + String(index) + ".jar").write( library.file.read(jsh.file.Streams.binary), { recursive: true });
			} else if (/\.slime/.test(library.basename)) {
				jsh.shell.console("Creating " + library + " as " + destination + " ...");
				to.getRelativePath("$plugins/" + String(index) + ".slime").write( library.file.read(jsh.file.Streams.binary), { recursive: true });
			} else {
				throw new Error("Unimplemented: not directory, not .jar, not .slime: " + library);
			}
		} );

		parameters.options.module.forEach( function(module) {
			var tokens = module.split("=");
			var name = tokens[0];
			var pathname = jsh.file.Pathname(tokens[1]);
			if (pathname.directory) {
				slime.build.jsh(pathname.directory,to.getRelativePath("$packaged/" + name).createDirectory({recursive: true}));
			} else {
				throw new Error("Did not find module at " + pathname);
			}
		} );

		parameters.options.file.forEach( function(file) {
			var tokens = file.split("=");
			var topath = tokens[0];
			var pathname = jsh.file.Pathname(tokens[1]);
			to.getRelativePath("$packaged/" + topath).write(pathname.file.read(jsh.io.Streams.binary), { append: false, recursive: true });
		});

		to.getRelativePath("main.jsh.js").write(parameters.options.script.file.read(jsh.io.Streams.binary));

		if (!parameters.options.directory) {
			parameters.options.to.parent.createDirectory({ ifExists: function(d) { return false; }});
			jsh.file.zip({ from: to.pathname, to: parameters.options.to });
		}
	}
//@ts-ignore
)(Packages,$api,jsh);
