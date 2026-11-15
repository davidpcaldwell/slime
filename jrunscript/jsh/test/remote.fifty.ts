//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.test.remote {
	export interface SubshellDescription {
		installation: slime.jsh.shell.Installation & { url?: string }
		url: string
		arguments: string[]
		environment: { [name: string]: string }
		properties: { [name: string]: string }
		invocation: slime.jsh.internal.launcher.invocation.Output
		java: string
		engine: string
		grandchild?: SubshellResult
	}

	export interface SubshellResult {
		mode: string
		status: number
		output: string
		error: string
		command: string
	}

	export interface SubshellOutput {
		parent: SubshellDescription
		results: SubshellResult[]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var fixtures: slime.jsh.test.Script = fifty.$loader.script("../../../jrunscript/jsh/fixtures.ts");
			var exported = fixtures();
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.lifecycle = function() {
				var shells = exported.shells(fifty);
				var first = shells.remote();
				try {
					verify(shells.remote() === first).is(true);
					first.stop();
					var second = shells.remote();
					try {
						verify(second === first).is(false);
						first.stop();
						verify(shells.remote() === second).is(true);
					} finally {
						second.stop();
					}
				} finally {
					first.stop();
				}
			}

			fifty.tests.launcher = function() {
				var remote = exported.shells(fifty).remote();
				try {
					var intention = remote.getShellIntention({
						PATH: jsh.shell.PATH,
						settings: { branch: "local" },
						script: "jrunscript/jsh/test/jsh-data.jsh.js"
					});
					var result = $api.fp.world.now.question(jsh.shell.subprocess.question, intention);
					if (result.status != 0) throw new Error("Remote launcher exit status: " + result.status + "\nstderr:\n" + result.stdio.error);
					var output = JSON.parse(result.stdio.output);
					verify(output).evaluate.property("engines").is.type("object");
				} finally {
					remote.stop();
				}
			}

			fifty.tests.subshell = function() {
				var remote = exported.shells(fifty).remote();
				try {
					var intention = remote.getShellIntention({
						PATH: jsh.shell.PATH,
						settings: { branch: "local" },
						script: remote.getSlimeUrl({ path: "jrunscript/jsh/test/remote-subshell.jsh.js" })
					});
					var environment = intention.environment;
					intention.environment = function(was) {
						var rv: { [name: string]: string } = $api.Object.compose(environment(was));
						rv.SLIME_ISSUE69_PARENT = "inherited from remote parent";
						rv.JSH_LAUNCHER_PROPERTY_ARGUMENTS = "-Dslime.issue69.inherited=parent=69 -Dslime.issue69=parent";
						delete rv.JSH_LAUNCHER_COMMAND_DEBUG;
						delete rv.JSH_EMBED_BOOTSTRAP_DEBUG;
						return rv;
					};
					var result = $api.fp.world.now.question(jsh.shell.subprocess.question, intention);
					if (result.status != 0) throw new Error("Remote parent exit status: " + result.status + "\nstderr:\n" + result.stdio.error);
					var data: SubshellOutput = JSON.parse(result.stdio.output);
					jsh.shell.console(JSON.stringify(data, void(0), 4));
					verify(data.parent.installation.url).is("http://raw.githubusercontent.com/davidpcaldwell/slime/local/");
					verify(data.parent.url).is(remote.getSlimeUrl({ path: "jrunscript/jsh/test/remote-subshell.jsh.js" }));
					verify(data.results.length).is(3);
					verify(data.parent.properties["http.proxyHost"]).is("127.0.0.1");
					verify(data.parent.properties["http.proxyPort"]).is(remote.getLoaderProperties()["http.proxyPort"]);
					verify(data.parent.properties["https.proxyHost"]).is("127.0.0.1");
					verify(Boolean(data.parent.properties["https.proxyPort"])).is(true);
					verify(data.parent.invocation.main).is(remote.getSlimeUrl({ path: "rhino/jrunscript/api.js?jsh" }));
					verify(data.parent.properties["slime.issue69.inherited"]).is("parent=69");
					verify(data.parent.properties["slime.issue69"]).is("parent");
					data.results.forEach(function(child, index) {
						verify(child.mode).is(["omitted", "false", "true"][index]);
						verify(child.status).is(23);
						verify(child.command).is(data.parent.invocation.jrunscript);
						verify(child.error).evaluate(function(error) {
							return error.slice(-"issue69 child stderr\n".length);
						}).is("issue69 child stderr\n");
						verify(child.output.indexOf("issue69 child stderr")).is(-1);
						verify(child.error.indexOf("\"installation\":")).is(-1);
						if (child.status != 23) throw new Error("Remote child (" + child.mode + ") exit status: " + child.status + "\nstderr:\n" + child.error);
						var output: SubshellDescription = JSON.parse(child.output);
						verify(output.url).is(data.parent.url);
						verify(output.installation.url).is(data.parent.installation.url);
						verify(output.java).is(data.parent.java);
						verify(output.engine).is(data.parent.engine);
						verify(JSON.stringify(output.arguments)).is(JSON.stringify(["child", child.mode, "argument with spaces", "quotes'\"$"]));
						verify(output.environment.parent).is("inherited from remote parent");
						verify(output.environment.child).is(child.mode);
						verify(output.properties["slime.issue69"]).is("property " + child.mode);
						verify(output.invocation.properties["slime.issue69"]).is("property " + child.mode);
						verify(output.properties["slime.issue69.inherited"]).is("parent=69");
						verify(output.grandchild.status).is(24);
						if (output.grandchild.status != 24) throw new Error("Remote grandchild (" + child.mode + ") exit status: " + output.grandchild.status + "\nstderr:\n" + output.grandchild.error);
						verify(output.grandchild.command).is(data.parent.invocation.jrunscript);
						verify(output.grandchild.error).evaluate(function(error) {
							return error.slice(-"issue69 grandchild stderr\n".length);
						}).is("issue69 grandchild stderr\n");
						verify(output.grandchild.output.indexOf("issue69 grandchild stderr")).is(-1);
						var grandchild: SubshellDescription = JSON.parse(output.grandchild.output);
						verify(grandchild.url).is(output.url);
						verify(grandchild.installation.url).is(output.installation.url);
						verify(JSON.stringify(grandchild.arguments)).is(JSON.stringify(["grandchild", child.mode]));
						verify(grandchild.properties["slime.issue69"]).is("property " + child.mode);
						verify(grandchild.invocation.properties["slime.issue69"]).is("property " + child.mode);
						verify(grandchild.properties["slime.issue69.inherited"]).is("parent=69");
						verify(grandchild.environment.parent).is(output.environment.parent);
						verify(grandchild.environment.child).is(output.environment.child);
						["http.proxyHost", "http.proxyPort", "https.proxyHost", "https.proxyPort"].forEach(function(name) {
							verify(output.properties[name]).is(data.parent.properties[name]);
						});
						["httpHost", "httpPort", "httpsHost", "httpsPort"].forEach(function(name) {
							verify(output.environment[name]).is(data.parent.environment[name]);
						});
						verify(output.invocation.main).is(data.parent.invocation.main);
						verify(output.invocation.jrunscript).is(data.parent.invocation.jrunscript);
						verify(JSON.stringify(output.invocation.classpath)).is(JSON.stringify(data.parent.invocation.classpath));
					});
				} finally {
					remote.stop();
				}
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.lifecycle);
				fifty.run(fifty.tests.launcher);
				fifty.run(fifty.tests.subshell);
			}
		}
	//@ts-ignore
	)(fifty);
}
