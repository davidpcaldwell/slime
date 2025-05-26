/*
LICENSE
This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

END LICENSE
*/
/*
	Locating jsh

	On UNIX, there is no foolproof, platform-independent way to retrieve the executable path. argv[0], on FreeBSD, just contains the
	command name if the command was in the path.

	See http://stackoverflow.com/questions/933850/how-to-find-the-location-of-the-executable-in-c.

	We implement a reasonable heuristic below for Linux.

	On Windows, there is apparently a system call GetModuleFileName that can be used for the purpose of resolving argv[0].
*/
/*
	Locating Java on Cygwin

	On Windows, implementation-wise, we might have difficulty under Cygwin, where the JSH_JAVA_HOME variable is in Cygwin form.
	And there might be problems making the launcher a Cygwin executable (Cygwin might need to be in the PATH, and it might mess up
	the JNI, though it might not; that might be just calls running in the other direction).

	On Windows, we could perhaps dynamically load Cygwin at runtime, or link to it at build time, to give us access to cygpath for
	resolving the JSH_JAVA_HOME or JAVA_HOME environment variables.
*/

#include <stdio.h>
#include <string.h>
#include <errno.h>

//	Forward reference so that platform-specific code can use debugging
void debug(char* mask, ...);

//	Windows-specific
#ifdef WIN32
const char SLASH = '\\';
const char COLON = ';';
#include "shlwapi.h"
const int PATH_MAX = MAX_PATH;

char* dirname(char *path) {
	PathRemoveFileSpec(path);
	return path;
}

char* realpath(char *path, char *other) {
	strcpy(other,path);
	return other;
}

int programAbsolutePath(char *path, char *absolute, int size) {
	/*	On Windows, at least using gcc/mingw, we don't need an absolute path to find jsh; we seem to receive absolute path.	*/
	strcpy(absolute,path);
	return 0;
}

//	TODO	JSH_PATHNAME_BUFFER_SIZE not defined for Windows
#endif

//	Unix-specific
#if defined __unix__ || defined __APPLE__
#include <stdlib.h>
#include <stdarg.h>
#include <unistd.h>

const char SLASH = '/';
const char COLON = ':';

void strip_trailing_slash(char *path) {
	if (path[strlen(path)-1] == SLASH) {
		path[strlen(path)-1] = '\0';
	}
}

int jrunscriptLaunch(char *JAVA_HOME, int argc, char **argv) {
	debug("JAVA_HOME = %s\n", JAVA_HOME);
	char **args = malloc( (sizeof(char*) * (argc+2) ) );
	int i;
	for (i=0; i<argc; i++) {
		args[i+1] = argv[i];
	}
	args[argc+1] = NULL;
	if (JAVA_HOME != NULL) {
		strip_trailing_slash(JAVA_HOME);
		/*	Rather than doing this manipulation, would it be better to use execvp with JAVA_HOME/bin as PATH? */
		int length = strlen(JAVA_HOME) + strlen("/bin/jrunscript");
		char* path = malloc( sizeof(char) * length );
		sprintf(path,"%s/bin/jrunscript",JAVA_HOME);
		debug("jrunscript path: %s\n", path);
		args[0] = path;
	} else {
		args[0] = "jrunscript";
	}
	for (i=0; i<argc+2; i++) {
		debug("argument %d is %s\n", i, args[i]);
	}
	if (JAVA_HOME != NULL) {
		execv(args[0],args);
	} else {
		execvp(args[0],args);
	}
	debug("exec returned; errno = %s", strerror(errno));
	return -1;
}

//	Mac OS X-specific
#if defined __APPLE__
#include <libproc.h>
#include <libgen.h>

#define JSH_PATHNAME_BUFFER_SIZE PROC_PIDPATHINFO_MAXSIZE*sizeof(char)
int programAbsolutePath(char *argsv0, char *rv, int size) {
	int status = proc_pidpath(getpid(), rv, size);
	debug("rv = %s\n", rv);
	debug("status = %d\n", status);
	return (status < 0) ? status : 0;
}

#endif

//	UNIX-specific
#if defined __unix__ || defined __linux__
#include <limits.h>
#include <libgen.h>

#define JSH_PATHNAME_BUFFER_SIZE PATH_MAX*sizeof(char)

int programAbsolutePath(char *argsv0, char *rv, int size) {
	int status;
	status = readlink("/proc/self/exe", rv, size);
	if (status > 0) {
		return 0;
	}
	/*	Below code untested in current build process but was tested in earlier versions.	*/
	if (argsv0[0] == '/') {
		strcpy(rv,argsv0);
		return 0;
	}
	/*	Could insert better algorithm that attempts to resolve relative paths. Skeletal code below.	*/
	if (0 && index(argsv0[0], '/') != NULL) {
		char *getcwdbuffer = malloc(JSH_PATHNAME_BUFFER_SIZE);
		strcpy(rv,getcwd(getcwdbuffer,JSH_PATHNAME_BUFFER_SIZE));
		strcat(rv,argsv0);
		return 0;
	}
	/*	Could insert better algorithm that attempts to search PATH. */
	return 1;
}
#endif

//	end if unix || apple
#endif

