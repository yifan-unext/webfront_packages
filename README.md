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
