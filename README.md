<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

# ninjadevops-acl

Access Control List (ACL) module for [NestJS](https://nestjs.com/), built on top of
[accesscontrol](https://www.npmjs.com/package/accesscontrol). It exposes a global
`AccessControlModule` that validates, on startup, that every declared role has a
matching grant definition.

## Installation

```bash
npm install ninjadevops-acl
# or
yarn add ninjadevops-acl
```

Peer/runtime dependencies: `@nestjs/common`, `@nestjs/core`, `accesscontrol`,
`reflect-metadata`, `rxjs`.

## Usage

Register the module with `forRoot`, passing the list of `roles` and the `grants`
map. If a role does not have a corresponding grant entry, the module throws on
boot.

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

Inject the `AccessControlService` (which extends `AccessControl` from
`accesscontrol`) wherever you need to check permissions:

```ts
import { Injectable } from '@nestjs/common';
import { AccessControlService, Action, Possessions } from 'ninjadevops-acl';

@Injectable()
export class UserService {
  constructor(private readonly acl: AccessControlService) {}

  canReadUser(role: string): boolean {
    const permission = this.acl.can(role).readAny('user');
    return permission.granted;
  }
}
```

## API

### `AccessControlModule.forRoot(options)`

`options: OptionsAccessControl`

| Field    | Type                | Description                                          |
| -------- | ------------------- | ---------------------------------------------------- |
| `roles`  | `Array<string>`     | Roles that must be implemented in the grants config. |
| `grants` | `Grants`            | `accesscontrol` grants object.                       |

The module is `@Global()`, so `AccessControlService` is available app-wide.

### Enums

- `Action`: `READ`, `CREATE`, `UPDATE`, `DELETE`
- `Possessions`: `OWN`, `ANY`

## Scripts

```bash
# build
yarn build

# unit tests
yarn test

# test coverage
yarn test:cov
```

## License

UNLICENSED — private package owned by ninjadevops.
