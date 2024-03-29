//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.servlet;

import java.io.*;

import inonit.script.engine.*;
import inonit.script.rhino.*;

public class Rhino extends Servlet.ScriptContainer {
	static {
		Class<?>[] dependencies = new Class[] {
			//	Pull these in as dependencies, since the Rhino loader depends on them
			inonit.script.rhino.Objects.class
			,inonit.script.rhino.MetaObject.class
			//	Pull these in as dependencies, since servlets load the jrunscript/host module, which includes these classes
			//	Currently, webapp.jsh.js is unaware of modules and just copies them into the WEB-INF/slime directory, expecting
			//	them to be loaded by its bootstrap loader
			,inonit.script.runtime.Properties.class
		};
	}

	private Servlet servlet;
	private Engine engine;
	private inonit.script.engine.Host.Program program;

	Rhino() {
	}

	void initialize(Servlet servlet) {
		Debugger debugger = null;
		if (System.getenv("SLIME_SCRIPT_DEBUGGER") != null && System.getenv("SLIME_SCRIPT_DEBUGGER").equals("rhino")) {
			Debugger.RhinoDebugger.Configuration configuration = new Debugger.RhinoDebugger.Configuration() {
				@Override public Debugger.RhinoDebugger.Ui.Factory getUiFactory() {
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
			debugger = Debugger.RhinoDebugger.create(configuration);
		}
		Engine engine = Engine.create(
			debugger,
 			new Engine.Configuration() {
				@Override public Loader.Classes.Configuration getClassesConfiguration() {
					return new Loader.Classes.Configuration() {
						@Override public boolean canCreateClassLoaders() {
							return true;
						}

						@Override public ClassLoader getApplicationClassLoader() {
							return Servlet.class.getClassLoader();
						}

						@Override public File getLocalClassCache() {
							return null;
						}
					};
				}

				@Override public boolean canAccessEnvironment() {
					return true;
				}

				@Override public int getOptimizationLevel() {
					return -1;
				}
			}
		);

		this.servlet = servlet;
		this.engine = engine;
		this.program = new inonit.script.engine.Host.Program();
	}

	Servlet.HostObject getServletHostObject() {
		return new Host(servlet, engine);
	}

	void setVariable(String name, Object value) {
		try {
			inonit.script.engine.Host.Binding jsh = inonit.script.engine.Host.Binding.create(
				name,
				value
			);
			program.bind(jsh);
		} catch (Errors errors) {
			errors.dump(
				new Engine.Log() {
					@Override public void println(String message) {
						System.err.println(message);
					}
				},
				"[slime] "
			);
			throw errors;
		}
	}

	void addScript(Code.Loader.Resource resource) {
		try {
			program.run(inonit.script.engine.Host.Script.create(resource));
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	void execute() {
		try {
			System.err.println("Executing JavaScript program ...");
			engine.execute(program);
			System.err.println("Executed program: script = " + servlet.script());
		} catch (Errors errors) {
			System.err.println("Caught errors.");
			errors.dump(
				new Engine.Log() {
					@Override public void println(String message) {
						System.err.println(message);
					}
				},
				"[slime] "
			);
			throw errors;
		}
	}

	public static class Host extends Servlet.HostObject {
		private Engine engine;

		Host(Servlet servlet, Engine engine) {
			super(servlet);
			this.engine = engine;
		}

		Loader.Classes.Interface getClasspath() {
			return engine.getClasses().getInterface();
		}

		public Engine getEngine() {
			return engine;
		}
	}
}
