//@ts-check
(
	/**
	 *
	 * @param { any } $context
	 * @param { any } $export
	 */
	function($context,$export) {
		$export({
			convert: function(number) {
				return $context.scale * number;
			}
		})
	}
//@ts-ignore
)($context,$export);
