//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the SLIME loader for rhino.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

package inonit.script.rhino;

import java.io.*;
import java.util.*;

import org.mozilla.javascript.*;

public class Engine {
	public static abstract class Log {
		public abstract void println(String message);

		public final void println() {
			println("");
		}
	}

	public static abstract class Debugger {
		abstract void initialize(ContextFactory contexts);
		abstract void initialize(Scriptable scope, Engine engine, Program program);
		abstract void setBreakpoint(Engine.Source source, int line);
	}
	
	private static class NoDebugger extends Debugger {
		void initialize(ContextFactory contexts) {
		}
		
		void setBreakpoint(Engine.Source source, int line) {
		}
		
		void initialize(Scriptable scope, Engine engine, Program program) {
		}		
	}
	
	public static class RhinoDebugger extends Debugger {
		public static class Configuration {
			//	If true, we stop executing before we start, on the first line, and allow breakpoints to be set, etc.  If false,
			//	we stop at the first specified breakpoint.
			private boolean startWithBreak = true;
			
			//	If true, we stop executing when an exception is thrown.
			private boolean breakOnExceptions = true;

			private Runnable exit = new Runnable() {
				public void run() {
					System.exit(1);
				}
			};
			
			public Configuration() {
			}
			
			public void setExit(Runnable exit) {
				if (exit == null) {
					exit = new Runnable() {
						public void run() {							
						}
					};
				}
				this.exit = exit;
			}
		}
		
		public static RhinoDebugger create(Configuration configuration) {
			RhinoDebugger rv = new RhinoDebugger();
			rv.configuration = configuration;
			return rv;
		}
		
		private Configuration configuration;
		
		private org.mozilla.javascript.tools.debugger.Dim dim;
		private org.mozilla.javascript.tools.debugger.SwingGui gui;
		
		private org.mozilla.javascript.tools.debugger.Dim.SourceInfo getSourceInfo(String id) {
			return dim.sourceInfo(id);
		}
		
		private static class ExitAction implements Runnable {
			private org.mozilla.javascript.tools.debugger.Dim dim;
			private Runnable configurationExit;
			
			ExitAction(org.mozilla.javascript.tools.debugger.Dim dim, Runnable configurationExit) {
				this.dim = dim;
				this.configurationExit = configurationExit;
			}
			
			public void run() {
				configurationExit.run();
				dim.detach();
				dim.dispose();
			}
		}

		void initialize(ContextFactory contexts) {
			this.dim = new org.mozilla.javascript.tools.debugger.Dim();
			dim.attachTo(contexts);
			String title = "Script Debugger";
			
			if (configuration.startWithBreak) {
				dim.setBreak();
			}
			if (configuration.breakOnExceptions) {
				dim.setBreakOnExceptions(true);
			}
			
			this.gui = new org.mozilla.javascript.tools.debugger.SwingGui(dim, title);
			gui.setExitAction(new ExitAction(this.dim, configuration.exit));
			dim.attachTo(contexts);
		}
		
		void setBreakpoint(Engine.Source source, int line) {
			org.mozilla.javascript.tools.debugger.Dim.SourceInfo info = getSourceInfo(source.getSourceName());
			if (info != null) {
				info.breakpoint(line, true);
			} else {
				System.err.println("Not setting breakpoint at " + line + " in " + source + ": no source info");
			}
		}
		
		void initialize(Scriptable scope, Engine engine, Program program) {
			dim.setScopeProvider( new ScopeWrapper(scope) );
			gui.pack();
			gui.setVisible(true);
		}
		
		private static class ScopeWrapper implements org.mozilla.javascript.tools.debugger.ScopeProvider {
			private Scriptable scope;
			
			ScopeWrapper(Scriptable scope) {
				this.scope = scope;
			}
			
			public Scriptable getScope() {
				return scope;
			}
		}
	}
	
	public static Engine create(Debugger debugger, ContextFactory contexts) {
		Engine rv = new Engine();
		if (debugger == null) {
			debugger = new NoDebugger();
		}
		rv.debugger = debugger;
		rv.contexts = contexts;
		debugger.initialize(contexts);
		return rv;
	}
	
	private Debugger debugger;
	private ContextFactory contexts;
	
	private HashMap globals = new HashMap();
	
	private Engine() {
	}
	
