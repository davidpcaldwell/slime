//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	TODO	this is now run via jsh.loader.run, from develop.jsh.js, which is sloppy but was an easy way to wrap a jsh script

//var parameters = jsh.script.getopts({
//	options: {
//		base: jsh.file.Pathname,
//		year: false,
//		debug: false
//	}
//});

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var invocation = jsh.script.cli.invocation(
			$api.Function.pipe(
				jsh.script.cli.option.boolean({ longname: "fix" })
			)
		);

		var licenses = new jsh.document.Document({ string: jsh.script.file.parent.getFile("licenses.xml").read(String) });
		var input = {
			parameters: {
				options: {
					base: jsh.script.file.parent.parent.parent.pathname
				}
			},
			$loader: new jsh.file.Loader({ directory: jsh.script.file.parent }),
			getLicense: function(name) {
				var child = licenses.document.getElement().child(jsh.js.document.filter({ elements: name }));
				var text = child.children[0].getString();
				return text.substring(1,text.length-1);
			},
			fail: function() {
				jsh.shell.exit(1);
			}
		};
		var parameters = input.parameters;
		var getLicense = input.getLicense;
		var $loader = input.$loader;

		var BASE = parameters.options.base.directory;

		var isTxtTestData = function(node) {
			if (!node.pathname)
				debugger;
			return /\.txt$/.test(node.pathname.basename) && /\/test\//.test(node.pathname.toString());
		};

		var isXlsTestData = function(node) {
			if (!node.pathname) {
				debugger;
			}
			return (
				(
					/\.xls$/.test(node.pathname.basename)
					|| /\.xlsx$/.test(node.pathname.basename)
				)
				&& /\/test\//.test(node.pathname.toString())
			);
		};

		//	TODO	thought about using git-ls-tree here, but it wouldn't deal with local uncommited changes, and we want this to be
		//			part of the commit process. So going to replicate some stuff from .gitignore here.
		var files = BASE.list({
			filter: function(n) {
				return !n.directory
					&& n.pathname.basename != ".gitignore"
					&& n.pathname.basename != ".project"
					&& n.pathname.basename != ".classpath"
					&& n.pathname.basename != ".DS_Store"
					&& !/\.iml$/.test(n.pathname.basename)
					&& !isTxtTestData(n)
					&& !isXlsTestData(n)
					&& n.pathname.basename != "LICENSE"
					//	can be a file rather than a directory when this repository is a submodule
					&& n.pathname.basename != ".git"
				;
			},
			descendants: function(dir) {
				return dir.pathname.basename != ".git"
					&& dir.pathname.basename != "local"
					&& dir.pathname.basename != ".gradle"
					&& dir.pathname.basename != ".settings"
					&& dir.pathname.basename != "bin"
					&& dir.pathname.basename != ".idea"
			},
			type: jsh.file.list.ENTRY
		}).sort(function(a,b) {
			if (a.path < b.path) return -1;
			if (b.path < a.path) return 1;
			return 0;
		});

		/** @type { (p: any) => { path: string, node: slime.jrunscript.file.File } } */
		var toFile = function(entry) {
			return {
				path: entry.path,
				node: entry.node
			}
		}

		if (false) jsh.shell.console("files = " + files.length);
		if (false) jsh.shell.console(
			files.map(
				function(entry) { return entry.path; }
			).join("\n")
		);

		var licenses = $loader.file("license.js", {
			getLicense: function(name) {
				return getLicense(name);
			}
		});

		var getExtension = function(file) {
			var tokens = file.node.pathname.basename.split(".");
			if (tokens.length == 1) return null;
			return tokens[tokens.length-1];
		}

		var template = licenses.mpl["2.0"];

		// var extensions = {};
		// for (var i=0; i<files.length; i++) {
		// 	var extension = getExtension(files[i]);
		// 	//jsh.shell.echo(extension);
		// 	if (!extensions[extension]) {
		// 		extensions[extension] = [];
		// 	}
		// 	extensions[extension].push(files[i].node.pathname.toString());
		// }
		//for (var x in extensions) {
		//	jsh.shell.echo(x + ": " + extensions[x]);
		//	jsh.shell.echo("");
		//}

		var updated = false;
		for (var i=0; i<files.length; i++) {
			var file = files[i];
			var extension = getExtension(file);
			if (files[i].path == ".eslintrc.json") extension = "js";
			if (files[i].path == "jsconfig.json") extension = "js";
			if (files[i].path == "rhino/tools/github/tools/dtsgen.json") extension = "js";
			if (files[i].path == "rhino/tools/docker/tools/dtsgen.json") extension = "js";
			if (files[i].path == "tools/wf/test/data/plugin-standard/jsconfig.json") extension = "js";
			if (files[i].path == "tools/fifty/vscode-tasks-obsolete.json") extension = "js";
			if (extension == "json" && files[i].path.split("/")[0] == ".vscode") extension = "js";
			if (files[i].path == "loader/jrunscript/test/data/ServiceLoader/META-INF/services/java.lang.Runnable") extension = "properties";
			if (extension === null) {
				if (files[i].path == "Dockerfile") extension = "Dockerfile";
				if (files[i].path == "contributor/hooks/pre-commit") extension = "bash";
				if (files[i].path == "fifty") extension = "bash";
				if (files[i].path == "wf") extension = "bash";
				if (files[i].path == "contributor/docker-compose-run") extension = "bash";
				if (!extension) throw new Error("Extension null for " + files[i].path);
			}
			var text = toFile(file).node.read(String);
			text = text.replace(/\r\n/g, "\n");
			if (!licenses.languages[extension]) throw new Error("Not found: " + extension + " for " + files[i].path);
			var source = new licenses.SourceFile(text.split("\n"), licenses.languages[extension], template);
			if (false) jsh.shell.console("Processing: " + files[i].path + " ...");
			if (source.license) {
				var UPGRADE_LICENSE = true;
				if (UPGRADE_LICENSE) {
					var before = source.license;
					source.license = source.license;
					var after = source.license;
					if (after == null) {
						jsh.shell.console("No license in " + source);
						throw new Error("No license after update");
					}
					if (before.toString() != after.toString()) {
						jsh.shell.console("Changing license for " + files[i].path);
					}
				}
				//jsh.shell.echo("file = " + file.node + " license = " + jsh.js.toLiteral(source.license));
			} else {
				jsh.shell.console("Adding license for " + files[i].path);
				var path = file.path;
				var relative = file.node.pathname.toString().substring(BASE.toString().length);
				if (path != relative) {
					throw new Error();
				}

				source.license = {};
			}
			var current = text;
			var proposed = source.toString();
			if (current != proposed) {
				if (!invocation.options.fix) {
					jsh.shell.echo("Would update license in " + file.node.pathname);
					updated = true;
				} else {
					file.node.pathname.write(proposed, { append: false });
					updated = true;
				}
			}
		}

		function old() {


			//jsh.shell.echo(template.original.parser.toString());
			//jsh.shell.echo(template.introduction.parser.toString());
			//jsh.shell.echo(template.introduction.create());

		}
		jsh.shell.exit( (updated) ? 1 : 0 );
	}
//@ts-ignore
)($api,jsh);
