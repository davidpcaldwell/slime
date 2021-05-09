namespace slime.jsh {
	export interface Global {
		io: slime.jrunscript.io.Exports
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var verify = fifty.verify;
			var jsh = fifty.global.jsh;

			fifty.tests.suite = function() {
				fifty.load("../../loader/expression.fifty.ts", "runtime.types.exports.Loader", jsh.io.Loader);
			}
		}
	//@ts-ignore
	)(fifty);

}
