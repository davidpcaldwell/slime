//@ts-check
(
	function($set) {
		$set(
			function($context) {
				return {
					convert: function(input) {
						return input * $context.scale;
					}
				}
			}
		)
	}
//@ts-ignore
)($set);
