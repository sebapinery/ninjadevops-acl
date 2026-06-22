<p align="center">
  <img src="docs/banner.jpeg" alt="ninjadevops-acl" width="800" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ninjadevops-acl"><img src="https://img.shields.io/npm/v/ninjadevops-acl.svg" alt="npm version" /></a>
  <a href="https://nestjs.com/"><img src="https://img.shields.io/badge/NestJS-11-E0234E.svg" alt="NestJS 11" /></a>
  <a href="#"><img src="https://img.shields.io/badge/node-%3E%3D22-43853d.svg" alt="Node >=22" /></a>
</p>

# ninjadevops-acl

Access Control List (ACL) module for [NestJS](https://nestjs.com/), built on top of
[accesscontrol](https://www.npmjs.com/package/accesscontrol). It exposes a **global**
`AccessControlModule` that validates, **on startup**, that every declared role has a
matching grant definition — so a misconfigured role fails fast at boot instead of
silently denying permissions at runtime.

## Table of contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Checking permissions](#checking-permissions)
- [Defining grants](#defining-grants)
- [API reference](#api-reference)
- [How startup validation works](#how-startup-validation-works)
- [Scripts](#scripts)
- [License](#license)

## Features

- 🛡️ Thin NestJS wrapper around the battle-tested `accesscontrol` library.
- 🌐 Registered with `@Global()`, so `AccessControlService` is injectable app-wide.
- ✅ Fail-fast role validation at startup: every role listed in `roles` **must** have
  a matching key in `grants`, otherwise the module throws on boot.
- 🧩 Typed `Action` and `Possessions` enums to build grant keys consistently.

## Installation

```bash
npm install ninjadevops-acl
# or
yarn add ninjadevops-acl
```

Peer/runtime dependencies: `@nestjs/common`, `@nestjs/core`, `accesscontrol`,
`reflect-metadata`, `rxjs`.

Requires **Node.js >= 22** and **NestJS 11**.

## Quick start

Register the module with `forRoot`, passing the list of `roles` and the `grants`
map. If a role does not have a corresponding grant entry, the module throws on boot.

```ts
import { Module } from '@nestjs/common';
import { AccessControlModule, Action, Possessions } from 'ninjadevops-acl';

@Module({
  imports: [
    AccessControlModule.forRoot({
      roles: ['admin'],
      grants: {
        admin: {
          user: {
            [`${Action.READ}:${Possessions.ANY}`]: ['*'],
            [`${Action.CREATE}:${Possessions.ANY}`]: ['*'],
          },
        },
      },
    }),
  ],
})
export class AppModule {}
```

## Checking permissions

Inject the `AccessControlService` (which **extends** `AccessControl` from
`accesscontrol`, so the full `accesscontrol` API is available) wherever you need to
check permissions:

```ts
import { Injectable } from '@nestjs/common';
import { AccessControlService } from 'ninjadevops-acl';

@Injectable()
export class UserService {
  constructor(private readonly acl: AccessControlService) {}

  canReadUser(role: string): boolean {
    const permission = this.acl.can(role).readAny('user');
    return permission.granted;
  }

  // Filter an object down to only the attributes the role is allowed to read
  readUser(role: string, user: Record<string, unknown>) {
    const permission = this.acl.can(role).readAny('user');
    return permission.filter(user);
  }
}
```

A common pattern is to enforce permissions inside a NestJS guard:

```ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AccessControlService } from 'ninjadevops-acl';

@Injectable()
export class CanReadUserGuard implements CanActivate {
  constructor(private readonly acl: AccessControlService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const role = req.user?.role;

    if (!this.acl.can(role).readAny('user').granted) {
      throw new ForbiddenException();
    }
    return true;
  }
}
```

## Defining grants

The `grants` object follows the
[`accesscontrol` grants format](https://onury.io/accesscontrol/?api=ac): a map of
`role → resource → "action:possession" → attributes`.

```ts
import { Action, Possessions } from 'ninjadevops-acl';

const grants = {
  admin: {
    user: {
      [`${Action.READ}:${Possessions.ANY}`]: ['*'],
      [`${Action.UPDATE}:${Possessions.ANY}`]: ['*', '!password'],
      [`${Action.DELETE}:${Possessions.ANY}`]: ['*'],
    },
  },
  user: {
    user: {
      [`${Action.READ}:${Possessions.OWN}`]: ['*', '!password'],
      [`${Action.UPDATE}:${Possessions.OWN}`]: ['name', 'email'],
    },
  },
};
```

- **Attributes** use glob-style notation: `['*']` grants all attributes, while
  `['*', '!password']` grants all except `password`.
- **`any`** means the role can act on any resource instance; **`own`** restricts the
  action to resources the actor owns.

## API reference

### `AccessControlModule.forRoot(options)`

Returns a `DynamicModule`. The module is decorated with `@Global()`, so the exported
`AccessControlService` is available throughout the application without re-importing.

`options: OptionsAccessControl`

| Field    | Type            | Description                                          |
| -------- | --------------- | ---------------------------------------------------- |
| `roles`  | `Array<string>` | Roles that must be implemented in the grants config. |
| `grants` | `Grants`        | `accesscontrol` grants object.                       |

### `AccessControlService`

```ts
class AccessControlService extends AccessControl { /* ... */ }
```

An `@Injectable()` service that extends `AccessControl` from `accesscontrol`. It is
constructed with the configured `grants` and, on instantiation, validates that every
declared role exists in the grants config (see below). All `accesscontrol` methods
(`can`, `grant`, `deny`, `getGrants`, …) are available.

### Types

```ts
interface OptionsAccessControl {
  roles: Array<string>;
  grants: Grants;
}

interface Grants {
  [key: string]: any;
}
```

### Enums

| Enum          | Members                              |
| ------------- | ------------------------------------ |
| `Action`      | `READ`, `CREATE`, `UPDATE`, `DELETE` |
| `Possessions` | `OWN`, `ANY`                         |

```ts
enum Action {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

enum Possessions {
  OWN = 'own',
  ANY = 'any',
}
```

## How startup validation works

When `AccessControlService` is instantiated, it iterates over the `roles` array and
checks that each role has a key in `grants`. If any role is missing, it throws:

```
Error: Rol "<role>" It must be implemented in the acl rules
```

This guarantees that a role declared in your application can never go live without an
explicit grant definition.

## Scripts

```bash
# build the package (emits to dist/)
yarn build

# run unit tests
yarn test

# run tests with coverage
yarn test:cov

# cut a release (standard-version)
yarn release
```

## License

UNLICENSED — private package owned by ninjadevops.
