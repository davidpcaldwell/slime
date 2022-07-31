//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.unit.mock.github.test.Context } $context
	 * @param { slime.loader.Export<slime.jsh.unit.mock.github.test.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { slime.jsh.Global } jsh
		 * @returns
		 */
		var startMock = function(jsh) {
			if (!jsh.unit.mock.Web.github) throw new Error("Required: Mock GitHub, loaded from rhino/tools/github plugin");
			var web = new jsh.unit.mock.Web({ trace: true });
			//	TODO	push these kinds of declarations back into a mock object that aggregates hosts and handler
			web.addHttpsHost("127.0.0.1");
			web.addHttpsHost("raw.githubusercontent.com");
			web.addHttpsHost("api.github.com");
			web.addHttpsHost("github.com");
			web.add(jsh.unit.mock.Web.github({
				//	TODO	flip to true to test possibility of accessing private repositories
				//	TODO	this should actually be per-repository, though
				private: false,
				src: {
					davidpcaldwell: {
						slime: jsh.tools.git.Repository({ directory: $context.slime })
					}
				}
			}));
			web.start();
			return web;
		};

		$export({
			startMock: startMock
		})
	}
//@ts-ignore
)($api,$context,$export);
