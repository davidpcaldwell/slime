package inonit.script.rhino;

import java.io.*;
import java.util.*;

import org.mozilla.javascript.*;

import inonit.script.engine.*;

abstract class Source {
	//	TODO	should look at further unifying Code.Loader and Source. Is the create(String, String) method necessary?
	//			what about create(String, InputStream) used by Rhino servlet?

	static Source create(String sourceName, String code) {
		return new ReaderSource(sourceName, new StringReader(code));
	}

	static Source create(Host.Script script) {
		return new ReaderSource(script.getName(), new StringReader(script.getCode()));
	}

	private boolean debug = true;

	final boolean debug() {
		return debug;
	}

	abstract String getSourceName();

	abstract Object evaluate(Debugger dim, Context context, Scriptable scope, Scriptable target, boolean compile) throws java.io.IOException;

	/**
	 * This method should allow disabling debugging for a given {@link Source}, but is currently unused and untested.
	 *
	 * @param debug false to disable debugging for this file; true (default) to allow it
	 */
	final void setDebug(boolean debug) {
		this.debug = debug;
	}

	private ArrayList<Integer> breakpoints = new ArrayList<Integer>();

	final void addBreakpoint(int line) {
		breakpoints.add( Integer.valueOf(line) );
	}

	final void setBreakpoints(Debugger dim) {
		if (dim != null) {
			for (int j=0; j<breakpoints.size(); j++) {
				int line = breakpoints.get(j).intValue();
				try {
					dim.setBreakpoint( this, line );
				} catch (IllegalArgumentException e) {
					dim.log("Cannot set breakpoint at line " + line + " of " + getSourceName());
				}
			}
		}
	}

	final Object evaluate(Debugger dim, Engine.Configuration configuration, Scriptable scope, Scriptable target) throws java.io.IOException {
		Context context = configuration.getContext();
		if (context == null) {
			throw new IllegalArgumentException("context is null");
		}
		Errors errors = Errors.get(context);
		try {
			if (errors != null) {
				errors.reset();
			}
			final boolean USE_COMPILE = true;
			return evaluate(dim, context, scope, target, USE_COMPILE);
		} catch (EvaluatorException e) {
			if (errors != null && errors.errors().size() > 0) {
				throw errors;
			} else {
				throw e;
			}
		}
	}

	private static class ReaderSource extends Source {
		private String id;
		private java.io.Reader reader;

		ReaderSource(String id, java.io.Reader reader) {
			this.id = id;
			this.reader = reader;
		}

		final String getSourceName() {
			return id;
		}

		private String parse(BufferedReader lines) throws IOException {
			StringBuffer b = new StringBuffer();
			String line;
			int number = 0;
			while( (line = lines.readLine()) != null) {
				number++;
				String toParser;
				if (line.length() > 0 && line.charAt(0) == '^') {
					if (debug()) {
						addBreakpoint( number );
					}
					toParser = line.substring(1);
				} else if (line.length() > 0 && line.charAt(0) == '#') {
					//	We actually do want to insert a blank line here to preserve line numbers, but we will put in the
					//	JavaScript comment for good measure
					toParser = "//" + line;
				} else if (line.length() > 0 && line.trim().equals("debugger;")) {
					//	TODO	This absurd workaround is because I don't like how Rhino decides when to pop up the debugger
					//			when using the debugger keyword
					if (debug()) {
						addBreakpoint(number);
						toParser = line.replace("debugger;", "/* BREAKPOINT */ new Object();");
					} else {
						toParser = line.replace("debugger;", "// debugging disabled; was debugger;");
					}
				} else {
					toParser = line;
				}
				b.append( toParser + "\n" );
			}
			String code = b.toString();
			return code;
		}

		private static class TargetingScope implements Scriptable {
			private static final String THIS_IDENTIFIER = "__target__";

			private Scriptable scope;
			private Scriptable target;

			TargetingScope(Scriptable scope, Scriptable target) {
				this.scope = scope;
				this.target = target;
			}

			public String getClassName() {
				return scope.getClassName();
			}

			public Object get(String string, Scriptable s) {
				if (string.equals(THIS_IDENTIFIER)) {
					return target;
				}
				return scope.get(string, s);
			}

			public Object get(int i, Scriptable s) {
				return scope.get(i, s);
			}

			public boolean has(String string, Scriptable s) {
				if (string.equals(THIS_IDENTIFIER)) {
					return true;
				}
				return scope.has(string, s);
			}

			public boolean has(int i, Scriptable s) {
				return scope.has(i, s);
			}

			public void put(String string, Scriptable s, Object o) {
				scope.put(string, s, o);
			}

			public void put(int i, Scriptable s, Object o) {
				scope.put(i, s, o);
			}

			public void delete(String string) {
				scope.delete(string);
			}

			public void delete(int i) {
				scope.delete(i);
			}

			public Scriptable getPrototype() {
				return scope.getPrototype();
			}

			public void setPrototype(Scriptable s) {
				scope.setPrototype(s);
			}

			public Scriptable getParentScope() {
				return scope.getParentScope();
			}

			public void setParentScope(Scriptable s) {
				scope.setParentScope(s);
			}

			public Object[] getIds() {
				return scope.getIds();
			}

			public Object getDefaultValue(Class<?> type) {
				return scope.getDefaultValue(type);
			}

			public boolean hasInstance(Scriptable s) {
				return scope.hasInstance(s);
			}
		}

		final Object evaluate(Debugger dim, Context context, Scriptable scope, Scriptable target, boolean compile) throws IOException {
			BufferedReader lines = new BufferedReader(reader);
			String code = parse(lines);
			try {
				if (target != scope && target != null) {
					scope = new TargetingScope(scope,target);
					code = "(function(){ " + code + "\n}).call(" + TargetingScope.THIS_IDENTIFIER + ");";
				}
				Script script = null;
				if (compile) {
					script = context.compileString(code, id, 1, null);
				}
				setBreakpoints(dim);
				//	Rhino is going to evaluate this script as a top-level script, in the magic global scope. Thus, the global scope will also be 'this'
				//	and we cannot set a separate scope that acts as the provider of scope variables and 'this' object that will be set for a particular
				//	script. Our API specifies, however, that we can do this. So we do a source-level transformation to make it possible.
				if (compile) {
					//	TODO	this does not seem to work if a target is supplied; seems to return null
					return script.exec(context, scope);
				} else {
					return context.evaluateString(scope, code, id, 1, null);
				}
			} catch (org.mozilla.javascript.EvaluatorException e) {
				//	TODO	would be nice to somehow attach the code variable to this so that someone could see what source code failed
				throw e;
			} finally {
				try {
					lines.close();
				} catch (IOException e) {
					//	TODO	do some sort of reasonable logging or notification or something
					System.err.println("Error closing: " + reader);
					e.printStackTrace();
				}
			}
		}
	}
}
