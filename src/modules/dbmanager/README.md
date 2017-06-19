# Database Manager

## Description

This set of classes manage database through simple apis.

## Usage

### Describe your schema

Your database schema is represented by a JSON Object, with the following structure :

    const schema = {"table_name":[
            {"field1" : {"type" : "string", "version" : "0.0.0"}},
            {"field2" : {"type" : "int", "version" : "0.0.0"}}
        ]};

The manager will automatically add an `id` and `timestamp` field for you.
The version part is used for upgrading database. If you want to add a new field in your plugin, change the version and it rocks !
Here is the supported field types : `int`, `float`, `double`, `date`, `datetime`, `timestamp`, `string`and `blob`.

Example :

    const schema = {"user":[
            {"username" : {"type" : "string", "version" : "0.0.0"}},
            {"firstname" : {"type" : "string", "version" : "0.0.0"}},
            {"lastname" : {"type" : "string", "version" : "0.0.0"}},
            {"password" : {"type" : "string", "version" : "0.0.0"}},
            {"age" : {"type" : "int", "version" : "0.0.1"}}
        ]};

Then the schema should be created through the `DbManager` object. The second parameter is the old database version (before migration) :

    dbManager.initSchema(schema, "0.0.0");


### Instantiate the DbHelper object

The `DbHelper` will give you an easy access to database.
To instantiate a helper, just pass the `DbManager`, `schema` and `table`. Optionally you can specify your extended `DbObject` (check *DbObject* part) :

    const dbHelper = new DbHelper(dbManager, schema, table);

The you can use the instance to perform database operations :

#### RequestBuilder

Returns a `RequestBuilder` empty object (check *RequestBuilder* part). No parameters.

#### Operators

Returns the list of operators for queries.

#### saveObject

Save an object into database.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| callback  | Function | A callback with an error inside if save has not be successfully done |

Example :

    const dbObject : new DbObject.class(dbHelper, "foo");
    dbHelper.saveObject(dbObject, (err) => {
            if (!err) {
                console.log("Object has been saved !");
            } else {
                console.log("Oops, something went wrong : " + err.message);
            }
        });

#### getObject

Get an object from database.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| object  | Object | An object with some values inside. All properties are not mandatory |
| callback  | Function | A callback with an error and object inside if save has not be successfully done |

Example :

    const anObject = {id:81};
    dbHelper.saveObject(anObject, (err, object) => {
            if (!err) {
                console.log("Here is the object :");
                console.log(object);
            } else {
                console.log("Oops, something went wrong : " + err.message);
            }
        });

#### getObjects

Retrieve objects from database.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| request  | DbRequestBuilder | A request builder object |
| callback  | Function | A callback with an error and object inside if save has not be successfully done |

Example :

    const request = dbHelper.RequestBuilder()
                    .where("value", dbHelper.Operators().EQ, "foobar");
    dbHelper.getObjects(request, (err, objects) => {
            if (!err) {
                console.log("Here is the object list :");
                console.log(objects);
            } else {
                console.log("Oops, something went wrong : " + err.message);
            }
        });

#### getLastObject

Get the last object from database. `null` if not found.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| callback  | Function | A callback with an error and object inside if save has not be successfully done |

Example :

    dbHelper.getLastObject((err, object) => {
            if (!err) {
                console.log("Here is the object :");
                console.log(object);
            } else {
                console.log("Oops, something went wrong : " + err.message);
            }
        });

#### delObject

Delete an object from database

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| object  | Object | An object with some values inside. All properties are not mandatory |
| callback  | Function | A callback with an error and object inside if save has not be successfully done |

Example :

    const anObject = {id:81};
    dbHelper.delObject(anObject, (err) => {
            if (err) {
                console.log("Oops, something went wrong : " + err.message);
            }
        });

#### delObjects

Delete objects from database.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| request  | DbRequestBuilder | A request builder object |
| callback  | Function | A callback with an error and object inside if save has not be successfully done |

Example :

    const request = dbHelper.RequestBuilder()
                    .where(dbHelper.Operators().FIELD_ID, dbHelper.Operators().GT, 100);
    dbHelper.delObjects(request, (err) => {
            if (err) {
                console.log("Oops, something went wrong : " + err.message);
            }
        });

### Create your database request

Database request can be coded without writing any SQL line, if the request is not too complex.

#### Create a request

