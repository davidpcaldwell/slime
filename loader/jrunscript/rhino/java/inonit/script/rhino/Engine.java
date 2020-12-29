//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.rhino;

import java.io.*;
import java.util.*;

import org.mozilla.javascript.*;

import inonit.script.engine.*;

public class Engine {
	public static abstract class Log {
		public static final Log NULL = new Log() {
			public void println(String message) {
			}
		};

		public abstract void println(String message);

		public final void println() {
			println("");
		}
	}

	public static abstract class Debugger {
		abstract void initialize(Configuration contexts);
		abstract void initialize(Scriptable scope, Engine engine, Program program);
		abstract void setBreakpoint(Source source, int line);
		abstract Log getLog();

		final void log(String message) {
			getLog().println(message);
		}

		public abstract boolean isBreakOnExceptions();
		public abstract void setBreakOnExceptions(boolean breakOnExceptions);
		public abstract void destroy();
	}

	private static class NoDebugger extends Debugger {
		void initialize(Configuration contexts) {
		}

		void setBreakpoint(Source source, int line) {
		}

		void initialize(Scriptable scope, Engine engine, Program program) {
		}

		Log getLog() {
			return Log.NULL;
		}

		public boolean isBreakOnExceptions() {
			return false;
		}

		public void setBreakOnExceptions(boolean breakOnExceptions) {
		}

		public void destroy() {
		}
	}

	public static class Profiler extends Debugger {
		private org.mozilla.javascript.debug.Debugger debugger = new MyDebugger();
		private Listener listener;
		private boolean useStringNodes;

		//	TODO	should not be public
		public Profiler() {
			this.listener = AgentListener.get();
			//System.err.println("Profiler listener: " + this.listener);
		}

		public final void useStringNodes() {
			this.useStringNodes = true;
		}

		private static abstract class Listener {
			abstract void start(Object o);
			abstract void end(Object o);
		}

		private static class AgentListener extends Listener {
			static AgentListener get() {
				try {
					java.lang.reflect.Field field = Class.forName("inonit.tools.Profiler").getDeclaredField("javaagent");
					field.setAccessible(true);
					Object agent = field.get(null);
					return new AgentListener(agent);
				} catch (ClassNotFoundException e) {
					return null;
				} catch (NoSuchFieldException e) {
					return null;
				} catch (IllegalAccessException e) {
					throw new RuntimeException(e);
				}
			}

			private Object agent;
			private java.lang.reflect.Method start;
			private java.lang.reflect.Method stop;

			AgentListener(Object agent) {
				this.agent = agent;
				try {
					this.start = agent.getClass().getDeclaredMethod("start", Object.class);
					this.stop = agent.getClass().getDeclaredMethod("stop", Object.class);
				} catch (NoSuchMethodException e) {
					throw new RuntimeException(e);
				}
			}

			void start(Object o) {
				try {
					start.invoke(agent, o);
				} catch (IllegalAccessException e) {
					throw new RuntimeException(e);
				} catch (java.lang.reflect.InvocationTargetException e) {
					throw new RuntimeException(e);
				}
			}

			void end(Object o) {
				try {
					stop.invoke(agent, o);
				} catch (IllegalAccessException e) {
					throw new RuntimeException(e);
				} catch (java.lang.reflect.InvocationTargetException e) {
					throw new RuntimeException(e);
				}
			}
		}

		public static class CodeImpl {
			private org.mozilla.javascript.debug.DebuggableScript script;
			private int[] lines;

			private String string;

			CodeImpl(org.mozilla.javascript.debug.DebuggableScript script) {
				this.script = script;
				//	TODO	should array be copied?
				this.lines = script.getLineNumbers();
				Arrays.sort(lines);
				String rv = script.getSourceName() + " [" + lines[0] + "-" + lines[lines.length-1] + "]";
				if (script.getFunctionName() != null) {
					rv += " " + script.getFunctionName() + "()";
				}
				this.string = rv;
			}

			public String toString() {
				return string;
			}

			public int hashCode() {
				return string.hashCode();
			}