	private Scriptable getGlobalScope(Context context) {
		Scriptable rv = (Scriptable)globals.get(context);
		if (rv == null) {
			rv = context.initStandardObjects();
			globals.put(context, rv);
		}
		return rv;
	}
	
	public static class Errors extends RuntimeException {
		public static Errors get(Context context) {
			if (context == null) throw new RuntimeException("'context' must not be null.");
			return ((Errors.ErrorReporterImpl)context.getErrorReporter()).getErrors();
		}
	
		private ArrayList errors = new ArrayList();
		private ErrorReporterImpl reporter = new ErrorReporterImpl();
		
		class ErrorReporterImpl implements ErrorReporter {
			public void warning(String string, String string0, int i, String string1, int i0) {
				errors.add(new ScriptError(ScriptError.Type.WARNING, string, string0, i, string1, i0, null));
			}

			public EvaluatorException runtimeError(String string, String string0, int i, String string1, int i0) {
				if (errors == null) throw new RuntimeException("errors is null.");
				errors.add(new ScriptError(ScriptError.Type.RUNTIME, string, string0, i, string1, i0, null));
				return new EvaluatorException(string, string0, i, string1, i0);
			}

			public void error(String string, String string0, int i, String string1, int i0) {
				errors.add(new ScriptError(ScriptError.Type.ERROR, string, string0, i, string1, i0, null));
			}
			
			Errors getErrors() {
				return Errors.this;
			}
		}
		
		ErrorReporterImpl getErrorReporter() {
			return reporter;
		}

		private void emitErrorMessage(Log err, String prefix, ScriptError e) {
			err.println(prefix + e.getSourceName() + ":" + e.getLineNumber() + ": " + e.getMessage());
			String errCaret = "";
			//	TODO	This appears to be null even when it should not be.
			if (e.getLineSource() != null) {
				for (int i=0; i<e.getLineSource().length(); i++) {
					char c = e.getLineSource().charAt(i);
					if (i < e.getColumn()-1) {
						if (c == '\t') {
							errCaret += "\t";
						} else {
							errCaret += " ";
						}
					} else if (i == e.getColumn()-1) {
						errCaret += "^";
					}
				}
				err.println(prefix + e.getLineSource());
				err.println(prefix + errCaret);
			}
			if (e.getStackTrace() != null) {
				err.println(e.getStackTrace());
			}
			err.println();
		}

		public void dump(Log err, String prefix) {
			err.println();
			err.println(prefix + "Script halted because of " + errors.size() + " errors.");
			err.println();
			for (int i=0; i<errors.size(); i++) {
				emitErrorMessage(err, prefix, (ScriptError)errors.get(i));
			}
		}
		
		public void reset() {
			this.errors = new ArrayList();
		}
		
		public ScriptError[] getErrors() {
			return (ScriptError[])this.errors.toArray(new ScriptError[0]);
		}
		
		private void addRhino(RhinoException e) {
			errors.add(new ScriptError(ScriptError.Type.RUNTIME, e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber(), e));
		}
		
		public void add(EcmaError e) {
			addRhino(e);
		}
		
		public void add(EvaluatorException e) {
			addRhino(e);
		}
		
		public void add(JavaScriptException e) {
			//	Thought about writing a separate method to construct ScriptError with no Throwable, under the theory that perhaps
			//	we would not want to dump a stack trace in this case (JavaScript throw keyword).  But decided in the end that
			//	stack traces are useful things, and if we want them for ordinary Java exceptions, JavaScript exceptions should
			//	qualify, too.
			addRhino(e);
		}
		
		public static class ScriptError {
			public static class Type {
				public static final Type RUNTIME = new Type();
				public static final Type ERROR = new Type();
				public static final Type WARNING = new Type();
				
				private Type() {
				}
			}
			
			private Type type;
			private String message;
			private String sourceName;
			private int line;
			private String lineSource;
			private int offset;
			private Throwable t;
			
			ScriptError(Type type, String message, String sourceName, int line, String lineSource, int offset, Throwable t) {
				this.type = type;
				this.message = message;
				this.sourceName = sourceName;
				this.line = line;
				this.lineSource = lineSource;
				this.offset = offset;
				this.t = t;
			}
			
			public String toString() {
				return getClass().getName() + " message=" + message + " sourceName=" + sourceName + " line=" + line;
			}
			
