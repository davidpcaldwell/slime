//@ts-check
(
	/**
	 * @param { Packages } Packages
	 * @param { jsh } jsh
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(Packages,jsh,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.unit.mock.Web);
			},
			load: function() {
				/**
				 * @param { { src: slime.jsh.unit.mock.github.src } } o
				 * @returns { slime.jsh.unit.mock.handler }
				 */
				var MockGithubApi = function(o) {
					return function(request) {
						var host = request.headers.value("host");
						if (host == "raw.githubusercontent.com") {
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
								if (false) Packages.java.lang.System.err.println("Checking: " + at);
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
									return node.pathname.basename != ".git";
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
						}
						return {
							status: { code: 404 }
						}
					}
					return void(0);
				};

				jsh.unit.mock.Web.github = MockGithubApi;
			}
		})
	}
//@ts-ignore
)(Packages,jsh,plugin)