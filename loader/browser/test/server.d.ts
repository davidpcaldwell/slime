namespace slime.runtime.browser.test.server {
	type Export = (
		/** The directory to use when serving servlet resources, which is the SLIME directory for this purpose. */
		resources: slime.jrunscript.file.Directory,
		/** The base directory to serve, which is the common root for SLIME and the test file. */
		serve: slime.jrunscript.file.Directory,
		/** A path, relative to the served directory, that will both accept the result via POST and return it via GET. */
		resultsPath: string
	) => jsh.httpd.Tomcat

	type Factory = slime.loader.Product<any,Export>
}