			public boolean equals(Object o) {
				if (o == null) return false;
				if (!(o instanceof CodeImpl)) return false;
				return this.toString().equals(o.toString());
			}

			public String getSourceName() {
				return script.getSourceName();
			}

			public int[] getLineNumbers() {
				return lines;
			}

			public String getFunctionName() {
				return script.getFunctionName();
			}
		}

		private class MyDebugger implements org.mozilla.javascript.debug.Debugger {
			private class DebugFrameImpl implements org.mozilla.javascript.debug.DebugFrame {
				private Listener listener;
				private CodeImpl code;

				DebugFrameImpl(org.mozilla.javascript.debug.DebuggableScript script, Listener listener) {
					if (script == null) {
						throw new NullPointerException();
					}
					this.listener = listener;
					this.code = new CodeImpl(script);
				}

				public String toString() {
					return code.toString();
				}

				public void onEnter(Context cntxt, Scriptable s, Scriptable s1, Object[] os) {
					//System.err.println("Script enter: " + code);
					if (listener != null) {
						if (useStringNodes) {
							listener.start(code.toString());
						} else {
							listener.start(code);
						}
					}
				}

				public void onExit(Context cntxt, boolean byThrow, Object resultOrException) {
					//System.err.println("Script exit: " + code);
					if (listener != null) {
						if (useStringNodes) {
							listener.end(code.toString());
						} else {
							listener.end(code);
						}
					}
				}

				public void onExceptionThrown(Context cntxt, Throwable thrwbl) {
					//	We do not care; onExit will be called below
				}

				public void onLineChange(Context cntxt, int i) {
					//	do not care, although I suppose we could capture line-level profiling data
				}

				public void onDebuggerStatement(Context cntxt) {
					//	ignore it
				}
			}

			public void handleCompilationDone(Context cntxt, org.mozilla.javascript.debug.DebuggableScript ds, String string) {
				//	This would give us an opportunity to store the source code if we wanted to use it, but we probably do not want
				//	to use it
				//	System.err.println("handleCompilationDone " + new DebugFrameImpl(ds).toString());
				//	do nothing
			}

			public org.mozilla.javascript.debug.DebugFrame getFrame(Context cntxt, org.mozilla.javascript.debug.DebuggableScript ds) {
				return new DebugFrameImpl(ds, listener);
			}
		}

		void initialize(Configuration contexts) {
			//System.err.println("Initializing profiler with context factory");
			contexts.factory.addListener(new ContextFactory.Listener() {
				public void contextCreated(Context cntxt) {
					//System.err.println("Initializing context with profiler");
					cntxt.setDebugger(debugger, null);
				}

				public void contextReleased(Context cntxt) {
				}
			});
		}

		void setBreakpoint(Source source, int line) {
		}

		void initialize(Scriptable scope, Engine engine, Program program) {
		}

		Log getLog() {
			return Log.NULL;
		}

		public boolean isBreakOnExceptions() {
			return false;
		}

		public void setBreakOnExceptions(boolean breakOnExceptions) {
		}

		public void destroy() {
		}
	}

	public static class RhinoDebugger extends Debugger {
		public static abstract class Ui {
			public abstract void setExitAction(Runnable action);
			public abstract void setVisible(boolean visible);
			public abstract void pack();

			abstract void destroy();

			public static abstract class Factory {
				public abstract Ui create(org.mozilla.javascript.tools.debugger.Dim dim, String title);
			}
		}

		public static abstract class Configuration {
			public static Configuration create(final Ui.Factory uiFactory) {
				return new Configuration() {
					@Override public Ui.Factory getUiFactory() {
						return uiFactory;
					}
				};
			}

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

			private Log log = Log.NULL;

			public Configuration() {
			}

			public abstract Ui.Factory getUiFactory();


			public void setExit(Runnable exit) {
				if (exit == null) {
					exit = new Runnable() {
						public void run() {
						}
					};
				}
				this.exit = exit;
			}

			public void setLog(Log log) {
				if (log == null) {
					log = Log.NULL;
				}
				this.log = log;
			}
		}

