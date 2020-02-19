/* eslint-env es6 */
//	Reference: https://github.com/microsoft/tsdoc/blob/master/api-demo/src/advancedDemo.ts
//	https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
const os = require("os");
const path = require("path");
const fs = require("fs");

const ts = require("typescript");
const tsdoc = require("@microsoft/tsdoc");

var kinds = (function() {
	const rv = {};
	for (var x in ts.SyntaxKind) {
		rv[ts.SyntaxKind[x]] = x;
	}
	return rv;
})();

function docNodeToJson(docNode) {
	var rv = {};
	if (docNode instanceof tsdoc.DocExcerpt) {
		rv.content = docNode.content.toString();
		rv.excerptKind = docNode.excerptKind;
	} else {
		rv.kind = docNode.kind;
	}
	rv.children = docNode.getChildNodes().map(docNodeToJson);
	return rv;
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

const tsdocParser = (function() {
	const customConfiguration = new tsdoc.TSDocConfiguration();

	const customInlineDefinition = new tsdoc.TSDocTagDefinition({
		tagName: "@customInline",
		syntaxKind: tsdoc.TSDocTagSyntaxKind.InlineTag,
		allowMultiple: true
	});

	// NOTE: Defining this causes a new DocBlock to be created under docComment.customBlocks.
	// Otherwise, a simple DocBlockTag would appear inline in the @remarks section.
	const customBlockDefinition = new tsdoc.TSDocTagDefinition({
		tagName: "@typedef",
		syntaxKind: tsdoc.TSDocTagSyntaxKind.BlockTag
	});

	// NOTE: Defining this causes @customModifier to be removed from its section,
	// and added to the docComment.modifierTagSet
	const customModifierDefinition = new tsdoc.TSDocTagDefinition({
		tagName: "@customModifier",
		syntaxKind: tsdoc.TSDocTagSyntaxKind.ModifierTag
	});

	customConfiguration.addTagDefinitions([
		customInlineDefinition,
		customBlockDefinition,
		customModifierDefinition
	]);

	console.log(os.EOL + "Creating TSDocParser with custom configuration..." + os.EOL);
	return new tsdoc.TSDocParser(customConfiguration);
})();

const traverse = function(sourceFile, node) {
	const isDeclaration = isDeclarationKind(node.kind);
	if (false) console.log("isDeclarationKind", kinds[node.kind], match);
	const comments = (function() {
		if (isDeclaration) {
			const comments = sourceFile.getJsdocCommentRanges(node);
			return comments.map(function(comment) {
				const range = sourceFile.getTextRange(comment);
				const parserContext = tsdocParser.parseRange(range);
				//const docComment = parserContext.docComment;
				return {
					string: range.toString(),
					parsed: docNodeToJson(parserContext.docComment),
					log: {
						messages: parserContext.log.messages.map(function(message) {
							return message.toString()
						})
					}
				}
			});
		} else {
			return null;
		}
	})();

	const children = (function() {
		var children = [];
		node.forEachChild(function(child) {
			children.push(traverse(sourceFile, child));
		});
		return (children.length) ? children : void(0);
	})();

	const parent = (function() {
		const rv = {
			kind: kinds[node.kind]
		};
		if (rv.kind == "Identifier") rv.text = node.text;
		if (rv.kind == "FunctionDeclaration") rv.name = node.name.text;
		if (comments) rv.comments = comments;
		return rv;
	})();

	return {
		object: parent,
		children: children
	}
};

var SourceFile = function(o) {
	const buffer = o.sourceFile.getFullText();

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
		//console.log("text", text);
		commentRanges.push(...ts.getLeadingCommentRanges(text, node.pos) || []);

		if (false) console.log(
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

	this.getJsdocCommentRanges = function(node) {
		return getJSDocCommentRanges(node, buffer)
	}

	this.node = o.sourceFile;

	this.getTextRange = function(comment) {
		return tsdoc.TextRange.fromStringRange(buffer, comment.pos, comment.end);
	}
}

const main = function(args) {
	const inputFilename = args[0];
	const outputFilename = args[1];

	console.error("input =  " + inputFilename);
	console.error("output = " + outputFilename);

	const program = ts.createProgram([ inputFilename ], {
		target: ts.ScriptTarget.ES5,
		allowJs: true
	});

	const source = program.getSourceFile(inputFilename);
	if (!source) throw new Error("No source file: " + inputFilename);
	const sourceFile = new SourceFile({ sourceFile: source });

	const json = traverse(sourceFile, sourceFile.node, [], []);

	function keep(json) {
		if (json.object.comments && json.object.comments.length) return true;
		if (json.children && json.children.some(function(child) {
			return keep(child);
		})) return true;
		return true;
	}

	function prune(tree) {
		if (tree.children) {
			tree.children.forEach(function(child) {
				prune(child);
			});
			tree.children = tree.children.filter(function(child) {
				return keep(child);
			});
			if (tree.children.length == 0) {
				delete tree.children;
			}
		}
	}

	prune(json)

	// if (comments.length === 0) {
	// 	console.log("No comments.");
	// } else {
	// 	//	TODO	Just do one for now.
	// 	parseTSDoc(source, comments[0]);
	// }

	fs.mkdirSync(path.dirname(outputFilename), { recursive: true });
	fs.writeFileSync(outputFilename, JSON.stringify(json, void(0), "    "));
}

main(process.argv.slice(2));
