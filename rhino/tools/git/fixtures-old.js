//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { { module: slime.jrunscript.tools.git.Exports }} $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.git.internal.old.Fixtures> } $export
	 */
	function($context,$export) {
		var module = $context.module;

		$export({
			init: function(p) {
				var rv = module.oo.init(p);
				rv.execute({
					command: "config",
					arguments: [
						"user.email", "slime@davidpcaldwell.com"
					]
				});
				rv.execute({
					command: "config",
					arguments: [
						"user.name", "David P. Caldwell"
					]
				});
				return rv;
			},
			write: function(o) {
				var directory = (function() {
					if (o.repository) return o.repository.directory;
					if (o.directory) return o.directory;
				})();
				for (var x in o.files) {
					//	TODO	add function form which receives string as argument
					directory.getRelativePath(x).write(o.files[x], { append: false });
				}
			}
		});
	}
//@ts-ignore
)($context,$export);
