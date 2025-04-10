//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export namespace ui {
		export interface Exports {
			javafx: slime.jrunscript.ui.Exports["javafx"] & {
				WebView: any
			}

			askpass: slime.jsh.ui.askpass.Exports

			desktop: {
				clipboard: {
					copy: {
						string: slime.$api.fp.world.Means<string,void>
					}
				}
			}
		}
	}

	export interface Global {
		ui: slime.jsh.ui.Exports
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.manual = {};

			fifty.tests.manual.clipboard = function() {
				$api.fp.world.now.action(
					jsh.ui.desktop.clipboard.copy.string,
					"foo"
				);
				jsh.shell.console("Hopefully copied 'foo' to clipboard.");
			}
		}
	//@ts-ignore
	)(fifty);
}
