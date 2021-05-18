//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(Packages,jsh,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.unit.mock.Web);
			},
			load: function() {
				/**
				 * @param { { src: slime.jsh.unit.mock.github.src, private: boolean } } o
				 * @returns { slime.jsh.unit.mock.handler }
				 */
				var MockGithubApi = function(o) {
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
					return function(request) {
						var host = request.headers.value("host");
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
							if (branch.name == ref) {
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
								throw new Error("Unsupported: branch and ref different.");
							}
						} else if (host == "api.github.com") {
							var pattern = /^repos\/(.*)\/(.*)\/contents\/(.*)$/;
							var match = pattern.exec(request.path);
							if (match) {
								var user = match[1];
								var repo = match[2];
								var path = match[3];
								//	TODO	can take ref as query parameter; see https://developer.github.com/v3/repos/contents/
								var ref = "master";
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
							var zipfile = /(.*)\/(.*)\/archive\/refs\/heads\/(.*).zip$/;
							var match = zipfile.exec(request.path);
							if (match) {
								var user = match[1];
								var repo = match[2];
								var version = match[3];
								if (user == "davidpcaldwell" && repo == "slime" && version == "master") {
									//	create zip file of source tree, excluding .git

								}
							}
						}
						return {
							status: { code: 404 }
						}
					}
				};

				jsh.unit.mock.Web.github = MockGithubApi;
			}
		})
	}
//@ts-ignore
)(Packages,jsh,plugin)