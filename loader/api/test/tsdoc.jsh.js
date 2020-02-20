var parameters = jsh.script.getopts({
	options: {
		"node:debug": false,
		file: jsh.file.Pathname,
		ast: jsh.file.Pathname,
		to: jsh.file.Pathname
	}
})

if (jsh.shell.tools.node.install) {
	jsh.shell.tools.node.install();
} else {
	//	For now, not updating; current implementation removes node_modules
	//	jsh.shell.tools.node.update();
}

//	TODO	can next two blocks be modularized?

if (!jsh.shell.tools.node.modules.installed.typescript) {
	jsh.shell.console("TypeScript not installed; installing ...");
	jsh.shell.tools.node.modules.install({ name: "typescript" });
}

if (!jsh.shell.tools.node.modules.installed["@microsoft/tsdoc"]) {
	jsh.shell.console("tsdoc not installed; installing ...");
	jsh.shell.tools.node.modules.install({ name: "@microsoft/tsdoc" });
}

var ast = jsh.shell.tools.node.run({
	arguments: function(rv) {
		if (parameters.options["node:debug"]) rv.push("--inspect-brk");
		rv.push(jsh.script.file.parent.getRelativePath("tsdoc.node.js"));
		rv.push(parameters.options.file.toString());
		rv.push(parameters.options.ast.toString());
	},
	evaluate: function(result) {
		if (result.status != 0) throw new Error();
		//	TODO	read(JSON)
		return parameters.options.ast.file.read(JSON);
	}
});
jsh.shell.console(JSON.stringify(ast));

var kinds = {};

var Context = function() {
	this.types = {};
	this.interfaces = {};
	this.modules = {};

	this.addTypeAlias = function(name,value) {
		this.types[name] = value;
	};

	this.addInterface = function(name,value) {
		this.interfaces[name] = value;
	};

	this.addModule = function(name,value) {
		this.modules[name] = value;
	}
};

var ChildContext = function(parent) {
	Context.apply(this,arguments);

	this.properties = {};

	this.addProperty = function(name,value) {
		this.properties[name] = value;
	}
}

var getName = function(node) {
	var identifier = node.children.filter(function(child) {
		return child.object.kind == "Identifier";
	})[0];
	return identifier.object.text;
}

kinds.SourceFile = function(context,node) {
	node.children.forEach(function(child) {
		interpret(context,child);
	});
}

kinds.TypeAliasDeclaration = function(context,node) {
	var name = getName(node);
	context.addTypeAlias(name, {});
}

kinds.InterfaceDeclaration = function(context,node) {
	var name = getName(node);
	//	TODO	parse elements of the declaration
	var c = new ChildContext(context);
	var children = node.children.filter(function(child) {
		return child.object.kind != "Identifier";
	});
	children.forEach(function(child) {
		interpret(c, child);
	});
	context.addInterface(name, c);
}

kinds.ModuleDeclaration = function(context,node) {
	var name = getName(node);
	context.addModule(name, {});
}

kinds.PropertySignature = function(context,node) {
	var name = getName(node);
	context.addProperty(name, {});
}

kinds.EndOfFileToken = function(context,node) {
}

kinds.Identifier = function(rv,o) {
	throw new TypeError();
	rv.text = o.node.text;
}

var UnimplementedKind = jsh.js.Error.Type("UnimplementedKind");

var interpret = function(context,node) {
	var kind = node.object.kind;
	var processor = kinds[kind];
	if (!processor) throw new UnimplementedKind("No processor for " + kind);
	processor(context,node);
}

var context = new Context();

output = interpret(context,ast);
parameters.options.to.write(JSON.stringify(context, void(0), "    "), { append: false });
