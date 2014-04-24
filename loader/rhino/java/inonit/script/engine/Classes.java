package inonit.script.engine;

import inonit.script.rhino.Loader;

public abstract class Classes {
	public static abstract class Configuration {
		public abstract boolean canCreateClassLoaders();
		public abstract ClassLoader getApplicationClassLoader();
	}

	public static Classes create(Configuration configuration) {
		if (configuration.canCreateClassLoaders()) {
			final Loader.Classes loaderClasses = Loader.Classes.create(configuration.getApplicationClassLoader());
			return new Classes() {
				@Override
				public ClassLoader getApplicationClassLoader() {
					return loaderClasses;
				}

				@Override
				public Loader.Classes getScriptClasses() {
					return loaderClasses;
				}
			};
		} else {
			final ClassLoader loader = configuration.getApplicationClassLoader();
			return new Classes() {
				@Override
				public ClassLoader getApplicationClassLoader() {
					return loader;
				}

				@Override
				public Loader.Classes getScriptClasses() {
					return null;
				}
			};
		}
	}

	public abstract ClassLoader getApplicationClassLoader();
	public abstract Loader.Classes getScriptClasses();
}
