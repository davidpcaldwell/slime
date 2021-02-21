//@ts-check
(
	/**
	 * @param { (value: slime.jsh.unit.mock.handler) => void } $export
	 */
	function($export) {
		$export(
			function(request) {
				if (request.headers.value("host") == "mockweb.slime.com") {
					return {
						status: {
							code: 200
						},
						body: {
							type: "application/json",
							string: JSON.stringify({ method: request.method, path: request.path })
						}
					}
				}
				return void(0);
			}
		)
	}
//@ts-ignore
)($export)