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
		}
	}
//@ts-ignore
)($exports)
