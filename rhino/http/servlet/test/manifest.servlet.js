$exports.handle = function(request) {
	if (!$loader.list) {
		Packages.java.lang.System.err.println("No list in $loader");
	} else {
		Packages.java.lang.System.err.println("list = " + $loader.list);
		Packages.java.lang.System.err.println("list = " + httpd.loader.list);
	}
	Packages.java.lang.System.err.println("$loader.list: " + $loader.list({ path: "" }))
	var json = {
		$loader: $loader.list({ path: "" }),
		httpd: {
			loader: httpd.loader.list({ path: "" })
		}
	};
	return {
		status: {
			code: 200
		},
		body: {
			type: "application/json",
			string: JSON.stringify(json,void(0),"    ")
		}
	};
}