			public boolean is(Type type) {
				return this.type == type;
			}
			
			public String getSourceName() {
				return sourceName;
			}
			
			public int getLineNumber() {
				return line;
			}
			
			public String getLineSource() {
				return lineSource;
			}
			
			public int getColumn()  {
				return offset;
			}
			
			public String getMessage() {
				return message;
			}
			
			public String getStackTrace() {
				//	TODO	This implementation would be much easier with programmatic access to Rhino stack traces...
				if (t == null) return null;
				StringWriter s = new StringWriter();
				PrintWriter p = new PrintWriter(s, true);
				if (false) {
					t.printStackTrace(p);
					return s.toString();
				} else {
					t.printStackTrace(p);
					String topStack = s.toString();
					if (topStack.indexOf("Caused by:") != -1) {
						topStack = topStack.substring(0, topStack.indexOf("Caused by:"));
					}
					s = new StringWriter();
					p = new PrintWriter(s, true);
					p.print(topStack);
					Throwable target = t.getCause();
					while(target != null) {
						p.println("Caused by: " + target.getClass().getName() + ": " + target.getMessage());
						for (int i=0; i<target.getStackTrace().length; i++) {
							StackTraceElement e = target.getStackTrace()[i];
							p.println("\tat " + e);
						}
						target = target.getCause();
						if (target != null) {
							p.print("Caused by: ");
						}
					}
					return s.toString();
				}
			}
			
			public Throwable getThrowable() {
				return t;
			}			
		} 
	}
	
	public Object execute(Program program) {
		Program.Outcome outcome = (Program.Outcome)contexts.call(new ProgramAction(this, program, debugger));
		return outcome.getResult();
	}
	
	public Object evaluate(Program program, String name, Class type) {
		Program.Outcome outcome = (Program.Outcome)contexts.call(new ProgramAction(this, program, debugger));
		return outcome.castScopeTo(name, type);
	}
	
	public Object evaluate(Program program, Class type) {
		Program.Outcome outcome = (Program.Outcome)contexts.call(new ProgramAction(this, program, debugger));
		return outcome.castScopeTo(null, type);
	}
	
	//	XXX	Would this work in a multithreaded environment in which scripts started their own threads?
	/**
	 *	This method can be exposed to scripts to allow a script to include its own script code into its environment, using 
	 *	<code>jsThis</code> as the scope
	 *	for the new code included in <code>source</code>.
	 */
	public void include(Scriptable jsThis, Engine.Source source) throws IOException {
		Context context = Context.getCurrentContext();
		source.evaluate(debugger, context, jsThis);
	}

	public Scriptable evaluate(Scriptable scope, String code) {
		return (Scriptable)Context.getCurrentContext().evaluateString(scope, code, "<cmd>", 1, null);
	}
	
	public void script(Scriptable scope, String name, InputStream code) throws IOException {
		this.include(scope, Engine.Source.create(name, new InputStreamReader(code)));
	}

	public static abstract class Loader {
		public abstract String getPlatformCode() throws IOException;
		public abstract String getRhinoCode() throws IOException;
	}

	public static abstract class Source {
		public static Source create(String sourceName, java.io.Reader reader) {
			if (reader == null) throw new RuntimeException("'reader' must not be null.");
			return new ReaderSource(sourceName, reader);
		}
		
		public static Source create(String sourceName, String s) {
			return new ReaderSource(sourceName, new StringReader(s));
		}
		
		/**
			Creates a new <code>Source</code> using the contents of the given file.
		 
			@param file A file containing a script.  Must exist.
		 */
		public static Source create(java.io.File file) {
			try {
				return new ReaderSource(file.getCanonicalPath(), new FileReader(file));
			} catch (java.io.FileNotFoundException e) {
				throw new RuntimeException("Could not find file: [" + file.getPath() + "]", e);
			} catch (IOException e) {
				throw new RuntimeException("Cannot get canonical path of " + file);
			}
		}
		
		private boolean debug = true;
		
		final boolean debug() {
			return debug;
		}
		
		abstract String getSourceName();
		abstract Script compile(Debugger dim, Context context) throws java.io.IOException;
		
		public final void setDebug(boolean debug) {
			this.debug = debug;
		}
		
		private ArrayList breakpoints = new ArrayList();
		
		final void addBreakpoint(int line) {
			breakpoints.add( new Integer(line) );
		}
		