		public static RhinoDebugger create(Configuration configuration) {
			RhinoDebugger rv = new RhinoDebugger();
			rv.configuration = configuration;
			return rv;
		}

		private Configuration configuration;
		private boolean breakOnExceptions = false;

		private org.mozilla.javascript.tools.debugger.Dim dim;
		private Ui gui;

		private RhinoDebugger() {
		}

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

		void initialize(Engine.Configuration contexts) {
			this.dim = new org.mozilla.javascript.tools.debugger.Dim();
			contexts.attach(dim);
			String title = "Script Debugger";

			if (configuration.startWithBreak) {
				dim.setBreak();
			}
			breakOnExceptions = configuration.breakOnExceptions;
			if (configuration.breakOnExceptions) {
				dim.setBreakOnExceptions(true);
				breakOnExceptions = true;
			}

			this.gui = configuration.getUiFactory().create(dim, title);
			gui.setExitAction(new ExitAction(this.dim, configuration.exit));
			contexts.attach(dim);
		}

		void setBreakpoint(Source source, int line) {
			org.mozilla.javascript.tools.debugger.Dim.SourceInfo info = getSourceInfo(source.getSourceName());
			if (info != null) {
				info.breakpoint(line, true);
			} else {
				configuration.log.println("Not setting breakpoint at " + line + " in " + source + ": no source info");
			}
		}

		void initialize(Scriptable scope, Engine engine, Program program) {
			dim.setScopeProvider( new ScopeWrapper(scope) );
			gui.pack();
			gui.setVisible(true);
		}

		Log getLog() {
			return configuration.log;
		}

		public boolean isBreakOnExceptions() {
			return breakOnExceptions;
		}

		public void setBreakOnExceptions(boolean breakOnExceptions) {
			this.breakOnExceptions = breakOnExceptions;
			this.dim.setBreakOnExceptions(breakOnExceptions);
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

		public void destroy() {
			if (this.dim == null) {
				throw new NullPointerException("dim is null");
			}
			dim.dispose();
			gui.destroy();
		}
	}

	public static abstract class Configuration {
		public static final Configuration DEFAULT = new Configuration() {
			@Override public ClassLoader getApplicationClassLoader() {
				return null;
			}

			@Override public File getLocalClassCache() {
				return null;
			}

			@Override public boolean canCreateClassLoaders() {
				return true;
			}

			@Override public boolean canAccessEnvironment() {
				return true;
			}

			@Override public int getOptimizationLevel() {
				return -1;
			}
		};

		@Override public String toString() {
			return getClass().getName() + " factory=" + factory;
		}

		public abstract boolean canCreateClassLoaders();
		public abstract boolean canAccessEnvironment();

		/**
		 * Creates the single <code>ClassLoader</code> to be used for this {@link Engine}. Currently all {@link Context}s created
		 * by an <code>Engine</code> share the same <code>ClassLoader</code>.
		 *
		 * @return A <code>ClassLoader</code>, or <code>null</code> to use the ClassLoader that loaded Rhino.
		 */
		public abstract ClassLoader getApplicationClassLoader();

		public abstract File getLocalClassCache();
		public abstract int getOptimizationLevel();

		private ContextFactoryInner factory = new ContextFactoryInner();

		final synchronized Context getContext() {
			return Context.getCurrentContext();
		}

		final Loader.Classes.Interface getClasspath() {
			return factory.getClasspath();
		}

		void attach(org.mozilla.javascript.tools.debugger.Dim dim) {
			dim.attachTo(factory);
		}

		Object call(ContextAction action) {
			@SuppressWarnings("unchecked")
			Object rv = factory.call(action);
			return rv;
		}

		private class ContextFactoryInner extends ContextFactory {
			private Loader.Classes classes;

			ContextFactoryInner() {
			}

			private boolean initialized = false;

