//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf.test {
	export interface Fixtures {
		configure: (repository: slime.jrunscript.tools.git.repository.Local) => void
	}

	export type Script = slime.loader.Script<void, Fixtures>

	(
		function(
			$export: slime.loader.Export<Fixtures>
		) {
			$export({
				configure: function(repository) {
					repository.config({ set: { name: "user.name", value: "foo" }});
					repository.config({ set: { name: "user.email", value: "bar@example.com" }});
				}
			})
		}
	//@ts-ignore
	)($export);
}