		final void setBreakpoints(Debugger dim) {
			if (dim != null) {
				for (int j=0; j<breakpoints.size(); j++) {
					int line = ((Integer)breakpoints.get(j)).intValue();
					try {
						dim.setBreakpoint( this, line );
					} catch (IllegalArgumentException e) {
						System.err.println("Cannot set breakpoint at line " + line + " of " + getSourceName());
					}
				}
			}			
		}
		
		final Object evaluate(Debugger dim, Context context, Scriptable scope) throws java.io.IOException {
			Script script = compile(dim, context);
			return script.exec(context, scope);
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
			
			final Script compile(Debugger dim, Context context) throws java.io.IOException {
				int i;
				StringBuffer b = new StringBuffer();
				BufferedReader lines = new BufferedReader(reader);
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
					} else if (line.length() > 0 && line.trim().equals("debugger;") && debug()) {
						//	TODO	This absurd workaround is because I don't like how Rhino decides when to pop up the debugger
						//			when using the debugger keyword
						addBreakpoint(number);
						toParser = line.replace("debugger;", "/* BREAKPOINT */ new Object();");
					} else {
						toParser = line;
					}
					b.append( toParser + "\n" );
				}
				String code = b.toString();
				Script rv = context.compileString(code, id, 1, null);
				setBreakpoints(dim);
				return rv;
			}
		}
	}
	
	public static class Program {
		private ArrayList variables = new ArrayList();
		private ArrayList units = new ArrayList();
		
		public void set(Variable variable) {
			variables.add( variable );
		}

		private static class ObjectName {
			static final ObjectName NULL = new ObjectName();

			void set(Context context, Scriptable global, Variable variable) {
				ScriptableObject.defineProperty(
					global,
					variable.getName(),
					variable.getValue(context, global),
					variable.getRhinoAttributes()
				);
			}

			Scriptable get(Context context, Scriptable global, boolean create) {
				return global;
			}
		}
		
		/**
			Adds a script to this <code>Program</code> with an optional <code>ObjectName</code>.
		 
			@param scope An object name to use in the global scope, or <code>null</code> for the global scope.
			@param source The source for the script.
		 */
		public void add(ObjectName scope, Source source) {
			if (scope == null) scope = ObjectName.NULL;
			units.add( new SourceUnit(scope, source) );
		}

		public void add(Source source) {
			units.add( new SourceUnit(ObjectName.NULL, source) );
		}
		
		public void add(Function function, Object[] arguments) {
			units.add( new FunctionUnit(function, arguments) );
		}
		
		public void add(Unit unit) {
			units.add(unit);
		}
		
		static class Outcome {
			private Scriptable global;
			private Object result;
			
			Outcome(Scriptable global, Object result) {
				this.global = global;
				this.result = result;
			}
			
			Scriptable getGlobal() {
				return global;
			}
			
			Object getResult() {
				return result;
			}
			
			Object castScopeTo(String name, Class type) {
				if (name == null) return Context.jsToJava( global, type );
				return Context.jsToJava( ScriptableObject.getProperty(global, name), type);
			}
		}
		
		void setVariablesInGlobalScope(Context context, Scriptable global) {
			for (int i=0; i<variables.size(); i++) {
				Variable v = (Variable)variables.get(i);
				Object value = v.value.get(context, global);
				
				//	Deal with dumb Rhino restriction that we use object arrays only
				if (value instanceof Object[]) {
					Object[] array = (Object[])value;
					Object[] objects = new Object[array.length];
					for (int j=0; j<objects.length; j++) {
						objects[j] = array[j];
					}
					value = context.newArray( global, objects );
				}
				
				v.set(context, global);
			}			
		}
		
		private Outcome execute(Debugger dim, Context context, Scriptable global) throws IOException {
			if (context == null) {
				throw new RuntimeException("'context' is null");
			}
			Object ignore = null;
			for (int i=0; i<units.size(); i++) {
				Errors errors = Errors.get(context);
				errors.reset();
				try {
					ignore = ((Unit)units.get(i)).execute(dim, context, global);
				} catch (WrappedException e) {
					//	TODO	Note that when this is merged into jsh, we will need to change jsh error reporting to dump the
					//			stack trace from the contained Throwable inside the errors object.
//					throw e;
					errors.add(e);
					throw errors;
				} catch (EvaluatorException e) {
					//	TODO	Oh my goodness, is there no better way to do this?
					if (e.getMessage().indexOf("Compilation produced") == -1 || e.getMessage().indexOf("syntax errors.") == -1) {
						errors.add(e);
					}
					throw errors;
				} catch (EcmaError e) {
					errors.add(e);
					throw errors;
				} catch (JavaScriptException e) {
					errors.add(e);
					throw errors;
				}
			}
			return new Outcome(global, ignore);
		}
		
		Outcome interpret(Debugger dim, Context context, Scriptable global) throws IOException {
			if (context == null) {
				throw new RuntimeException("'context' is null");
			}
			return execute(dim, context, global);
		}
		
		public static class Variable {
			public static Variable create(String name, Value value) {
				return new Variable(ObjectName.NULL, name, value, new Attributes());
			}
			
			private ObjectName scope;
			private String name;
			private Value value;
			private Attributes attributes;
			
			Variable(ObjectName scope, String name, Value value, Attributes attributes) {
				this.scope = scope;
				this.name = name;
				this.value = value;
				this.attributes = attributes;
			}

			String getName() {
				return name;
			}

			Object getValue(Context context, Scriptable scope) {
				return value.get(context, scope);
			}

			int getRhinoAttributes() {
				return attributes.toRhinoAttributes();
			}
			
			void set(Context context, Scriptable global) {
				scope.set(context, global, this);
			}
			
			public void setPermanent(boolean permanent) {
				attributes.permanent = permanent;
			}

			public void setReadonly(boolean readonly) {
				attributes.readonly = readonly;
			}

			public void setDontenum(boolean dontenum) {
				attributes.dontenum = dontenum;
			}
			
			public static abstract class Value {
				public static Value create(final Object o) {
					return new Value() {
						public Object get(Context context, Scriptable scope) {
							return Context.javaToJS(o, scope);
						}
					};
				}
				
				public abstract Object get(Context context, Scriptable scope);
			}
				
			public static class Attributes {
				public static Attributes create() {
					return new Attributes();
				}
				
				private boolean permanent;
				private boolean readonly;
				private boolean dontenum;
				
				private Attributes() {
				}
				
				int toRhinoAttributes() {
					int rv = ScriptableObject.EMPTY;
					if (permanent) rv |= ScriptableObject.PERMANENT;
					if (readonly) rv |= ScriptableObject.READONLY;
					if (dontenum) rv |= ScriptableObject.DONTENUM;
					return rv;
				}				
			}
		}
		
		public static abstract class Unit {
			protected abstract Object execute(Debugger dim, Context context, Scriptable global) throws IOException;
		}
		
		private static class SourceUnit extends Unit {
			private ObjectName scope;
			private Source source;
			
			SourceUnit(ObjectName scope, Source source) {
				this.scope = scope;
				this.source = source;
			}
			
			protected Object execute(Debugger dim, Context context, Scriptable global) throws IOException {
				Script script = source.compile(dim, context);
				Scriptable executionScope = scope.get(context, global, true);
				Object rv = script.exec(context, executionScope);
				return rv;
			}
		}
		
		private static class FunctionUnit extends Unit {
			private Function function;
			private Object[] arguments;
			
			FunctionUnit(Function function, Object[] arguments) {
				this.function = function;
				this.arguments = arguments;
			}
			
			protected Object execute(Debugger dim, Context context, Scriptable global) {
				return function.call(context, global, global, arguments);
			}
		}
	}
	
	private static class ProgramAction implements ContextAction {
		private Engine engine;
		private Program program;
		private Debugger debugger;
		
		ProgramAction(Engine engine, Program program, Debugger debugger) {
			this.engine = engine;
			this.program = program;
			this.debugger = debugger;
		}
		
		public Object run(Context context) {
			try {
				Scriptable global = engine.getGlobalScope(context);
				program.setVariablesInGlobalScope(context, global);
				debugger.initialize(global, engine, program);
				Program.Outcome outcome = program.interpret(debugger, context, global);
				return outcome;
			} catch (java.io.IOException e) {
				throw new RuntimeException(e);
			}
		}
	}
	
	public Module load(Module.Code source) {
		if (source == null) throw new NullPointerException("'source' must not be null.");
		return new Module(this, source);
	}
}