			private synchronized void initializeClassLoaders() {
				if (!initialized) {
					this.classes = Loader.Classes.create(new Loader.Classes.Configuration() {
						@Override public boolean canCreateClassLoaders() {
							return Configuration.this.canCreateClassLoaders();
						}

						@Override public ClassLoader getApplicationClassLoader() {
							return (Configuration.this.getApplicationClassLoader() == null) ? ContextFactory.class.getClassLoader() : Configuration.this.getApplicationClassLoader();
						}

						@Override public File getLocalClassCache() {
							return Configuration.this.getLocalClassCache();
						}
					});
					initialized = true;
				}
			}

			private synchronized ClassLoader getContextApplicationClassLoader() {
				initializeClassLoaders();
				return this.classes.getApplicationClassLoader();
			}

			final Loader.Classes.Interface getClasspath() {
				initializeClassLoaders();
				return this.classes.getInterface();
			}

			@Override protected synchronized Context makeContext() {
				Context rv = super.makeContext();
				rv.setApplicationClassLoader(getContextApplicationClassLoader());
				rv.setErrorReporter(new Engine.Errors().getErrorReporter());
				rv.setOptimizationLevel(getOptimizationLevel());
				return rv;
			}

			@Override protected boolean hasFeature(Context context, int feature) {
				if (feature == Context.FEATURE_STRICT_VARS) {
					return true;
				} else if (feature == Context.FEATURE_STRICT_EVAL) {
					return true;
				}
				return super.hasFeature(context, feature);
			}
		}

		public String getImplementationVersion() {
			Context context = getContext();
			if (context == null) {
				Context.enter();
				String rv = getContext().getImplementationVersion();
				Context.exit();
				return rv;
			} else {
				return context.getImplementationVersion();
			}
		}

		public org.mozilla.javascript.xml.XMLLib.Factory getRhinoE4xImplementationFactory() {
			Context context = getContext();
			if (context == null) {
				Context.enter();
				org.mozilla.javascript.xml.XMLLib.Factory rv = getContext().getE4xImplementationFactory();
				Context.exit();
				return rv;
			} else {
				return context.getE4xImplementationFactory();
			}
		}
	}

	public static Engine create(Debugger debugger, Configuration contexts) {
		Engine rv = new Engine();
		if (debugger == null) {
			debugger = new NoDebugger();
		}
		rv.debugger = debugger;
		rv.configuration = contexts;
		debugger.initialize(contexts);
		return rv;
	}

	private Debugger debugger;
	private Configuration configuration;

	private Engine() {
	}

	private Scriptable getGlobalScope(Context context) {
		return context.initStandardObjects();
	}

	void script(String name, InputStream code, Scriptable scope, Scriptable target) throws IOException {
		Source source = Source.create(name,new InputStreamReader(code));
		source.evaluate(debugger, configuration, scope, target);
	}

	void script(String name, Reader code, Scriptable scope, Scriptable target) throws IOException {
		Source source = Source.create(name, code);
		source.evaluate(debugger, configuration, scope, target);
	}

	//	TODO	it would be nice if this returned the evaluation value of the script, but according to interactive testing,
	//			it does not; it always returns null, because source.evaluate always returns undefined, even for an expression.
	public Scriptable script(String name, String code, Scriptable scope, Scriptable target) throws IOException {
		Source source = Source.create(name,code);
		Object rv = source.evaluate(debugger, configuration, scope, target);
		if (rv instanceof Scriptable) return (Scriptable)rv;
		return null;
	}

	public boolean canAccessEnvironment() {
		return configuration.canAccessEnvironment();
	}

	public static class Errors extends RuntimeException {
		public static Errors get(Context context) {
			if (context == null) throw new RuntimeException("'context' must not be null.");
			if (context.getErrorReporter() instanceof Errors.ErrorReporterImpl) {
				return ((Errors.ErrorReporterImpl)context.getErrorReporter()).getErrors();
			} else {
				return null;
			}
		}

		private ArrayList<ScriptError> errors = new ArrayList<ScriptError>();
		private ErrorReporterImpl reporter = new ErrorReporterImpl();

		List<ScriptError> errors() {
			return errors;
		}

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
				emitErrorMessage(err, prefix, errors.get(i));
			}
		}

