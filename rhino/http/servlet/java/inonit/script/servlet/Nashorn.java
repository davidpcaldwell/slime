package inonit.script.servlet;

import java.io.*;

import javax.script.*;

import inonit.script.engine.*;
import inonit.script.nashorn.*;

class Nashorn extends Servlet.ScriptContainer {
	private Servlet servlet;
	private Host host;

	@Override void initialize(Servlet servlet) {
		this.servlet = servlet;
		this.host = Host.create(new Classes.Configuration() {
			@Override public boolean canCreateClassLoaders() {
				return true;
			}

			@Override public ClassLoader getApplicationClassLoader() {
				return Nashorn.class.getClassLoader();
			}				
		});
	}

	@Override Servlet.HostObject getServletHostObject() {
		return new HostObject(servlet,host);
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
	
	//	TODO	could be removed and superclass could be made concrete
	public static class HostObject extends Servlet.HostObject {
		private Host host;
		
		HostObject(Servlet servlet, Host host) {
			super(servlet);
			this.host = host;
		}
		
		public Loader.Classpath getClasspath() {
			return host.getClasspath();
		}
	}
}
