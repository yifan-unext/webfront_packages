# webfront_packages

The monorepo for managing webfront npm packages.

## Using the packages

[https://github.com/orgs/u-next/packages](https://github.com/orgs/u-next/packages)

## Development

### Prerequisite

* [yarn](https://yarnpkg.com/)
* [lerna](https://lerna.js.org/)

### Setup

```
$ yarn install
```

### Commands

Display dependency tree:
```
$ yarn workspaces info
```

Run `yarn` command in the selected package:
```
$ yarn workspace <package-name> <command>
```

For ex:
```
$ yarn workspace awesome-package add react --dev
```

Add a common dependency to all packages:
```
$ yarn add <package-name> -W
```

### Merge a package in a standalone repository

Instructions to merge a pre-existing package and retaining its git history

#### Prerequisite

Install [git-filter-repo](https://github.com/newren/git-filter-repo/blob/main/INSTALL.md)

#### Steps

Clone a packageA and move all files in packageA to `packages/packageA`:
```
$ cd ..
$ git clone packageA
$ cd packageA
$ git filter-repo --to-subdirectory-filter packages/packageA
$ cd ..
```

Merge the local packageA to webfront_packages:
```
$ cd webfront_packages
$ git remote add packageA ../packageA
$ git fetch packageA --tags
$ git merge --allow-unrelated-histories packageA/master
$ git remote remove packageA
```
