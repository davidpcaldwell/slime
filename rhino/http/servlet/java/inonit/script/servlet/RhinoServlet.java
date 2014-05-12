package inonit.script.servlet;

import java.io.*;

import inonit.script.rhino.*;

public class RhinoServlet extends Servlet {
	static {
		Class[] dependencies = new Class[] {
			//	Pull these in as dependencies, since the Rhino loader depends on them
			inonit.script.rhino.Objects.class
			,inonit.script.rhino.MetaObject.class
			//	Pull these in as dependencies, since servlets load the rhino/host module, which includes these classes
			//	Currently, webapp.jsh.js is unaware of modules and just copies them into the WEB-INF/slime directory, expecting
			//	them to be loaded by its bootstrap loader
			,inonit.script.runtime.Properties.class
		};
	}
	
	static class Container {
		private Servlet servlet;
		private Engine engine;
		private Engine.Program program;
		
		Container() {
		}
		
		void initialize(Servlet servlet) {
			Engine.Debugger debugger = null;
			if (System.getenv("SLIME_SCRIPT_DEBUGGER") != null && System.getenv("SLIME_SCRIPT_DEBUGGER").equals("rhino")) {
				Engine.RhinoDebugger.Configuration configuration = new Engine.RhinoDebugger.Configuration() {
					@Override public Engine.RhinoDebugger.Ui.Factory getUiFactory() {
						return inonit.script.rhino.Gui.RHINO_UI_FACTORY;
					}
				};
				configuration.setExit(new Runnable() {
					public void run() {
					}
				});
				configuration.setLog(new Engine.Log() {
					@Override public void println(String message) {
						System.err.println(message);
					}
				});
				debugger = Engine.RhinoDebugger.create(configuration);
			}
			Engine engine = Engine.create(debugger, new Engine.Configuration() {
				@Override public boolean createClassLoader() {
					return true;
				}

				@Override
				public ClassLoader getApplicationClassLoader() {
					return Servlet.class.getClassLoader();
				}

				@Override
				public int getOptimizationLevel() {
					return -1;
				}
			});

			this.servlet = servlet;
			this.engine = engine;
			this.program = new Engine.Program();
		}
		
		Servlet.Host getHost() {
			return new Host(servlet, engine);
		}
		
		void setVariable(String name, Object value) {
			try {
				Engine.Program.Variable jsh = Engine.Program.Variable.create(
					name,
					Engine.Program.Variable.Value.create(value)
				);
				jsh.setReadonly(true);
				jsh.setPermanent(true);
				jsh.setDontenum(true);
				program.set(jsh);
			} catch (Engine.Errors errors) {
				errors.dump(
					new Engine.Log() {
						@Override
						public void println(String message) {
							System.err.println(message);
						}
					},
					"[slime] "
				);
				throw errors;
			}			
		}
		
		void addScript(String name, InputStream stream) {
			program.add(Engine.Source.create(name, stream));
		}
		
		void execute() {
			try {
				System.err.println("Executing JavaScript program ...");
				engine.execute(program);
				System.err.println("Executed program: script = " + servlet.script());
			} catch (Engine.Errors errors) {
				System.err.println("Caught errors.");
				errors.dump(
					new Engine.Log() {
						@Override
						public void println(String message) {
							System.err.println(message);
						}
					},
					"[slime] "
				);
				throw errors;
			}
		}
	}
	
	@Override public final void init() {
		Container container = new Container();
		container.initialize(this);
		container.setVariable("$host", container.getHost());
		container.addScript("<api.js>", getServletContext().getResourceAsStream("/WEB-INF/api.js"));
		container.execute();
	}
	
	public static class Host extends Servlet.Host {
		private Engine engine;
		
		Host(Servlet servlet, Engine engine) {
			super(servlet);
			this.engine = engine;
		}
		
		public Engine getEngine() {
			return engine;
		}
	}
}
