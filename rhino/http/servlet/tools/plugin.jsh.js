//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return true;
	},
	load: function() {
		if (!jsh.httpd) {
			jsh.httpd = {};
		}
		jsh.httpd.tools = {};
		jsh.httpd.tools.build = function(p) {
			if (!p.destination.directory) {
				p.destination.directory = jsh.shell.TMPDIR.createTemporary({ directory: true });
			}
			var WEBAPP = p.destination.directory;
			WEBAPP.getRelativePath("WEB-INF").createDirectory();
			if (p.rhino) {
				(function() {
					//	Get the path of Rhino in this shell, assume it is a file, and copy it to WEB-INF/lib
					if (jsh.shell.rhino) {
						if (jsh.shell.rhino.classpath.pathnames.length == 1) {
							var rhino = jsh.shell.rhino.classpath.pathnames[0];
							if (/\.jar$/.test(rhino.basename)) {
								var destination = WEBAPP.getRelativePath("WEB-INF/lib").createDirectory();
								rhino.file.copy(destination.getRelativePath("js.jar"));
							} else {
								throw new Error("Rhino not present; classpath=" + jsh.shell.rhino.classpath);
							}
						} else {
							throw new Error("Could not locate Rhino in classpath " + jsh.shell.rhino.classpath);
						}
					} else {
						throw new Error("Rhino not present.");
					}
				})();
			}
			var lib = WEBAPP.getRelativePath("WEB-INF/lib").createDirectory({
				ifExists: function(dir) {
					return false;
				}
			});
			if (p.libraries) {
				for (var x in p.libraries) {
					p.libraries[x].copy(lib.getRelativePath(x), { recursive: true });
				}
			}
			var SLIME = jsh.shell.jsh.src;
			if (!SLIME) {
				SLIME = jsh.shell.jsh.home.getSubdirectory("src");
			}
			(function compileSlimeCodeToWebapp() {
				var SERVLET = SLIME.getSubdirectory("rhino/http/servlet");
				//	Compile the servlet to WEB-INF/classes
				var classpath = jsh.file.Searchpath([]);
				classpath.pathnames.push(WEBAPP.getRelativePath("WEB-INF/lib/js.jar"));
				var CATALINA_HOME;
				if (jsh.shell.environment.CATALINA_HOME) CATALINA_HOME = jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory;
				if (!CATALINA_HOME) CATALINA_HOME = jsh.shell.jsh.lib.getSubdirectory("tomcat");
				if (!CATALINA_HOME) {
					throw new Error("Could not find Tomcat directory to locate servlet API");
				}
				jsh.shell.echo("CATALINA_HOME = " + CATALINA_HOME);
				classpath.pathnames.push(CATALINA_HOME.getRelativePath("lib/servlet-api.jar"));
				var sourcepath = jsh.file.Searchpath([]);
				sourcepath.pathnames.push(SLIME.getRelativePath("rhino/system/java"));
				sourcepath.pathnames.push(SLIME.getRelativePath("loader/jrunscript/java"));
				sourcepath.pathnames.push(SLIME.getRelativePath("loader/jrunscript/rhino/java"));
				sourcepath.pathnames.push(SLIME.getRelativePath("jrunscript/host/java"));
				if (p.rhino) {
					sourcepath.pathnames.push(SLIME.getRelativePath("jrunscript/host/rhino/java"));
				}
				sourcepath.pathnames.push(SLIME.getRelativePath("rhino/http/servlet/java"));
				if (p.rhino) {
					sourcepath.pathnames.push(SLIME.getRelativePath("rhino/http/servlet/rhino/java"));
				}
				var sources = [
					SERVLET.getRelativePath("java/inonit/script/servlet/Servlet.java"),
					SERVLET.getRelativePath("java/inonit/script/servlet/Nashorn.java")
				];
				if (p.rhino) {
					sources.push(
						SERVLET.getRelativePath("rhino/java/inonit/script/servlet/Rhino.java")
					);
				}
				jsh.java.tools.javac({
					destination: WEBAPP.getRelativePath("WEB-INF/classes"),
					classpath: classpath,
					sourcepath: sourcepath,
					source: (p.java && p.java.version) ? p.java.version : null,
					target: (p.java && p.java.version) ? p.java.version : null,
					arguments: sources.concat(p.compile.map(function(node) { return node.pathname })),
					on: new function() {
						this.exit = function(p) {
							jsh.shell.echo("Exit status of javac: " + p.status);
							if (p.status) {
								jsh.shell.echo("Compilation failure for arguments: " + p.arguments);
							}
						}
					}
				});
			})();

			(function copySlimeCodeToWebapp() {
				SLIME.getSubdirectory("loader").list().forEach(function(node) {
					//	TODO	dangerous as we move more code into the loader; was just expression.js and api.js
					if (!node.directory) {
						node.copy(WEBAPP.getRelativePath("WEB-INF/loader/" + node.pathname.basename), { recursive: true });
					}
				});
				SLIME.getSubdirectory("loader/jrunscript").list().forEach(function(node) {
					//	Was just expression.js
					if (/\.js$/.test(node.pathname.basename)) {
						node.copy(WEBAPP.getRelativePath("WEB-INF/loader/jrunscript/" + node.pathname.basename), { recursive: true });
					}
				});
				SLIME.getFile("rhino/http/servlet/api.js").copy(WEBAPP.getRelativePath("WEB-INF/api.js"));
				SLIME.getFile("rhino/http/servlet/server.js").copy(WEBAPP.getRelativePath("WEB-INF/server.js"));
				SLIME.getFile("rhino/http/servlet/upload.js").copy(WEBAPP.getRelativePath("WEB-INF/upload.js"));

				["js/debug","js/object","js/web","jrunscript/host","rhino/io","rhino/http/servlet/server"].forEach(function(path) {
					SLIME.getSubdirectory(path).copy(WEBAPP.getRelativePath("WEB-INF/slime/" + path), { recursive: true });
				});
			})();

			(function() {
				//	Obviously using an XML parser would be beneficial here if this begins to get more complex

				var xml = SLIME.getFile("rhino/http/servlet/tools/web.xml").read(String);
				xml = xml.replace(/__SCRIPT__/, p.servlet);
				//	The below line removes the license, because Tomcat cannot parse it; this may or may not be what we want
				xml = xml.substring(xml.indexOf("-->") + "-->".length + 1);

				var nextInitParamIndex;
				var lines = xml.split("\n");
				for (var i=0; i<lines.length; i++) {
					if (/\<\/init-param\>/.test(lines[i])) {
						nextInitParamIndex = i+1;
					}
				}
				var initParamLines = [];
				for (var x in p.parameters) {
					initParamLines = initParamLines.concat([
						"\t\t<init-param>",
						"\t\t\t<param-name>" + x + "</param-name>",
						"\t\t\t<param-value>" + p.parameters[x] + "</param-value>",
						"\t\t</init-param>"
					]);
				}
				var spliceArgs = [nextInitParamIndex,0].concat(initParamLines);
				lines.splice.apply(lines,spliceArgs);
				xml = lines.join("\n");

				WEBAPP.getRelativePath("WEB-INF/web.xml").write(xml, { append: false });
			})();

//			if (p.buildResources) {
//				p.buildResources();
//			} else if (p.Resources) {
				var resources = new jsh.httpd.Resources();
				p.Resources.call(resources);
				resources.build(WEBAPP);
//			}

			if (p.destination.war) {
				jsh.file.zip({
					from: p.destination.directory.pathname,
					to: p.destination.war
				});
			}
		};
		jsh.httpd.tools.build.getJavaSourceFiles = function(pathname) {
			if (pathname.directory) {
				var nodes = pathname.directory.list({
					recursive: true,
					type: pathname.directory.list.ENTRY
				}).filter(function(entry) {
					return /\.java/.test(entry.node.pathname.basename);
				}).map(function(entry) {
					return entry.node;
				});
				return nodes;
			} else {
				return [pathname.file];
			}
		}
	}
})