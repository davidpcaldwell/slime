//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.test {
	export interface Exports {
		subject: (fifty: slime.fifty.test.Kit, fixture?: slime.$api.fp.Transform<slime.runtime.Scope>) => slime.runtime.Exports
	}

	export type Script = slime.loader.Script<void,Exports>;

	(
		function($export: slime.loader.Export<Exports>) {
			$export({
				subject: function(fifty: slime.fifty.test.Kit, fixture?: slime.$api.fp.Transform<slime.runtime.Scope>) {
					if (!fixture) fixture = fifty.global.$api.fp.identity;
					var code = fifty.$loader.get("expression.js");
					var js = code.read(String);

					var subject: slime.runtime.Exports = (function() {
						var scope: slime.runtime.Scope = fixture({
							$slime: {
								getRuntimeScript: function(path) {
									var resource = fifty.$loader.get(path);
									return { name: resource.name, js: resource.read(String) }
								}
							}
						});
						return eval(js);
					})();

					return subject;
				}
			});
		}
	//@ts-ignore
	)($export);
}
