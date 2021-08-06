//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit.mock.github {
	interface User {
		[x: string]: slime.jrunscript.git.repository.Local
	}

	export interface src {
		[x: string]: User
	}
}

namespace slime.jrunscript.tools.github {
	export interface Context {
		library: { http: slime.jrunscript.http.client.Exports, shell: slime.jsh.Global["shell"] }
	}

	export interface Repository {
		id: number
		node_id: string
		name: string
		full_name: string
	}

	export interface Session {
		repositories: { list: () => slime.jrunscript.tools.github.Repository[] }
	}

	export interface Exports {
		Session: (o: {
			credentials: {
				user: string
				password: string
			}
		}) => slime.jrunscript.tools.github.Session
	}
}

(
	function(
		fifty: slime.fifty.test.kit
	) {

		fifty.tests.suite = function() {
			const verify = fifty.verify;
			const api = fifty.global.jsh.tools.github;
			verify(api).evaluate.property("Session").is.type("function");
			verify(api).evaluate.property("Foo").is.type("undefined");
		}
	}
//@ts-ignore
)(fifty);
