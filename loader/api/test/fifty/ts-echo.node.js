/* eslint-env es6 */
const ts = require("typescript");

function echo(file) {
	let program = ts.createProgram([file], { allowJs: true });
	const sourceFile = program.getSourceFile(file);
	const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
	ts.forEachChild(sourceFile, (node) => {
		var text = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
		console.log(text);
	})
}

echo(process.argv[2])
