namespace slime.fifty {
	interface Exports {
		ast: (p: { node: { script: slime.jrunscript.file.Pathname, debug?: boolean }, ast: slime.jrunscript.file.Pathname, file: slime.jrunscript.file.Pathname }) => object
	}
}