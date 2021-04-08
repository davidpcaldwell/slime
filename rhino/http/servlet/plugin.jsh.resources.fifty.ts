namespace slime.jsh.httpd {
	export interface Resources {
		add: (m: { directory?: slime.jrunscript.file.Directory, loader?: slime.Loader, prefix: string }) => void

		/** @deprecated */
		map: {
			(prefix: string, pathname: slime.jrunscript.file.Pathname): void
			/** @deprecated Use the string, Pathname version */
			(prefix: string, pathname: slime.jrunscript.file.Directory): void
		}

		/**
		 * Allows the execution of mapping information stored in a separate file; Executes the given {@link resources.Mapping} with
		 * a {@link resources.Scope} created by combining information
		 * from the mapping with the given scope argument, if any.
		 */
		file: (
			file: resources.Mapping,
			scope?: { [x: string]: any }
		) => void

		loader: any
	}

	export namespace resources {
		export interface Context {
			getMimeType: (file: slime.jrunscript.file.File) => slime.mime.Type
			jsh: slime.jsh.Global
		}

		export type Export = {
			new (): Resources
			Old: any
			NoVcsDirectory: any
			script: any
		}

		export type Factory = slime.loader.Product<Context,Export>

		export type Mapping = slime.jrunscript.file.File | LoaderMapping | CodeMapping

		export interface LoaderMapping {
			loader: slime.Loader
			path: string
		}

		export interface CodeMapping {
			/** File name to use when executing. */
			name: string
			/** Code to execute. */
			string: string
		}

		export interface Scope {
			$mapping: slime.jrunscript.file.File
			map: Resources["map"]
			add?: Resources["add"]
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				var factory: resources.Factory = fifty.$loader.factory("plugin.jsh.resources.js");
				var api = factory({
					getMimeType: fifty.global.jsh.httpd.nugget.getMimeType,
					jsh: fifty.global.jsh
				});
				var type: string = typeof(api);
				fifty.verify({ type: type }).type.is("function");
			}
		}
	//@ts-ignore
	)(fifty);

}