//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.rhino;

import java.util.*;

import org.mozilla.javascript.*;

public abstract class Debugger {
	abstract void initialize(Engine.Configuration contexts);
	abstract void initialize(Scriptable global);
	abstract void setBreakpoint(Source source, int line);
	abstract Engine.Log getLog();

	final void log(String message) {
		getLog().println(message);
	}

	public abstract boolean isBreakOnExceptions();
	public abstract void setBreakOnExceptions(boolean breakOnExceptions);
	public abstract void destroy();

	static class NoDebugger extends Debugger {
		void initialize(Engine.Configuration contexts) {
		}

		void setBreakpoint(Source source, int line) {
		}

		void initialize(Scriptable global) {
		}

		Engine.Log getLog() {
			return Engine.Log.NULL;
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

		void initialize(Engine.Configuration contexts) {
			//System.err.println("Initializing profiler with context factory");
			contexts.factory().addListener(new ContextFactory.Listener() {
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

		void initialize(Scriptable global) {
		}

		Engine.Log getLog() {
			return Engine.Log.NULL;
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

			private Engine.Log log = Engine.Log.NULL;

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

			public void setLog(Engine.Log log) {
				if (log == null) {
					log = Engine.Log.NULL;
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
			}

			this.gui = configuration.getUiFactory().create(dim, title);
			gui.setExitAction(new ExitAction(this.dim, configuration.exit));
			//	TODO	do we need to attach again? We did that above.
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

		@Override
		void initialize(Scriptable global) {
			dim.setScopeProvider( new ScopeWrapper(global) );
			gui.pack();
			gui.setVisible(true);
		}

		Engine.Log getLog() {
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
}
