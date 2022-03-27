//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { { library: { node: any } } } $context
	 * @param { slime.fifty.ui.Exports } $exports
	 */
	function($api,$context,$exports) {
		$exports.ast = function(p) {
			return $context.library.node.run({
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

			var interpretChildren = function(node,context) {
				node.children.forEach(function(child) {
					interpret(child,context);
				});
			}

			kinds.SourceFile = function(node,context) {
				interpretChildren(node,context);
			}

			kinds.TypeAliasDeclaration = function(node,context) {
				var name = getName(node);
				context.addTypeAlias(name, {});
			}

			kinds.InterfaceDeclaration = function(node,context) {
				var name = getName(node);
				//	TODO	parse elements of the declaration
				var c = new ChildContext(context);
				var children = node.children.filter(isNotIdentifier);
				children.forEach(function(child) {
					interpret(child, c);
				});
				context.addInterface(name, c);
			}

			kinds.ModuleBlock = function(node,context) {
				interpretChildren(node,context);
			}

			kinds.HeritageClause = function(node,context) {
				throw new Error("Learn to parse HeritageClause.");
			}

			kinds.ModuleDeclaration = function(node,context) {
				var name = getName(node);
				var c = new ChildContext(context);
				node.children.filter(isNotIdentifier).forEach(function(child) {
					interpret(child,c);
				});
				context.addModule(name, c);
			}

			kinds.PropertySignature = function(node,context) {
				var name = getName(node);
				context.addProperty(name, {});
			}

			kinds.EndOfFileToken = function(node,context) {
			}

			kinds.Identifier = function(node,context) {
				throw new TypeError();
				// context.text = o.node.text;
			}

			kinds.FirstStatement = function(node,context) {
				//	TODO
			}

			kinds.ExpressionStatement = function(node,context) {
				//	TODO
			}

			var UnimplementedKind = $api.Error.Type({ name: "UnimplementedKind" });

			var interpret = function(node,context) {
				var kind = node.object.kind;
				var processor = kinds[kind];
				if (!processor) throw new UnimplementedKind("No processor for " + kind);
				processor(node,context);
			}

			var context = new Context();

			interpret(p.ast,context);

			return context;
		}
	}
//@ts-ignore
)($exports)
