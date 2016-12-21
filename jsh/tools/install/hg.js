//	See https://www.mercurial-scm.org/downloads
var distributions = {
	osx: [
		{
			version: "10.5",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-2.0.2-py2.5-macosx10.5.zip"
			}
		},
		{
			version: "10.6",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-3.2.4-py2.6-macosx10.6.zip"
			}
		},
		{
			version: "10.7",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-3.2.1-py2.7-macosx10.7.zip"
			}
		},
		{
			version: "10.8",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-3.3.3-py2.7-macosx10.8.zip"
			}
		},
		{
			version: "10.9",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-3.4.2-py2.7-macosx10.9.zip"
			}
		},
		{
			version: "10.10",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-3.9.1-macosx10.10.pkg"
			}
		},
		{
			version: "10.11",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-4.0.1-macosx10.11.pkg"
			}
		}
	].map(function(o) {
		o.minor = Number(o.version.split(".")[1])
		return o;
	})
};

$exports.distribution = {
	osx: function(o) {
		var getDistribution = function(minorVersion) {
			if (minorVersion < distributions.osx[0].minor) {
				throw new VersionError("This OS X distribution is too old; upgrade to at least " + distributions.osx[0].version);
			}
			if (minorVersion > distributions.osx[distributions.osx.length-1].minor) {
				throw new VersionError("Version too high.");
			}
			for (var i=0; i<distributions.osx.length; i++) {
				if (minorVersion == distributions.osx[i].minor) {
					return distributions.osx[i];
				}
			}
		}

		var tokenized = o.os.split(".");
		if (Number(tokenized[0]) != 10) throw new VersionError("Unsupported.");
		var minorVersion = Number(tokenized[1]);
		return getDistribution(minorVersion);
	}
}