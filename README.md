# Hautomation Core

![coverage](http://honey.hd.free.fr:81/hautomation/core-node/badges/master/coverage.svg?job=test)  ![build](http://honey.hd.free.fr:81/hautomation/core-node/badges/master/build.svg)

## Environment

### WebStorm

In preferences / languages / Javascript, set ECMAScript 6 and save.

### Requirements

* node 6.1.0 or upper version

### Installation

In console, type `npm install` and everything should go on.

### Dev commands

* `npm update` Update dependencies
* `npm run start` Start Hautomation services
* `npm run dev` Run dev server with lint
* `npm run test` Run all unit test
* `npm run lint` Check code issues
* `npm run coverage` Generate test coverage
* `npm run test-ci` Execute tests and generate test coverage
* `npm run doc` Generate code documentation
* `npm run doc-apis` Generate Public APIs documentation
* `npm run build` Build for current architecture

## Global architecture

![Global architecture](doc/architecture.png "Global architecture")

## Documentation

### Code documentation

[Full documentation](doc/DOCUMENTATION.md)

### Public APIs

[Full documentation](doc/PUBLIC-APIS.md)

#### Web Services API registration

[Go to details](src/services/webservices/README.md)

#### Configuration manager

[Go to details](src/modules/confmanager/README.md)

#### Threads manager

[Go to details](src/modules/threadsmanager/README.md)

#### Services

[Go to details](src/services/README.md)

#### Database manager

[Go to details](src/modules/dbmanager/README.md)

#### Translate manager

[Go to details](src/modules/translatemanager/README.md)

#### Form manager

[Go to details](src/modules/formmanager/README.md)
