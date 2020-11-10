namespace slime.runtime.browser.test {
	namespace results {
		interface Context {
			library: {
				java: jsh["java"]
				shell: jsh["shell"]
			}
		}

		interface Configuration {
			url: string
		}

		type Factory = (configuration: Configuration) => slime.servlet.handler
	}
}