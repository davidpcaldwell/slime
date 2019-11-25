//	Reference: https://github.com/microsoft/tsdoc/blob/master/api-demo/src/advancedDemo.ts
const path = require("path");
const os = require('os');
const colors = {
	green: function(s) { return s; },
	gray: function(s) { return s; },
	cyan: function(s) { return s; }
};

const ts = require("typescript");
const tsdoc = require("@microsoft/tsdoc");

var kinds = (function() {
	const rv = {};
	for (var x in ts.SyntaxKind) {
		rv[ts.SyntaxKind[x]] = x;
	}
	return rv;
})();

function dumpTSDocTree(docNode, indent) {
	let dumpText = '';
	if (docNode instanceof tsdoc.DocExcerpt) {
		const content = docNode.content.toString();
		dumpText += colors.gray(`${indent}* ${docNode.excerptKind}=`) + colors.cyan(JSON.stringify(content));
	} else {
		dumpText += `${indent}- ${docNode.kind}`;
	}
	console.log(dumpText);

	for (const child of docNode.getChildNodes()) {
		dumpTSDocTree(child, indent + '  ');
	}
}
  
function parseTSDoc(sourceFile, foundComment) {
	console.log(os.EOL + colors.green('Comment to be parsed:') + os.EOL);
	console.log(colors.gray('<<<<<<'));
	console.log(foundComment.textRange.toString());
	console.log(colors.gray('>>>>>>'));

	const customConfiguration = new tsdoc.TSDocConfiguration();

	const customInlineDefinition = new tsdoc.TSDocTagDefinition({
		tagName: '@customInline',
		syntaxKind: tsdoc.TSDocTagSyntaxKind.InlineTag,
		allowMultiple: true
	});

	// NOTE: Defining this causes a new DocBlock to be created under docComment.customBlocks.
	// Otherwise, a simple DocBlockTag would appear inline in the @remarks section.
	const customBlockDefinition = new tsdoc.TSDocTagDefinition({
		tagName: '@customBlock',
		syntaxKind: tsdoc.TSDocTagSyntaxKind.BlockTag
	});

	// NOTE: Defining this causes @customModifier to be removed from its section,
	// and added to the docComment.modifierTagSet
	const customModifierDefinition = new tsdoc.TSDocTagDefinition({
		tagName: '@customModifier',
		syntaxKind: tsdoc.TSDocTagSyntaxKind.ModifierTag
	});

	customConfiguration.addTagDefinitions([
		customInlineDefinition,
		customBlockDefinition,
		customModifierDefinition
	]);

	console.log(os.EOL + 'Invoking TSDocParser with custom configuration...' + os.EOL);
	const tsdocParser = new tsdoc.TSDocParser(customConfiguration);
	const parserContext = tsdocParser.parseRange(foundComment.textRange);
	const docComment = parserContext.docComment;

	console.log(os.EOL + colors.green('Parser Log Messages:') + os.EOL);

	if (parserContext.log.messages.length === 0) {
		console.log('No errors or warnings.');
	} else {
		for (const message of parserContext.log.messages) {
		// Since we have the compiler's analysis, use it to calculate the line/column information,
		// since this is currently faster than TSDoc's TextRange.getLocation() lookup.
		const location = sourceFile.getLineAndCharacterOfPosition(message.textRange.pos);
		const formattedMessage = `${sourceFile.fileName}(${location.line + 1},${location.character + 1}):`
			+ ` [TSDoc] ${message}`;
		console.log(formattedMessage);
		}
	}

	if (parserContext.docComment.modifierTagSet.hasTag(customModifierDefinition)) {
		console.log(os.EOL + colors.cyan(`The ${customModifierDefinition.tagName} modifier was FOUND.`));
	} else {
		console.log(os.EOL + colors.cyan(`The ${customModifierDefinition.tagName} modifier was NOT FOUND.`));
	}

	console.log(os.EOL + colors.green('Visiting TSDoc\'s DocNode tree') + os.EOL);
	dumpTSDocTree(docComment, '');
}  