void debug(char* mask, ...) {
	va_list args;
	va_start(args, mask);
	if (getenv("JSH_LAUNCHER_DEBUG") != NULL || getenv("JSH_LAUNCHER_CONSOLE_DEBUG") != NULL) {
		vprintf(mask, args);
	}
	va_end(args);
}

char* path_append(char* PATH, char* element) {
	char* rv = malloc( (strlen(PATH) + 1 + strlen(element) + 1) * sizeof(char) );
	strcpy(rv, PATH);
	char colon[2];
	colon[0] = COLON;
	strcat(rv, colon);
	strcat(rv, element);
	return rv;
}

char* get_shell_path(char* jsh_home, char* relative) {
	char* rv = malloc( (strlen(jsh_home) + 1 + strlen(relative) + 1) * sizeof(char) );
	strcpy(rv, jsh_home);
	char slash[2];
	slash[0] = SLASH;
	strcat(rv, slash);
	strcat(rv, relative);
	return rv;
}

int main(int argc, char **argv) {
	debug("JSH_JAVA_HOME = %s\n", getenv("JSH_JAVA_HOME"));

	/*	Get the parent directory of this launcher. */
	debug("argc = %d\n", argc);
	debug("argv[0] = %s\n", argv[0]);
	debug("argv[1] = %s\n", argv[1]);
	debug("argv[2] = %s\n", argv[2]);
	char *absolutejshpath = malloc(JSH_PATHNAME_BUFFER_SIZE);
	if (programAbsolutePath(argv[0],absolutejshpath,JSH_PATHNAME_BUFFER_SIZE)) {
		fprintf(stderr, "Could not locate jsh installation directory.\n");
		fprintf(stderr, "Try invoking the jsh launcher using its absolute path; was invoked as\n%s.\n", argv[0]);
		exit(1);
	}
	debug("absolutejshpath = %s\n", absolutejshpath);
	char *realjshpath = malloc(JSH_PATHNAME_BUFFER_SIZE);
	realpath(absolutejshpath,realjshpath);
	debug("realjshpath = %s\n", realjshpath);
	char *jsh_home = malloc(JSH_PATHNAME_BUFFER_SIZE);
	jsh_home = dirname(realjshpath);
	debug("jsh_home = %s\n", jsh_home);

	/*	Append jsh.js to the path of the parent directory of this launcher. */
	char* js = malloc(JSH_PATHNAME_BUFFER_SIZE);
	char path[8];
	sprintf(path, "/jsh.js");
	path[0] = SLASH;
	sprintf(js, "%s%s", jsh_home, path);

	char** jrunscriptArguments = malloc(sizeof(char*) * (argc+3));
	jrunscriptArguments[0] = js;
	int count = 1;

	// char* nashorn_jar = malloc(JSH_PATHNAME_BUFFER_SIZE);
	// char relative[17];
	// sprintf(relative, "/lib/nashorn.jar");
	// relative[0] = SLASH;
	// relative[4] = SLASH;
	// sprintf(nashorn_jar, "%s%s", jsh_home, relative);
	char* nashorn_jar = get_shell_path(jsh_home, "lib/nashorn.jar");
	debug("nashorn.jar = %s\n", nashorn_jar);

	if (!access(nashorn_jar, F_OK)) {
		debug("nashorn.jar found; should add to classpath\n");
		//	@notdry nashorn-dependencies
		char* PATH = get_shell_path(jsh_home, "lib/asm.jar");
		debug("PATH = %s\n", PATH);
		PATH = path_append(PATH, get_shell_path(jsh_home, "lib/asm-commons.jar"));
		debug("PATH = %s\n", PATH);
		PATH = path_append(PATH, get_shell_path(jsh_home, "lib/asm-tree.jar"));
		debug("PATH = %s\n", PATH);
		PATH = path_append(PATH, get_shell_path(jsh_home, "lib/asm-util.jar"));
		debug("PATH = %s\n", PATH);
		PATH = path_append(PATH, get_shell_path(jsh_home, "lib/nashorn.jar"));
		debug("PATH = %s\n", PATH);
		jrunscriptArguments[1] = "-classpath";
		jrunscriptArguments[2] = PATH;
		count = 3;
	}

	int i;
	for (i=0; (i+1)<argc; i++) {
		jrunscriptArguments[count+i] = argv[i+1];
		debug("jrunscriptArguments[%d] = %s\n", count+i, jrunscriptArguments[count+i]);
	}
	debug("nulling %d\n", count+argc-1);
	jrunscriptArguments[count+argc-1] = NULL;

	debug("js = %s\n", js);
	char *JAVA_HOME = NULL;
	if (getenv("JSH_JAVA_HOME") != NULL) {
		JAVA_HOME = getenv("JSH_JAVA_HOME");
	}
	if (JAVA_HOME == NULL && getenv("JAVA_HOME") != NULL) {
		JAVA_HOME = getenv("JAVA_HOME");
	}
	exit(jrunscriptLaunch(JAVA_HOME,count+argc-1,jrunscriptArguments));
	/*
	JNIEnv* env = create_vm(jar);
	invoke_class(env, argc, argv);
	 */
}
