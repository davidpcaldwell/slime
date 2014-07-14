(function() {
	var modules = new function() {
		var list = [];
		
		this.add = function(string) {
			list.push(string);
		};
		
		this.array = list;
	}
	modules.add("jsh/launcher/rhino/");
	modules.add("jsh/loader/plugin.api.html");
	modules.add("jsh/tools/");
	modules.add("loader/api/");
	modules.add("jsh/unit/");
	modules.add("jsh/loader/loader.api.html");
	modules.add("loader/");
	modules.add("loader/rhino/");
	modules.add("js/object/");
	modules.add("rhino/host/");
	modules.add("rhino/io/");
	modules.add("js/document/");
	modules.add("rhino/document/");
	modules.add("rhino/file/");
	modules.add("rhino/http/client/");
	modules.add("rhino/http/servlet/");
	modules.add("rhino/http/servlet/plugin.jsh.api.html");
	/*modules.add("rhino/mail/", "jsh.mail");*/
	modules.add("rhino/shell/");
	modules.add("rhino/shell/jsh.js");
	modules.add("jsh/script/");
	return modules.array;
})()
