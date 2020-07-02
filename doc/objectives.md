# Objectives

* Manage all @u-next packages in a single monorepo. In general reduce code duplicate in multiple packages & provide a centralized place for package lookup.
* Dependencies manged with yarn workspaces which shortens the
* Be able to migrate the existing standalone @u-next packages while keeping the git history.
* A common CI for build, test and publish. When adding a new package we no longer have to recreate the flow in a standalone repository for it.
* A package code update should not trigger the whole CI flow. Only the affected package CI should be executed.
* Integrate semantic release using Lerna & conventional commits. Release version is handled automatically.