		public void reset() {
			this.errors = new ArrayList<ScriptError>();
		}

		public ScriptError[] getErrors() {
			return this.errors.toArray(new ScriptError[0]);
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

			public Throwable getThrowable() {
				return t;
			}
		}
	}

	public Object execute(Program program) {
		Program.Outcome outcome = (Program.Outcome)configuration.call(new ProgramAction(this, program, debugger));
		return outcome.getResult();
	}

	// public Object evaluate(Program program, String name, Class<?> type) {
	// 	Program.Outcome outcome = (Program.Outcome)configuration.call(new ProgramAction(this, program, debugger));
	// 	return outcome.castScopeTo(name, type);
	// }

	// public Object evaluate(Program program, Class<?> type) {
	// 	Program.Outcome outcome = (Program.Outcome)configuration.call(new ProgramAction(this, program, debugger));
	// 	return outcome.castScopeTo(null, type);
	// }

	// public Scriptable load(Program program) {
	// 	Program.Outcome outcome = (Program.Outcome)configuration.call(new ProgramAction(this, program, debugger));
	// 	return outcome.getGlobal();
	// }

	// //	Seems to be used by Servlet
	// /**
	//  *	This method can be exposed to scripts to allow a script to include its own script code into its environment, using
	//  *	<code>jsThis</code> as the scope
	//  *	for the new code included in <code>source</code>.
	//  */
	// public void include(Scriptable jsThis, Source source) throws IOException {
	// 	source.evaluate(debugger, configuration, null, jsThis);
	// }

	public static class Program {
		private ArrayList<Variable> variables = new ArrayList<Variable>();
		private ArrayList<Unit> units = new ArrayList<Unit>();

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
			// private Scriptable global;
			private Object result;

			Outcome(/*Scriptable global, */Object result) {
				// this.global = global;
				this.result = result;
			}

			// Scriptable getGlobal() {
			// 	return global;
			// }

			Object getResult() {
				return result;
			}

			// Object castScopeTo(String name, Class<?> type) {
			// 	if (name == null) return Context.jsToJava( global, type );
			// 	return Context.jsToJava( ScriptableObject.getProperty(global, name), type);
			// }
		}

		void setVariablesInGlobalScope(Context context, Scriptable global) {
			for (int i=0; i<variables.size(); i++) {
				Variable v = variables.get(i);
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
			Object result = null;
			for (int i=0; i<units.size(); i++) {
				Errors errors = Errors.get(context);
				if (errors != null) {
					errors.reset();
				}
				try {
					result = units.get(i).execute(dim, context, global);
				} catch (WrappedException e) {
					//	TODO	Note that when this is merged into jsh, we will need to change jsh error reporting to dump the
					//			stack trace from the contained Throwable inside the errors object.
//					throw e;
					if (errors != null) {
						errors.add(e);
						throw errors;
					} else {
						throw e;
					}
				} catch (EvaluatorException e) {
					//	TODO	Oh my goodness, is there no better way to do this?
					if (errors != null && (e.getMessage().indexOf("Compilation produced") == -1 || e.getMessage().indexOf("syntax errors.") == -1)) {
						errors.add(e);
					}
					if (errors != null) {
						throw errors;
					} else {
						throw e;
					}
				} catch (EcmaError e) {
					if (errors != null) {
						errors.add(e);
						throw errors;
					} else {
						throw e;
					}
				} catch (JavaScriptException e) {
					if (errors != null) {
						errors.add(e);
						throw errors;
					} else {
						throw e;
					}
				}
			}
			return new Outcome(result);
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
				Scriptable executionScope = scope.get(context, global, true);
//				Script script = source.compile(dim, context);
//				Object rv = script.exec(context, executionScope);
//				return rv;
				return source.evaluate(dim, context, executionScope, executionScope, true);
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

	public Debugger getDebugger() {
		return this.debugger;
	}

	public Loader.Classes.Interface getClasspath() {
		return this.configuration.getClasspath();
	}
}