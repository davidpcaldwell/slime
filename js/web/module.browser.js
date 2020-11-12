//@ts-check
(
	function($loader,$export) {
		$export(
			$loader.module("module.js", {
				window: window,
				escaper: {
					encode: window.escape,
					decode: window.unescape
				}
			})
		)
	}
//@ts-ignore
)($loader,$export);