A new request can be created using the `dbHelper` object :

    let request = dbHelper.RequestBuilder();

#### Building the request

##### select

Select some fields from database.
Can be called multiple times.
If no parameters are passed, all fields will be retrieved.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| fields  | ...string | A list of fields |

Example :

    let request = dbHelper.RequestBuilder()
                    .select("foo", "bar");

##### selectOp

Select some calculated fields from database.
Can be called multiple times.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| operator  | constant | An operator, can be `AVG`, `SUM`, `MIN`, `MAX` or `COUNT` |
| field  | string | A field name |
| alias  | string | The field alias, default `null` |

Example :

    let request = dbHelper.RequestBuilder()
                    .selectOp(dbHelper.Operators().COUNT, "username", "nbUsers");

##### where

Add a where clause to the request.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| field  | string | A field name |
| operator  | constant | An operator, can be `EQ`, `NEQ`, `LT`, `GT`, `LTE`, `GTE`, `LIKE` or `NLIKE` |
| value  | Object | The field alias, default `null` |

Example :

    let request = dbHelper.RequestBuilder()
                    .select()
                    .where("age", dbHelper.Operators().GTE, 30)
                    .where("firstname", dbHelper.Operators().LIKE, "S%");

##### complewWhere

Add a complex where to the request. In this case you can write SQL.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| clause  | string | A SQL query part |

Example :

    let request = dbHelper.RequestBuilder()
                    .select()
                    .where("age", dbHelper.Operators().GTE, 30)
                    .complexeWhere("('birthday' = '2017-03-29' OR 'birthday' = '2017-03-29')");

##### groupOp

Group results with an operator.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| operator  | constant | An operator, can be `AVG`, `SUM`, `MIN`, `MAX` or `COUNT` |
| field  | string | A field name |

Example :

    let request = dbHelper.RequestBuilder()
                    .select()
                    .groupOp(dbHelper.Operators().MAX, "age");

##### group

Group fields

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| fields  | ...string | A list of fields |

Example :

    let request = dbHelper.RequestBuilder()
                    .selectOp(dbHelper.Operators().AVG, "age", "ageAvg")
                    .where("age", dbHelper.Operators().GTE, 30)
                    .group("ageAvg");

##### order

Sort the results

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| operator  | constant | An operator, can be `ASC` or `DESC` |
| field  | string | A field name |

Example :

    let request = dbHelper.RequestBuilder()
                    .select()
                    .order(dbHelper.Operators().DESC, "age")
                    .order(dbHelper.Operators().ASC, "birthday");

##### lim

Limit the number of results.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| start  | int | The index of start |
| length  | int | The length from the `start` |

Example :

    let request = dbHelper.RequestBuilder()
                    .select()
                    .order(dbHelper.Operators().DESC, "age")
                    .order(dbHelper.Operators().ASC, "birthday")
                    .lim(0,10); // Returns the 10 first

##### first

Get the first n results.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| length  | int | The length from the `start` |

Example :

    let request = dbHelper.RequestBuilder()
                    .select()
                    .order(dbHelper.Operators().DESC, "age")
                    .order(dbHelper.Operators().ASC, "birthday")
                    .first(10); // Returns the 10 first

### Use the DbObjects to work easier

#### Classic DbObject methods

##### save

Save the object.

##### delete

Delete the object.

#### Extending DbObject

You can extend the `DbObject` class to provide your own methods. The extended class should be passed to the `DbHelper` constructor, and will be used for each database operation.

Here is a quick code example :

    class User extends DbObject.class {
        // You're right, the constructor here is not needed because already done by parent class
        constructor(dbHelper, username, password, age) {
            super(dbHelper, username, password, age);
        }

        getMyAge() {
            console.log("I have " + this.age + "years old");
        }
    }

    const table = "user";
    const schema = {table:[
            {"username" : {"type" : "string", "version" : "0.0.0"}},
            {"firstname" : {"type" : "string", "version" : "0.0.0"}},
            {"lastname" : {"type" : "string", "version" : "0.0.0"}},
            {"password" : {"type" : "string", "version" : "0.0.0"}},
            {"age" : {"type" : "int", "version" : "0.0.1"}}
        ]};

    const dbHelper = new DbHelper(dbManager, schema, table, User);
    dbHelper.getLastObject((err, object) => {
        if (!err) {
            object.getMyAge();
            object.age = "35";
            object.save();
        }
    });
