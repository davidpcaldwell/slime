namespace slime.jsh.httpd {
	export interface Resources {
		file: any
		add: (m: { directory?: slime.jrunscript.file.Directory, loader?: slime.Loader, prefix: string }) => void
		loader: any
	}

	export namespace resources {
		export interface Context {
			getMimeType: (file: slime.jrunscript.file.File) => slime.MimeType
			jsh: slime.jsh.Global
		}

		export type Export = {
			new (): Resources
			Old: any
			NoVcsDirectory: any
			script: any
		}

		export type Factory = slime.Loader.Product<Context,Export>
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