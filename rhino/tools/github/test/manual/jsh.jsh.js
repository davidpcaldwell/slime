//@ts-check
(
	/**
	 *
	 * @param { jsh } jsh
	 */
	function(jsh) {
		var startMock = function() {
			var web = new jsh.unit.mock.Web({ trace: true });
			jsh.loader.plugins(jsh.script.file.parent.parent.parent);
			web.add(jsh.unit.mock.Web.github({
				src: {
					davidpcaldwell: {
						slime: jsh.tools.git.Repository({ directory: jsh.script.file.parent.parent.parent.parent.parent.parent })
					}
				}
			}));
			web.start();
			return web;
		};

		var getCommand = function(p) {
			var command = [];
			//	curl -v -x http://127.0.0.1:54510 -L http://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh.bash | bash
			command.push("curl", "-v");
			if (p.token) {
				command.push("-u", "davidpcaldwell:" + p.token);
			}
			var PROTOCOL = (p.mock) ? "http" : "https";
			if (p.mock) {
				command.push("-x", "http://127.0.0.1:" + p.mock.port);
			}
			command.push("-L");
			command.push(PROTOCOL + "://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh.bash");
			command.push("|");
			if (p.mock) {
				command.push("env", "JSH_HTTP_PROXY_HOST=127.0.0.1", "JSH_HTTP_PROXY_PORT=" + p.mock.port);
				command.push("JSH_LAUNCHER_GITHUB_PROTOCOL=http");
				command.push("JSH_GITHUB_API_PROTOCOL=http");
			}
			command.push("bash", "-s");
			command.push("http://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh/test/jsh-data.jsh.js");
			return command;
		};

		var emit = function(command) {
			var paste = command.join(" ");
			jsh.shell.run({
				command: "pbcopy",
				stdio: {
					input: paste
				}
			});
			jsh.shell.console(paste);
			jsh.shell.console("Copied to clipboard.");
		}

		jsh.script.cli.wrap({
			commands: {
				serve: function() {
					var web = startMock();
					jsh.shell.console("HTTP port: " + web.port + " HTTPS port: " + web.https.port);
					var command = getCommand({
						mock: web
					});
					emit(command);
					web.run();
				},
				remote: function() {
					//	TODO	for now, we do not fully automate this command because of the piping
					var command = getCommand({
						token: jsh.shell.jsh.src.getFile("local/github/token").read(String)
					});
					emit(command);
				}
			}
		});
	}
//@ts-ignore
)(jsh);