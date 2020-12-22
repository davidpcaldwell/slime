namespace jsh.unit {
	namespace internal.remote {
		interface Context {
			api: {
				java: slime.jrunscript.host.Exports
				unit: any
			}
		}

		interface Exports {
			Events: any
			Decoder: any
			Stream: any
		}
	}
}