namespace slime.tools.documentation {
	export interface Configuration {
		base: slime.jrunscript.file.Directory
		watch: boolean
	}

	export type factory = (p: slime.servlet.httpd) => slime.servlet.handler

	/**
	 * Using a configuration, creates a function capable of creating a servlet handler that can serve Typedoc documentation given
	 * the httpd API.
	 */
	export type implementation = (configuration: Configuration) => factory

	export namespace internal.asTextHandler {
		export type Context = { httpd: slime.servlet.httpd }
		export type Export = slime.servlet.httpd["Handler"]["Loader"];
		export type Factory = slime.loader.Product<Context,Export>
	}
}