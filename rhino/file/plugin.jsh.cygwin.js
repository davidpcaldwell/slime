//	Untested because it is currently unsupported
if ($slime.getSystemProperty("cygwin.root") || $slime.getSystemProperty("cygwin.paths")) {
	context.cygwin = {
		root: $slime.getSystemProperty("cygwin.root"),
		paths: $slime.getSystemProperty("cygwin.paths")
	}
}			
