//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { (value: slime.jrunscript.shell.Exports["invocation"] ) => void } $export
	 */
	function($api,$export) {
		$export(
			{
				sudo: function(settings) {
					return function(invocation) {
						return {
							command: "sudo",
							arguments: $api.Array.build(function(array) {
								array.push(invocation.command);
								array.push.apply(array, invocation.arguments);
							})
						};
					}
				}
			}
		)
	}
//@ts-ignore
)($api,$export);
