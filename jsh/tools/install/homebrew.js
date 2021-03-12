//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh,$export) {
		function getLocalHomebrew(p) {
			var to = p.location.createDirectory({
				exists: function(dir) {
					return false;
				}
			});

			jsh.shell.run({
				command: "tar",
				arguments: ["xz", "--strip", "1", "-C", to.pathname.basename],
				//	TODO	might not exist
				directory: to.parent,
				stdio: {
					input: new jsh.http.Client().request({
						url: "https://github.com/Homebrew/brew/tarball/master"
					}).body.stream
				}
			})

			var homebrew = (function(directory) {
				var program = directory.getFile("bin/brew");

				var brew = function(command,args) {
					jsh.shell.run({
						command: program,
						arguments: (function() {
							var rv = [command];
							if (args) rv.push.apply(rv,args);
							return rv;
						})()
					})
				}

				return {
					update: function(p) {
						brew("update")
					},
					install: function(p) {
						brew(
							"install",
							(function() {
								var rv = [];
								rv.push(p.formula);
								return rv;
							})()
						)
					},
					upgrade: function(p) {
						brew(
							"upgrade",
							(function() {
								var rv = [];
								rv.push(p.formula);
								return rv;
							})()
						)
					}
				}
			})(to);

			return homebrew;
		}

		$export({
			get: function(p) {
				return getLocalHomebrew(p);
			}
		});
	}
//@ts-ignore
)(jsh,$export);
