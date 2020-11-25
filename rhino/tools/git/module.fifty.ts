namespace slime.jrunscript.git {

	var code = (function(
		fifty: slime.fifty.test.kit
	) {
		var module = jsh.tools.git;
		var fixtures = fifty.$loader.file("fixtures.js", { module: module });
		return { module, fixtures }
	//@ts-ignore
	})(fifty)

	export interface Installation {
		/**
		 * Creates a new repository at the given location (see `git init`).
		 *
		 * @returns The local repository created.
		 */
		init: (
			p: {
				/**
				 * A location at which to create an empty repository.
				 */
				pathname: slime.jrunscript.file.Pathname
			},
			events?: $api.Events.Handler<"stdout" | "stderr">
		) => slime.jrunscript.git.Repository.Local
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var verify = fifty.verify;

			var fixture = {
				write: function(o) {
					var directory = (function() {
						if (o.repository) return o.repository.directory;
						if (o.directory) return o.directory;
					})();
					for (var x in o.files) {
						//	TODO	add function form which receives string as argument
						directory.getRelativePath(x).write(o.files[x], { append: false });
					}
				}
			};

			fifty.tests.Installation = {};
			fifty.tests.Installation.init = function() {
				var verifyEmptyRepository = function(repository: Repository.Local) {
					verify(repository).is.type("object");
					verify(repository).log().length.is(0);
				};

				run(function worksWhenCreatingDirectory() {
					var location = fifty.jsh.file.location();
					verify(location).directory.is(null);
					var createdLocation = code.module.init({
						pathname: location
					});
					verify(location).directory.is.type("object");
					verifyEmptyRepository(createdLocation);
				});

				run(function worksWithEmptyDirectory() {
					var directory = fifty.jsh.file.directory();

					fixture.write({
						directory: directory,
						files: {
							"a": "a"
						}
					});

					var captor = fifty.$api.Events.Captor("stdout", "stderr");

					var isType = function(type: string): (e: $api.Event<any>) => boolean {
						return $api.Function.pipe(
							$api.Function.property("type"),
							function(p) {
								return p === type;
							}
						)
					};

					var ofType = function(type: string) {
						return function(events: $api.Event<any>[]) {
							return events.filter(isType(type));
						}
					}

					var repository = code.module.init({
						pathname: directory.pathname
					}, captor.handler);

					verifyEmptyRepository(repository);
					verify(repository).directory.getFile("a").is.type("object");

					verify(captor).events.evaluate(ofType("stdout")).length.is(2);
					verify(captor).events.evaluate(ofType("stdout"))[1].detail.is("");
				});
			};

			fifty.tests.suite = function() {
				run(fifty.tests.Installation.init);
			}
		}
	//@ts-ignore
	)(fifty)
}