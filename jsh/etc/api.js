(function() {
	var modules = new function() {
		var list = [];
		
		this.add = function(string) {
			list.push(string);
		};
		
		this.array = list;
	}
	modules.add({ api: "jsh/launcher/rhino/" });
	modules.add({ api: "jsh/loader/plugin.api.html" });
	modules.add({ api: "jsh/tools/" });
	modules.add({ api: "loader/api/" });
	modules.add({ api: "jsh/unit/" });
	modules.add({ api: "jsh/loader/loader.api.html" });
	modules.add({ api: "loader/" });
	modules.add({ api: "loader/rhino/" });
	modules.add({ api: "js/object/" });
	modules.add({ api: "rhino/host/" });
	modules.add({ api: "rhino/io/" });
	modules.add({ api: "js/document/" });
	modules.add({ api: "rhino/document/" });
	modules.add({ api: "rhino/file/" });
	modules.add({ api: "rhino/http/client/" });
	modules.add({ api: "rhino/http/servlet/" });
	modules.add({ api: "rhino/http/servlet/plugin.jsh.api.html" });
	/*modules.add("rhino/mail/", "jsh.mail");*/
	modules.add({ api: "rhino/shell/" });
	modules.add({ api: "rhino/shell/jsh.js" });
	modules.add({ api: "jsh/script/" });
	return modules.array;
})()