const isDeclarationKind = function(kind) {
	return kind === ts.SyntaxKind.ArrowFunction
    || kind === ts.SyntaxKind.BindingElement
    || kind === ts.SyntaxKind.ClassDeclaration
    || kind === ts.SyntaxKind.ClassExpression
    || kind === ts.SyntaxKind.Constructor
    || kind === ts.SyntaxKind.EnumDeclaration
    || kind === ts.SyntaxKind.EnumMember
    || kind === ts.SyntaxKind.ExportSpecifier
    || kind === ts.SyntaxKind.FunctionDeclaration
    || kind === ts.SyntaxKind.FunctionExpression
    || kind === ts.SyntaxKind.GetAccessor
    || kind === ts.SyntaxKind.ImportClause
    || kind === ts.SyntaxKind.ImportEqualsDeclaration
    || kind === ts.SyntaxKind.ImportSpecifier
    || kind === ts.SyntaxKind.InterfaceDeclaration
    || kind === ts.SyntaxKind.JsxAttribute
    || kind === ts.SyntaxKind.MethodDeclaration
    || kind === ts.SyntaxKind.MethodSignature
    || kind === ts.SyntaxKind.ModuleDeclaration
    || kind === ts.SyntaxKind.NamespaceExportDeclaration
    || kind === ts.SyntaxKind.NamespaceImport
    || kind === ts.SyntaxKind.Parameter
    || kind === ts.SyntaxKind.PropertyAssignment
    || kind === ts.SyntaxKind.PropertyDeclaration
    || kind === ts.SyntaxKind.PropertySignature
    || kind === ts.SyntaxKind.SetAccessor
    || kind === ts.SyntaxKind.ShorthandPropertyAssignment
    || kind === ts.SyntaxKind.TypeAliasDeclaration
    || kind === ts.SyntaxKind.TypeParameter
    || kind === ts.SyntaxKind.VariableDeclaration
    || kind === ts.SyntaxKind.JSDocTypedefTag
    || kind === ts.SyntaxKind.JSDocCallbackTag
    || kind === ts.SyntaxKind.JSDocPropertyTag;
}

function getJSDocCommentRanges(node, text) {
	const commentRanges = [];

	switch (node.kind) {
		case ts.SyntaxKind.Parameter:
		case ts.SyntaxKind.TypeParameter:
		case ts.SyntaxKind.FunctionExpression:
		case ts.SyntaxKind.ArrowFunction:
		case ts.SyntaxKind.ParenthesizedExpression:
		commentRanges.push(...ts.getTrailingCommentRanges(text, node.pos) || []);
		break;
	}
	console.log("text", text);
	commentRanges.push(...ts.getLeadingCommentRanges(text, node.pos) || []);

	console.log(
		"Comments: "
		+ "\n"
		+ commentRanges.map(
			(comment) => JSON.stringify(comment)
		).join("\n")
		+ "\n"
	)

	// True if the comment starts with '/**' but not if it is '/**/'
	return commentRanges.filter((comment) =>
		text.charCodeAt(comment.pos + 1) === 0x2A /* ts.CharacterCodes.asterisk */ &&
		text.charCodeAt(comment.pos + 2) === 0x2A /* ts.CharacterCodes.asterisk */ &&
		text.charCodeAt(comment.pos + 3) !== 0x2F /* ts.CharacterCodes.slash */);
}  

const traverse = function(sourceFile, node, indent, rv) {
	const buffer = sourceFile.getFullText();
	const match = isDeclarationKind(node.kind);
	console.log("isDeclarationKind", kinds[node.kind], match);
	if (match) {
		const comments = getJSDocCommentRanges(node, buffer);
		console.log(`Found ${comments.length} comments.`);
		for (let i=0; i<comments.length; i++) {
			rv.push({
				compilerNode: node,
				textRange: tsdoc.TextRange.fromStringRange(buffer, comments[i].pos, comments[i].end)
			});
		}
	}

	return node.forEachChild(
		child => traverse(sourceFile, child, indent + '  ', rv)
	);
};

const main = function(args) {
	console.log("Hello, World! " + args.join("|"));
	const inputFilename = path.resolve(
		path.join(__dirname, "../../..", "loader", "$api.d.ts")
	);
	const program = ts.createProgram([ inputFilename ], {
		target: ts.ScriptTarget.ES5
	});

	console.log("input = " + inputFilename);
	const source = program.getSourceFile(inputFilename);

	const comments = [];

	traverse(source, source, '', comments);

	if (comments.length === 0) {
		console.log("No comments.");
	} else {
		//	TODO	Just do one for now.
		parseTSDoc(source, comments[0]);
	}
}

main(process.argv.slice(2));
