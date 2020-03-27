var parameters = jsh.script.getopts({
	options: {
		"node:debug": false,
		file: jsh.file.Pathname,
		ast: jsh.file.Pathname,
		to: jsh.file.Pathname
	}
})

jsh.shell.tools.node.require();
jsh.shell.tools.node.modules.require({ name: "typescript" });
jsh.shell.tools.node.modules.require({ name: "@microsoft/tsdoc" });

var ast = jsh.shell.tools.node.run({
	arguments: function(rv) {
		if (parameters.options["node:debug"]) rv.push("--inspect-brk");
		rv.push(jsh.script.file.parent.getRelativePath("tsdoc.node.js"));
		rv.push(parameters.options.file.toString());
		rv.push(parameters.options.ast.toString());
	},
	evaluate: function(result) {
		if (result.status != 0) throw new Error();
		return parameters.options.ast.file.read(JSON);
	}
});

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

var $ff = {
	not: function() {
		return function(b) {
			return !b;
		}
	}
};

var isIdentifier = $api.Function.pipe(
	$api.Function.property("object"),
	$api.Function.property("kind"),
	$api.Function.is("Identifier")
);

var isNotIdentifier = $api.Function.pipe(
	isIdentifier,
	$ff.not()
)

var getName = function(node) {
	var identifier = node.children.filter(isIdentifier)[0];
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
	var children = node.children.filter(isNotIdentifier);
	children.forEach(function(child) {
		interpret(c, child);
	});
	context.addInterface(name, c);
}

kinds.ModuleBlock = function(context,node) {
	node.children.forEach(function(child) {
		interpret(context, child);
	});
}

kinds.HeritageClause = function(context,node) {
	throw new Error("Learn to parse HeritageClause.");
}

kinds.ModuleDeclaration = function(context,node) {
	var name = getName(node);
	var c = new ChildContext(context);
	node.children.filter(isNotIdentifier).forEach(function(child) {
		interpret(c, child);
	});
	context.addModule(name, c);
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
