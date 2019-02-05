package inonit.script.jsh;

import javax.script.*;

import org.graalvm.polyglot.*;

// import com.oracle.truffle.api.object.*;
// import com.oracle.truffle.js.runtime.*;
// import com.oracle.truffle.js.runtime.builtins.*;
// import com.oracle.truffle.js.runtime.objects.*;
// import com.oracle.truffle.js.nodes.*;

import inonit.script.engine.*;

public class Graal extends Main.Engine {
	public static abstract class Host {
		public final void putMember(String name, Object value) {
			org.graalvm.polyglot.Context.getCurrent().getBindings("js").putMember(name, value);
		}

		public final Object getMember(String name) {
			return org.graalvm.polyglot.Context.getCurrent().getBindings("js").getMember(name);
		}

		//	Doesn't work; can't pass things across contexts
		// public final Object run(String name, String code, java.util.Map scope, Object target) throws java.io.IOException {
		// 	Context context = Context.newBuilder().option("js.nashorn-compat", "true").allowHostAccess(true).build();
		// 	context.enter();
		// 	java.util.Set keys = ((java.util.Map)scope).keySet();
		// 	for(Object key : keys) {
		// 		String n = (String)key;
		// 		context.getBindings("js").putMember(n, scope.get(n));
		// 	}
		// 	context.getBindings("js").putMember("$$this", target);
		// 	String interpret = "(function() { " + code + ").call($$this)";
		// 	Source source = Source.newBuilder("js", interpret, name).build();
		// 	Object rv = context.eval(source);
		// 	return rv;
		// }

		//		private static class SlimeLoad extends JSLoadOperation {}

		// private void printClasses(Object object) {
		// 	Class current = object.getClass();
		// 	while(current != null) {
		// 		System.err.println(current);
		// 		current = current.getSuperclass();
		// 	}
		// }

		// 		private JSContext getContext(DynamicObject thisObj) {
		// 			return JSObject.getJSContext(thisObj);
		// //			return Context.getCurrent();
		// 		}
		//
		// 		// private JSRealm createRealm(DynamicObject thisObj) {
		//         //     return getContext(thisObj).getRealm().createChildRealm();
		//         // }
		//
		// 		private ScriptNode loadStringImpl(JSContext ctxt, String name, String script) {
		// 			return ((NodeEvaluator) ctxt.getEvaluator()).evalCompile(ctxt, script, name);
		// 		}
		//
		// 		public final Object run(String name, String script, Object scope, DynamicObject target) {
		// 			Object[] args = new Object[0];
		// 			JSContext context = getContext(target);
		// 			JSRealm childRealm = context.getRealm();
		//             ScriptNode scriptNode = loadStringImpl(childRealm.getContext(), name, script);
		//             DynamicObject globalObject = childRealm.getGlobalObject();
		//             if (args.length > 0) {
		//                 DynamicObject argObj = JSArgumentsObject.createStrict(context, childRealm, args);
		//                 JSRuntime.createDataProperty(globalObject, JSFunction.ARGUMENTS, argObj);
		//             }
		//             return scriptNode.run(JSArguments.create(globalObject, JSFunction.create(childRealm, scriptNode.getFunctionData()), args));
		// 		}
		//
		// 		public final Object run(Code.Loader.Resource script) {
		// 			throw new UnsupportedOperationException();
		// 		}

		//	Couldn't get this to work; couldn't get to original JSContext object to figure out what to do next
		// public final Object run(String name, String script, Object scope, Object target) {
		// 	System.err.println(Context.getCurrent());
		// 	printClasses(Context.getCurrent());
		// 	System.err.println("name=" + name + "\nscope=" + scope + "\ntarget=" + target);
		// 	if (target != null) {
		// 		printClasses(target);
		// 	}
		// 	if (target != null) System.err.println("target.getClass() " + target.getClass());
		// 	System.err.println("target is DynamicObject: " + new Boolean(target instanceof DynamicObject));
		// 	System.err.println();
		// 	return null;
		// }
	}

	private static class ExecutionImpl extends Shell.Execution {
		private inonit.script.engine.Host host;
		private boolean top;

		ExecutionImpl(final Shell shell, boolean top) {
			super(shell);
			this.host = inonit.script.graal.HostFactory.create(
				new inonit.script.graal.HostFactory.Configuration() {
					public inonit.script.graal.HostFactory.Configuration.Inspect inspect() {
						String setting = System.getProperty("jsh.debug.script");
						if (setting != null && setting.equals("graal")) {
							return inonit.script.graal.HostFactory.Configuration.Inspect.SLIME;
						} else {
							return null;
						}
					}
				},
				new Loader.Classes.Configuration() {
					@Override public boolean canCreateClassLoaders() {
						return true;
					}

					@Override public ClassLoader getApplicationClassLoader() {
						return Nashorn.class.getClassLoader();
					}

					@Override public java.io.File getLocalClassCache() {
						return shell.getEnvironment().getClassCache();
					}
				}
			);
			this.top = top;
		}

		//	TODO	completely copy-pasted from Nashorn.java
		private static class ExitException extends RuntimeException {
			private int status;

			ExitException(int status) {
				super("Exit with status: " + status);
				this.status = status;
			}

			int getExitStatus() {
				return status;
			}
		}

		@Override protected Loader.Classes.Interface getClasspath() {
			return host.getClasspath();
		}

		@Override public void setGlobalProperty(String name, Object value) {
			host.set(name, value);
		}

		@Override public void script(Code.Loader.Resource script) {
			host.add(script);
		}

		//	TODO	completely copy-pasted from Nashorn.java
		private ExitException getExitException(Exception e) {
			Throwable t = e;
			while(t != null) {
				if (t instanceof ExitException) {
					return (ExitException)t;
				}
				t = t.getCause();
			}
			return null;
		}

		@Override public Integer run() {
			try {
				Object ignore = host.run();
				return null;
			} catch (RuntimeException e) {
				ExitException exit = getExitException(e);
				if (exit != null) {
					return exit.getExitStatus();
				}
				throw e;
			} catch (ScriptException e) {
				ExitException exit = getExitException(e);
				if (exit != null) {
					return exit.getExitStatus();
				}
				throw new Nashorn.UncaughtException(e);
			}
		}

		@Override public void setJshHostProperty() {
			setGlobalProperty("$nashorn", new Nashorn.Host() {
				@Override public Loader.Classes.Interface getClasspath() {
					return host.getClasspath();
				}

				@Override public boolean isTop() {
					return top;
				}

				@Override public void exit(int status) {
					throw new ExitException(status);
				}
			});
			setGlobalProperty("$graal", new Host() {
			});
			try {
				host.add(this.getJshLoader().getFile("nashorn.js"));
			} catch (java.io.IOException e) {
				throw new RuntimeException(e);
			}
		}
	}

	public void main(Shell.Container context, Shell shell) throws Shell.Invocation.CheckedException {
		Shell.Execution execution = new ExecutionImpl(shell, true);
		Integer rv = execution.execute();
		if (rv == null) {
		} else if (rv.intValue() == 0) {
		} else {
			context.exit(rv.intValue());
		}
	}

	public static void main(String[] args) throws Shell.Invocation.CheckedException {
		Main.cli(new Graal(), args);
	}
}