//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.project.openapi.Context } $context
	 * @param { slime.loader.Export<slime.project.openapi.Exports> } $export
	 */
	function($api,$context,$export) {
		$export({
			initialize: function(jsh) {
				jsh.shell.tools.node.require();
				jsh.shell.tools.node["modules"].require({ name: "dtsgenerator", version: "3.12.1" });
				jsh.shell.tools.node["modules"].require({ name: "tslib", version: "2.3.0" });
				jsh.shell.tools.node["modules"].require({ name: "@dtsgenerator/replace-namespace", version: "1.5.0" });

				var node = jsh.shell.tools.node;

				/**
				 *
				 * @param { any } node
				 * @returns { node is slime.jrunscript.node.Installation }
				 */
				function isInstallation(node) {
					return true;
				}

				if (isInstallation(node)) {
					return {
						src: jsh.shell.jsh.src,
						node: node
					}
				} else {
					throw new Error("Unreachable.");
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
