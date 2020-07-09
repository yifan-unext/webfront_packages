# webfront_packages

The monorepo for managing webfront npm packages.

## Using the packages

[https://github.com/orgs/u-next/packages](https://github.com/orgs/u-next/packages)

## Prerequisite

- [yarn](https://yarnpkg.com/)

## Setup

```
$ yarn install
```

## Commands

[yarn workspace](https://classic.yarnpkg.com/en/docs/cli/workspace/)

Run `yarn` command in the selected package:

```
$ yarn workspace <package-name> <command>
```

For ex:

```
$ yarn workspace awesome-package add react --dev
```

Add a common dev dependency:

```
$ yarn add <package-name> -D -W
```

Run tests:

```
$ yarn test
```

Run tests only for changed packages:

```
$ yarn test-changed
```

## Add a new package

- Put the new package in `packages/`.
- Add `test` & `build` scripts in the `package.json` of the new package.
- Edit `packages/<package-name>/package.json`:

  ```
    "repository": {
      "type": "git",
      "url": "git@github.com:u-next/webfront_packages.git",
      "directory": "packages/<package-name>"
    },
  ```

## Add an existing package from a standalone repository

Instructions to merge a pre-existing package and retaining its git history

### Prerequisite

Install [git-filter-repo](https://github.com/newren/git-filter-repo/blob/main/INSTALL.md)

### Steps

Clone the package `<package-name>` and move all files in `<package-name>` to `packages/<package-name>`:

```
$ cd ..
$ git clone <package-name>
$ cd <package-name>
$ git filter-repo --to-subdirectory-filter packages/<package-name>
$ cd ..
```

Merge the local `<package-name>` to webfront_packages:

```
$ cd webfront_packages
$ git remote add <package-name> ../<package-name>
$ git fetch <package-name> --tags
$ git merge --allow-unrelated-histories <package-name>/master
$ git remote remove <package-name>
```

Edit `packages/<package-name>/package.json`:

```
  "repository": {
    "type": "git",
    "url": "git@github.com:u-next/webfront_packages.git",
    "directory": "packages/<package-name>"
  },
```

## Release flow

Bump version locally:

```
$ yarn lerna:version
```

Commit the changes for the package you'd like to publish.

Submit a pull request for the new version.

Once it's merge to the master branch, the bumped version will be published.
