//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.engine;

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
				public Loader.Classpath getInterface() {
					return loaderClasses.toScriptClasspath();
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
				public Loader.Classpath getInterface() {
					return null;
				}
			};
		}
	}

	public abstract ClassLoader getApplicationClassLoader();
//	public abstract Loader.Classes getScriptClasses();
	public abstract Loader.Classpath getInterface();
}
