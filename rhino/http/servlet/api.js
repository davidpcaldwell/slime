if (typeof(eval("$context")) == "object") {
	$host = $context;
}

$exports.Response = function() {
};

$exports.Response.text = function(string) {
	return {
		status: {
			code: 200
		},
		headers: [],
		body: {
			type: "text/plain",
			string: string
		}
	};	
}
