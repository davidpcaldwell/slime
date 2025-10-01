//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.servlet.handler {
	export interface Exports {
		content: <T>(p: {
			store: slime.runtime.content.Store<T>
			map: slime.$api.fp.Mapping<T,Pick<slime.servlet.Response,"headers"|"body">>
		}) => slime.servlet.Handler
	}
}
namespace slime.servlet.internal.server.api {
	export interface Context {
		library: {
			web: slime.web.Exports
		}
	}

	export type Exports = slime.servlet.internal.server.loader.Export & {

	};

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
