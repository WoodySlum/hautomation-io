# Form Manager

## Description

This class will help to create automatically forms using class properties annotations.
This will create a form using the react-jsonschema-form (https://mozilla-services.github.io/react-jsonschema-form/ library) library.
Every key will be translated using `TranslateManager`.

## Usage

Create a class with form annotations as described below.
Then, you need to register the form before calling the `getForm` method.

    formManager.register(Foo, "value1", "value2");
    formManager.getForm(Foo); // Will return the JSON schema

## Inject

As some list and other stuff can be dynamic, you need to create static methods with parameters, that will be called automatically through the `inject` method.

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);

            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translate.key");
             * @Enum("getValues");
             * @EnumNames(["foo.translate.key", "bar.translate.key"]);
             */
            this.bar = bar;
        }

        static getValues(...inject) { // This method will be called when form will be generated
            return [inject[0], inject[1]];
        }
    }

    // Calling
    formManager.register(Foo, "value1", "value2"); // value1 and value2 will be injected when calling the getValues method
    formManager.getForm(Foo); // Will return the JSON schema

## Annotations

Create an ES6 class with some properties in constructor. Every properties will need a corresponding annotation :

Example :

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);

            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translated.key");
             * @Required(true);
             * @Default("FooBar");
             */
            this.bar = bar;
        }
    }

Fast and easy !

### Basic fields

#### Text box

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translate.key");
             */
            this.bar = bar;
        }
    }

#### Text area

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translate.key");
             * @Display("textarea");
             */
            this.bar = bar;
        }
    }

#### Password

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translate.key");
             * @Display("password");
             */
            this.bar = bar;
        }
    }

#### Integer

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("integer");
             * @Title("my.translate.key");
             */
            this.bar = bar;
        }
    }

#### Number

Number can have floating values.

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("number");
             * @Title("my.translate.key");
             */
            this.bar = bar;
        }
    }

#### Boolean

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("boolean");
             * @Title("my.translate.key");
             */
            this.bar = bar;
        }
    }

#### List with static values

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translate.key");
             * @Enum(["foo", "bar"]);
             * @EnumNames(["foo.translate.key", "bar.translate.key"]);
             */
            this.bar = bar;
        }
    }

#### List with dynamic values

You can set a static method to make list more dynamic. The static method will be called with the `inject` parameters when registering form.

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translate.key");
             * @Enum("getValues");
             * @EnumNames(["foo.translate.key", "bar.translate.key"]);
             */
            this.bar = bar;
        }

        static getValues(...inject) {
            return [inject[0], inject[1]];
        }
    }

When registering form (register can be executed multiple times for a single form - as an update) :

    formManager.register(Foo, "value1", "value2");

The values of l-the list will be `value1` for title `foo.translate.key` and `value2` for title `bar.translate.key`.

Remember than `inject` is global.

#### Type ahead list

Identical to list, but a search text box will appear

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translate.key");
             * @Enum(["foo", "bar"]);
             * @EnumNames(["foo.translate.key", "bar.translate.key"]);
             * @Display("typeahead");
             */
            this.bar = bar;
        }
    }

#### Radio buttons

Can be static or dynamic, as lists.

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translate.key");
             * @Enum(["foo", "bar"]);
             * @EnumNames(["foo.translate.key", "bar.translate.key"]);
             * @Display("radio");
             */
            this.bar = bar;
        }
    }

#### Checkboxes

Can be static or dynamic, as lists.

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translate.key");
             * @Enum(["foo", "bar"]);
             * @EnumNames(["foo.translate.key", "bar.translate.key"]);
             * @Display("checkbox");
             */
            this.bar = bar;
        }
    }

#### Date

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("date");
             * @Title("my.translate.key");
             */
            this.bar = bar;
        }
    }

#### Date time

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("datetime");
             * @Title("my.translate.key");
             */
            this.bar = bar;
        }
    }

#### Color

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translate.key");
             * @Display("color");
             */
            this.bar = bar;
        }
    }

### Options

#### Required

    @Required(true);

#### Default value

    @Value("A default value");

#### Disabled

    @Disabled(true);

#### Readonly

    @Readonly(true);

#### Hidden

    @Hidden(true);

### Add multiple list elements

You can use the `@Unique` tag to get the possibility to add multiple elements to a list :

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translate.key");
             * @Enum(["foo", "bar"]);
             * @EnumNames(["foo.translate.key", "bar.translate.key"]);
             * @Unique(true);
             */
            this.bar = bar;
        }
    }

## Extending an existing form

You can also extend an ES6 class form to add more fields.
The parent class must be registered **before** calling the `getForm` method.

Example :

    class Foo extends api.exported.FormObject.class {
        constructor(id, xo) {
            super(id);
            /**
             * @Property("xo");
             * @Type("string");
             * @Title("A parent field");
             */
            this.xo = null;
        }
    }

    class Bar extends Foo {
        constructor(id, xo, xp) {
            super(id, xo);

            /**
             * @Property("xp");
             * @Type("string");
             * @Title("A child field");
             */
            this.xp = null;
        }
    }

    formManager.register(Foo);
    formManager.register(Bar);
    formManager.getForm(Bar);

## Creating a subform

### Single

You can also create a subform inside your own form.
The subform class must be registered **before** calling the `getForm` method.

Example :

    class Foo extends api.exported.FormObject.class {
        constructor(id, xo) {
            super(id);
            /**
             * @Property("xo");
             * @Type("string");
             * @Title("A parent field");
             */
            this.xo = null;
        }
    }

    class Bar extends api.exported.FormObject.class {
        constructor(id, xo, xp) {
            super(id);
            /**
             * @Property("xp");
             * @Type("string");
             * @Title("A form field");
             */
            this.xp = null;

            /**
             * @Property("xo");
             * @Type("object");
             * @Cl("Foo");
             * @Title("A sub form");
             */
            this.xo = xo;
        }
    }

    formManager.register(Foo);
    formManager.register(Bar);
    formManager.getForm(Bar);

### Multiple

You can also create a list of subforms inside your own form, for example to add items.
The subform class must be registered **before** calling the `getForm` method.

Example :

    class Foo extends api.exported.FormObject.class {
        constructor(id, xo) {
            super(id);
            /**
             * @Property("xo");
             * @Type("string");
             * @Title("A parent field");
             */
            this.xo = null;
        }
    }

    class Bar extends api.exported.FormObject.class {
        constructor(id, xo, xp) {
            super(id);
            /**
             * @Property("xp");
             * @Type("string");
             * @Title("A form field");
             */
            this.xp = null;

            /**
             * @Property("xo");
             * @Type("objects");
             * @Cl("Foo");
             * @Title("A sub form");
             */
            this.xo = xo;
        }
    }

    formManager.register(Foo);
    formManager.register(Bar);
    formManager.getForm(Bar);

### Hide fields depending on other field value

    class Foo extends api.exported.FormObject.class {
        constructor(id, bar) {
            super(id);
            /**
             * @Property("bar");
             * @Type("string");
             * @Title("my.translate.key");
             * @Enum(["foo", "bar"]);
             * @EnumNames(["foo.translate.key", "bar.translate.key"]);
             * @Unique(true);
             */
            this.bar = bar;

            /**
             * @Property("dependingField");
             * @Type("string");
             * @DependencyField("bar");
             * @DependencyValues("foo");
             */
        }
    }
