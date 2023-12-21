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
	 * @param { slime.jrunscript.tools.github.credentials.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.github.credentials.Exports> } $export
	 */
	function($api,$context,$export) {
		var relative = $context.library.file.Location.directory.relativePath;
		var requireParents = $api.fp.world.Action.pipe(
			$context.library.file.Location.parent()
		)(
			$context.library.file.Location.directory.require({ recursive: true })
		);

		/**
		 *
		 * @param { string } string
		 * @returns { (file: slime.jrunscript.file.Location) => void }
		 */
		var setFileContents = function(string) {
			return function(file) {
				$api.fp.world.now.action(
					$context.library.file.Location.file.write(file).string,
					{ value: string }
				);
			}
		};

		/** @type { slime.jrunscript.tools.github.credentials.Exports["update"] } */
		var update = function(order) {
			return function(events) {
				var destination = $api.fp.now.invoke(
					order.project.base,
					relative("local/github/tokens"),
					relative(order.user)
				);
				$api.fp.impure.now.process(
					$api.fp.impure.Process.output(
						destination,
						$api.fp.impure.Output.compose([
							$api.fp.world.output(requireParents),
							setFileContents(order.token)
						])
					)
				);
				events.fire("wrote", { user: order.user, destination: destination });
			}
		};

		$export({
			update: update
		});
	}
//@ts-ignore
)($api,$context,$export);
