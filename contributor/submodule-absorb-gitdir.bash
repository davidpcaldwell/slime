#!/usr/bin/env bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

set -euo pipefail

usage() {
	>&2 echo "Usage: $0 [submodule-path]"
	>&2 echo "If omitted, runs git submodule absorbgitdirs recursively from the repository containing this script."
	>&2 echo "Example: $0 local/tool/sub/kit/slim/slime"
}

fail() {
	>&2 echo "Error: $*"
	exit 1
}

if [ "$#" -gt 1 ]; then
	usage
	exit 1
fi

if [ "$#" -eq 0 ]; then
	SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
	repository_path="${SCRIPT_DIR}/.."

	[ -d "${repository_path}" ] || fail "Repository path not found: ${repository_path}"
	[ -d "${repository_path}/.git" ] || fail "Expected repository git dir at ${repository_path}/.git"

	echo "Running absorbgitdirs for top-level submodules in: ${repository_path}"
	git -C "${repository_path}" submodule absorbgitdirs

	echo "Running absorbgitdirs recursively in nested submodules"
	git -C "${repository_path}" submodule foreach --recursive 'git submodule absorbgitdirs'

	echo "Finished recursive submodule gitdir absorption in: ${repository_path}"
	exit 0
else
	submodule_path="$1"
fi
submodule_git_path="${submodule_path}/.git"

[ -d "${submodule_path}" ] || fail "Submodule path not found: ${submodule_path}"
[ -d "${submodule_git_path}" ] && {
	>&2 echo "Submodule repository is already absorbed; this script is not necessary."
	exit 0
}
[ -f "${submodule_git_path}" ] || fail "Expected a .git pointer file at ${submodule_git_path}"

git_pointer_line="$(sed -n '1p' -- "${submodule_git_path}")"
git_pointer_line="${git_pointer_line%$'\r'}"
case "${git_pointer_line}" in
	"gitdir: "*)
		gitdir_pointer="${git_pointer_line#gitdir: }"
		;;
	*)
		fail "Unrecognized .git pointer format in ${submodule_git_path}: ${git_pointer_line}"
		;;
esac

if [ -z "${gitdir_pointer}" ]; then
	fail "Empty gitdir pointer in ${submodule_git_path}"
fi

if [ "${gitdir_pointer#/}" != "${gitdir_pointer}" ]; then
	source_git_dir="${gitdir_pointer}"
else
	source_git_dir="${submodule_path}/${gitdir_pointer}"
fi

[ -d "${source_git_dir}" ] || fail "Submodule git dir not found: ${source_git_dir}"
[ -f "${source_git_dir}/config" ] || fail "Submodule git config not found: ${source_git_dir}/config"

gitfile_backup_path="${submodule_git_path}.pre-absorb-backup"
[ ! -e "${gitfile_backup_path}" ] || fail "Backup path already exists: ${gitfile_backup_path}"

mv "${submodule_git_path}" "${gitfile_backup_path}"
if ! mv "${source_git_dir}" "${submodule_git_path}"; then
	if ! mv "${gitfile_backup_path}" "${submodule_git_path}"; then
		fail "Failed to absorb and failed to restore .git pointer from ${gitfile_backup_path}"
	fi
	fail "Failed to move submodule git dir into place: ${source_git_dir} -> ${submodule_git_path}"
fi
rm "${gitfile_backup_path}"

submodule_git_config="${submodule_git_path}/config"
submodule_git_config_cmd=(
	git
	--git-dir="${submodule_git_path}"
	--work-tree="${submodule_path}"
	config
	--file "${submodule_git_config}"
)

if "${submodule_git_config_cmd[@]}" --get core.worktree >/dev/null 2>&1; then
	if ! "${submodule_git_config_cmd[@]}" --unset core.worktree; then
		fail "Failed to unset core.worktree in ${submodule_git_config}"
	fi
else
	>&2 echo "core.worktree is already unset in ${submodule_git_config}; no update needed."
fi

if ! git -C "${submodule_path}" rev-parse --git-dir >/dev/null 2>&1; then
	fail "Submodule repository is not usable after migration: ${submodule_path}"
fi

echo "Absorbed git dir into submodule: ${submodule_path}"
echo "Updated config: removed core.worktree from ${submodule_git_config}"
