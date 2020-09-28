//@ts-check
(
	function($loader,$exports) {
		Object.assign(
			$exports,
			$loader.module({
				window: window,
				escaper: {
					encode: window.escape,
					decode: window.unescape
				}
			})
		)
	}
//@ts-ignore
)($loader,$exports);
