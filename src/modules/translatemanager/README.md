# Translate Manager

## Description

This class manage automatically translations.

## Creating a localized environment

On your plugin, create a `lng` folder. In this folder, you'll have to create multiple json files with 2 characters country code.

Plugin root
 |
 |-- plugin.js
 |--lng
     |--en.json
     |--fr.json

The json file will have a set of key values :

    {
        "my.key":"my.value",
        "my.key.2":"my.value2"
    }

If the key is not found in translations, will fallback to default language. If still nothing, will return the key for current translation.

## Usage

In the `function loaded(api)` function of your plugin, you'll need to call the `api.init()` function to load automatically language files.

    function loaded(api) {
        api.init();
    }

Then you can easily get a translation, as :

    api.translateAPI.t("my.key");

## Dynamic localization

You can specify some dynamic values using the `%@` tag in your localized text. This will be automatically replaced when calling the `t` function.

Example :

Translation file :

    {
        "hello":"Hello %@ !"
    }

Code :

    api.translateAPI.t("hello", "WoodySlum");

Will output `Hello WoodySlum !`.
