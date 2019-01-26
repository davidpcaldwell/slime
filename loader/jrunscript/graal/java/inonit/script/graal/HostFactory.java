package inonit.script.graal;

import inonit.script.engine.*;

public class HostFactory extends inonit.script.engine.Host.Factory {
	private Configuration configuration;
	
	private HostFactory(Configuration configuration) {
		this.configuration = configuration;
	}
	
	@Override
	public inonit.script.engine.Host.Executor create() {
		//System.err.println("HostFactory.this.create()");
		final org.graalvm.polyglot.Context.Builder builder = org.graalvm.polyglot.Context.newBuilder("js")
			.option("js.nashorn-compat", "true")
			.allowHostAccess(true)
		;
		
		if (configuration.inspect() != null) {
			builder.option("inspect", String.valueOf(configuration.inspect().getPort()));
			String path = configuration.inspect().getPath();
			if (path != null) {
				builder.option("inspect.Path", path);
			}
		}
		
		final org.graalvm.polyglot.Context context = builder.build();

		inonit.script.engine.Host.Executor executor = new inonit.script.engine.Host.Executor() {
			@Override public void set(String name, Object value) {
				context.getBindings("js").putMember(name, value);
			}

			@Override public Object eval(Code.Loader.Resource file) throws javax.script.ScriptException {
				try {
					final org.graalvm.polyglot.Source source = org.graalvm.polyglot.Source.newBuilder("js", file.getReader(), file.getSourceName()).uri(file.getURI().adapt()).build();
					//System.err.println("context = " + context);
					context.enter();
					//System.err.println("current = " + org.graalvm.polyglot.Context.getCurrent());
					Object rv = context.eval(source);
					context.leave();
					return rv;
				} catch (java.io.IOException e) {
					throw new RuntimeException(e);
				}
			}
		};

		return executor;
	}
	
	public static abstract class Configuration {
		public abstract Inspect inspect();
		
		public static abstract class Inspect {
			public static final Inspect SLIME = new Inspect() {
				public int getPort() { return 9229; }
				public String getPath() { return "slime"; }
			};
			
			public abstract int getPort();
			public abstract String getPath();
		}
	}
	
	public static inonit.script.engine.Host create(Configuration configuration, Loader.Classes.Configuration classes) {
		//	ScriptEngine-based implementation commented-out for now
//		return inonit.script.engine.Host.create(inonit.script.engine.Host.Factory.engine("graal.js"), configuration);
		return inonit.script.engine.Host.create(new HostFactory(configuration), classes);
	}
	
	private HostFactory() {
	}
}
