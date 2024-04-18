//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.graal;

import org.graalvm.polyglot.HostAccess;

import inonit.script.engine.*;

public class HostFactory extends inonit.script.engine.Host.Factory {
	private Configuration configuration;

	private HostFactory(Configuration configuration) {
		this.configuration = configuration;
	}

	@Override public inonit.script.engine.Host create(ClassLoader classes) {
		Thread.currentThread().setContextClassLoader(classes);
		//	TODO	figure out how to set classpath properly

		final org.graalvm.polyglot.Context.Builder builder = org.graalvm.polyglot.Context.newBuilder("js")
			//	Allow reflective access to the underlying host platform
			.allowAllAccess(true)

			//	Allow experimental options. Although some configurations result in an error message saying that js.nashorn-compat
			//	is an experimental option and this is needed, this particular configuration does not. Perhaps .allowAllAccess()
			//	enables it?
			//.allowExperimentalOptions(true)

			//	Allow nashorn:mozilla_compat.js to be loaded
			.option("js.nashorn-compat", "true")
		;

		if (configuration.inspect() != null) {
			builder.option("inspect", String.valueOf(configuration.inspect().getPort()));
			String path = configuration.inspect().getPath();
			if (path != null) {
				builder.option("inspect.Path", path);
			}
		}

		final org.graalvm.polyglot.Context context = builder.build();

		inonit.script.engine.Host executor = new inonit.script.engine.Host() {
			public void initialize() {}
			public void destroy() {}

			@Override public void bind(Host.Binding binding) {
				context.getBindings("js").putMember(binding.getName(), binding.getValue());
			}

			@Override public Object eval(Host.Script file) throws javax.script.ScriptException {
				try {
					final org.graalvm.polyglot.Source source = org.graalvm.polyglot.Source.newBuilder("js", file.getCode(), file.getName()).uri(file.getURI()).build();
					context.enter();
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

	public static inonit.script.engine.Host.Factory create(Configuration configuration) {
		//	ScriptEngine-based implementation commented-out for now
//		return inonit.script.engine.Host.create(inonit.script.engine.Host.Factory.engine("graal.js"), configuration);
		return new HostFactory(configuration);
	}

	private HostFactory() {
	}
}
