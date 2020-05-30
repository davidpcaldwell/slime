//@ts-check
(
	/**
	 * @param { slime.fifty.Exports } $exports
	 */
	function($exports) {
		$exports.ast = function(p) {
			return jsh.shell.tools.node.run({
				arguments: function(rv) {
					if (p.node.debug) rv.push("--inspect-brk");
					//	TODO	consider using stdin so that we can use loader.get("tsdoc.node.js").read(String)
					rv.push(p.node.script);
					rv.push(p.file);
					p.ast.parent.createDirectory({
						exists: function(dir) { return false; }
					});
					rv.push(p.ast);
				},
				evaluate: function(result) {
					if (result.status != 0) throw new Error();
					return p.ast.file.read(JSON);
				}
			})
		};

		$exports.interpret = function(p) {
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

			kinds.FirstStatement = function(context,node) {
				//	TODO
			}

			kinds.ExpressionStatement = function(context,node) {
				//	TODO
			}

			var UnimplementedKind = jsh.js.Error.Type("UnimplementedKind");

			var interpret = function(context,node) {
				var kind = node.object.kind;
				var processor = kinds[kind];
				if (!processor) throw new UnimplementedKind("No processor for " + kind);
				processor(context,node);
			}

			var context = new Context();

			interpret(context,p.ast);

			return context;
		}
	}
//@ts-ignore
)($exports)
