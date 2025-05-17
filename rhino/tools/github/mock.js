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
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.unit.mock.web.github.Context } $context
	 * @param { slime.loader.Export<slime.jsh.unit.mock.web.github.Exports> } $export
	 */
	function(Packages,$api,$context,$export) {
		var jsh = $context.jsh;

		$export(
			/**
			 * @type { slime.jsh.unit.mock.web.github.Exports }
			 */
			function(o) {
				var authorize = function(request) {
					if (o.private) {
						jsh.shell.console("Private: " + request.path);
						var authorization = request.headers.value("Authorization");
						jsh.shell.console("Authorization: " + authorization);
						if (!authorization) return {
							status: {
								code: 404
							}
						}
					}
				}

				/** @type { slime.$api.fp.Partial<slime.servlet.Request,slime.servlet.Response> } */
				var getMockGithubArchive = $api.fp.pipe(
					$api.fp.property("path"),
					$api.fp.RegExp.exec(/(.*)\/(.*)\/archive\/refs\/heads\/(.*).zip$/),
					$api.fp.Maybe.map(
						$api.fp.pipe(
							$api.fp.pipe(
								function(match) {
									var user = match[1];
									var repo = match[2];
									var version = match[3];
									if (user == "davidpcaldwell" && repo == "slime" && version == "local") {
										//	create zip file of source tree, excluding .git
										var isTopLevel = function(node) {
											return node.parent.toString() == jsh.shell.jsh.src.toString();
										}
										var entries = jsh.shell.jsh.src.list({
											type: jsh.file.list.ENTRY,
											filter: function(node) {
												if (isTopLevel(node) && node.pathname.basename == "local") return false;
												if (isTopLevel(node) && node.pathname.basename == "bin") return false;
												if (isTopLevel(node) && node.pathname.basename == ".settings") return false;
												if (isTopLevel(node) && node.pathname.basename == ".git") return false;
												return true;
											},
											descendants: function(node) {
												if (isTopLevel(node) && node.pathname.basename == "local") return false;
												if (isTopLevel(node) && node.pathname.basename == "bin") return false;
												if (isTopLevel(node) && node.pathname.basename == ".settings") return false;
												if (isTopLevel(node) && node.pathname.basename == ".git") return false;
												return true;
											}
										}).filter(function(entry) {
											return !entry.node.directory;
										}).map(function(entry) {
											return {
												path: repo + "-" + version + "/" + entry.path,
												resource: entry.node
											}
										});
										var buffer = new jsh.io.Buffer();

										/**
										 *
										 * @param { { path: string, resource: slime.jrunscript.file.Node }} nodeEntry
										 * @returns { slime.jrunscript.io.archive.File<{}> }
										 */
										var toFileEntry = function(nodeEntry) {
											/** @type { (node: slime.jrunscript.file.Node) => node is slime.jrunscript.file.File } */
											var isFile = function(node) {
												return true;
											}
											/** @type { (node: slime.jrunscript.file.Node) => slime.jrunscript.file.File } */
											var toFile = function(node) {
												if (isFile(node)) return node;
												throw new Error();
											}
											if (isFile(nodeEntry.resource)) {
												return {
													path: nodeEntry.path,
													content: toFile(nodeEntry.resource).read($context.jsh.io.Streams.binary)
												};
											} else {
												throw new Error();
											}
										}

										jsh.io.archive.zip.encode({
											to: buffer.writeBinary(),
											entries: $api.fp.Stream.from.array(entries.map(toFileEntry))
										});
										return {
											status: { code: 200 },
											body: {
												type: "application/zip",
												stream: buffer.readBinary()
											}
										}
									}
								},
								$api.fp.Maybe.from.value
							)
						)
					),
					function flatten(x) {
						if (x.present) return x.value;
						return $api.fp.Maybe.from.nothing();
					}
				);

				/** @type { slime.$api.fp.Partial<slime.servlet.Request,slime.servlet.Response> } */
				var getRhinoDownload = $api.fp.pipe(
					$api.fp.property("path"),
					$api.fp.RegExp.exec(/^mozilla\/rhino\/releases\/download\/(.*)$/),
					$api.fp.Maybe.map(function(match) {
						var response = $api.fp.world.now.question(
							jsh.http.world.java.urlconnection,
							{
								request: {
									method: "GET",
									url: jsh.web.Url.parse("https://github.com/mozilla/rhino/releases/download/" + match[1]),
									headers: []
								},
								timeout: void(0)
							}
						)
						return response;
					})
				)

				return function(request) {
					var host = request.headers.value("host");
					Packages.java.lang.System.err.println("Received request: " + request.method + " " + host + " " + request.path)

					//	TODO	relaxing branch/ref requirements so that we always pretend that the requested branch was also
					//			the current branch and can just serve from the filesystem. We could probably write a more
					//			complex algorithm but we'd also have to figure out whether it would work in our GitHub Action
					//			(do we even install git on the server in that action?).
					if (host == "raw.githubusercontent.com") {
						var response = authorize(request);
						if (response) return response;
						var pattern = /^(.*?)\/(.*?)\/(.*?)\/(.*)$/;
						var match = pattern.exec(request.path);
						var user = match[1];
						var repo = match[2];
						var ref = match[3];
						var repository = o.src[user][repo];
						var branch = repository.branch().filter(function(b) {
							return b.current;
						})[0];
						//	TODO	for the purposes of this script, we pretend that master points to local also, because
						//			when running the shell via jsh.bash
						if (ref == "local") {
							var file = repository.directory.getFile(match[4])
							return (file) ? {
								status: { code: 200 },
								body: {
									type: "text/plain",
									string: file.read(String)
								}
							} : {
								//	TODO	could check actual GitHub response to better simulate this
								status: { code: 404 }
							}
						} else {
							throw new Error("Unsupported: ref not 'local'.");
						}
					} else if (host == "api.github.com") {
						var pattern = /^repos\/(.*)\/(.*)\/contents\/(.*)$/;
						var match = pattern.exec(request.path);
						if (match) {
							var user = match[1];
							var repo = match[2];
							var path = match[3];
							//	TODO	can take ref as query parameter; see https://developer.github.com/v3/repos/contents/
							var ref = "local";
							var repository = o.src[user][repo];
							var branch = repository.branch().filter(function(b) {
								return b.current;
							})[0];
							var at = repository.directory.getRelativePath(path);
							if (true) Packages.java.lang.System.err.println("Listing GitHub folder path [" + path + "] by checking: " + at);
							if (at.file) throw new Error();
							if (!at.directory) return {
								status: { code: 404 },
								body: {
									type: "application/json",
									string: JSON.stringify({
										message: "Not Found",
										documentation_url: "https://developer.github.com/v3/repos/contents/#get-contents"
									})
								}
							};
							var list = at.directory.list().filter(function(node) {
								var rv = node.pathname.basename != ".git";
								if (path == "") {
									rv = (rv
										&& node.pathname.basename != "bin"
										&& node.pathname.basename != ".settings"
										&& node.pathname.basename != ".gradle"
									);
								}
								return rv;
							}).map(function(node) {
								if (node.directory) return { type: "dir", name: node.pathname.basename };
								if (!node.directory) return { type: "file", name: node.pathname.basename };
								throw new Error("Not directory/file: " + node);
							})
							if (branch.name == ref) {
								return {
									status: { code: 200 },
									body: {
										type: "application/json",
										string: JSON.stringify(list)
									}
								}
							} else {
								throw new Error("Umsupported: branch and ref different.");
							}
						} else {
							Packages.java.lang.System.err.println("No match: " + request.path);
						}
					} else if (host == "github.com") {
						var archive = getMockGithubArchive(request);
						if (archive.present) return archive.value;
						var rhino = getRhinoDownload(request);
						if (rhino.present) return rhino.value;
					}
					return {
						status: { code: 404 }
					}
				}
			}
		);

	}
//@ts-ignore
)(Packages,$api,$context,$export);
