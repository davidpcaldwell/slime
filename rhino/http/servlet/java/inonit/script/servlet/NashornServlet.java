package inonit.script.servlet;

import java.io.*;

import javax.script.*;

import inonit.script.engine.*;
import inonit.script.nashorn.*;

public class NashornServlet extends Servlet {
	private static class Nashorn extends ScriptContainer {
		private Servlet servlet;
		private Host host;
		
		@Override void initialize(Servlet servlet) {
			this.servlet = servlet;
			this.host = Host.create(new Classes.Configuration() {
				@Override public boolean canCreateClassLoaders() {
					return true;
				}

				@Override public ClassLoader getApplicationClassLoader() {
					return NashornServlet.class.getClassLoader();
				}				
			});
		}

		@Override Servlet.HostObject getServletHostObject() {
			return new HostObject(servlet);
		}

		@Override void setVariable(String name, Object value) {
			host.set(name, value);
		}

		@Override void addScript(final String name, final InputStream stream) {
			host.add(new Code.Source.File() {
				@Override public String getSourceName() {
					return name;
				}

				@Override public Reader getReader() {
					return new InputStreamReader(stream);
				}
			});
		}

		@Override void execute() {
			try {
				host.run();
			} catch (ScriptException e) {
				throw new RuntimeException(e);
			}
		}
	}
	
	@Override protected ScriptContainer createScriptContainer() {
		return new Nashorn();
	}
	
	private static class HostObject extends Servlet.HostObject {
		HostObject(Servlet servlet) {
			super(servlet);
		}
	}
}
