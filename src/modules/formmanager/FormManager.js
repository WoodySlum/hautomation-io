"use strict";
//var Logger = require("./../../logger/Logger");
const Annotation = require("annotation");

/**
 * Generate forms from a specific object
 * The generated form is compatible with https://mozilla-services.github.io/react-jsonschema-form/ library
 * @class
 */
class FormManager {
    /**
     * Constructor
     *
     * @param  {TranslateManager} translateManager A translate manager
     * @returns {FormManager}                  A form manager
     */
    constructor(translateManager) {
        this.translateManager = translateManager;
        this.registeredForms = {};
    }

    /**
     * Convert key / values object into a single one. Example `[{key:"Foo", value:"Bar"}]` will become `{Foo:"Bar"}`
     *
     * @param  {Object} inputObject An input object
     * @returns {Object}             An output object
     */
    convertProperties(inputObject) {
        let output = {};
        inputObject.forEach((p) => {
            output[p.key] = p.value;
        });
        return output;
    }

    /**
     * Register a form class
     *
     * @param  {Class} cl     A class with form annotations
     * @param  {...Object} inject Parameters injection on static methods
     */
    register(cl, ...inject) {
        this.registeredForms[cl.name] = {
            class: cl,
            inject:inject
        };
    }

    /**
     * Get the extended class (parent) from a class
     *
     * @param  {Class} cl A class
     * @returns {string}    Extended class
     */
    getExtendedClass(cl) {
        let c = cl.toString();
        let extendedClassFound = null;
        // Extend class lookup
        const regex = /(.*)(extends)([ ]+)([a-zA-Z0-9]+)(.*)/g;
        const regexRes = regex.exec(c);
        if (regexRes && regexRes.length > 4) {
            extendedClassFound = regexRes[4];
        }

        return extendedClassFound;
    }


    /**
     * Init schema
     *
     * @returns {Object} An initialized schema
     */
    initSchema() {
        return {type:"object", required:[], properties:{}};
    }

    /**
     * Init UI schema
     *
     * @returns {Object} An initialized schema
     */
    initSchemaUI() {
        return {};
    }

    /**
     * Get a form object
     *
     * @param  {Class} cl     A class with form annotations
     * @param  {...Object} inject Parameters injection on static methods
     * @returns {Object}        A form object with the properties `schema` and `schemaUI`
     */
    getForm(cl, ...inject) {
        if (!this.registeredForms[cl.name]) {
            this.register(cl, ...inject);
        }
        let schema = this.initSchema();
        let schemaUI = this.initSchemaUI();
        let classesList = [cl.name];
        let extendedFound = true;
        while(extendedFound) {
            const extendedClass = this.getExtendedClass(cl);
            if (extendedClass && this.registeredForms[extendedClass]) {
                classesList.unshift(extendedClass);
                cl = this.registeredForms[extendedClass].class;
            } else {
                extendedFound = false;
            }
        }

        let form;

        classesList.forEach((className) => {
            const c = this.registeredForms[className].class;
            const inject = this.registeredForms[className].inject;
            form = this.generateForm(c, schema, schemaUI, inject);
            schema = form.schema;
            schemaUI = form.schemaUI;
        });

        return form;
    }

    /**
     * Generates a form for a specific class
     *
     * @param  {Class} cl     A class with form annotations
     * @param  {Object} schema   Current schema (append)
     * @param  {Object} schemaUI   Current UI schema (append)
     * @param  {...Object} inject Parameters injection on static methods
     * @returns {Object}        A form object with the properties `schema` and `schemaUI`
     */
    generateForm(cl, schema, schemaUI, ...inject) {
        let c = cl.toString();

        const self = this;
        Annotation(c, function(AnnotationReader) {
            const properties = AnnotationReader.comments.properties;
            Object.keys(AnnotationReader.comments.properties).forEach((prop) => {
                const meta = self.convertProperties(properties[prop]);
                if (meta.Type) {
                    const type = meta.Type.toLowerCase();
                    let exist = false;
                    // Type and create properties
                    schema.properties[prop] = {};
                    schemaUI[prop] = {};
                    if (type === "string") {
                        schema.properties[prop].type = "string";
                        exist = true;
                    } else if (type === "integer") {
                        schema.properties[prop].type = "integer";
                        exist = true;
                    } else if (type === "number" || type === "double" || type === "float") {
                        schema.properties[prop].type = "number";
                        exist = true;
                    } else if (type === "datetime") {
                        schema.properties[prop].type = "string";
                        schema.properties[prop].format = "date-time";
                        exist = true;
                    } else if (type === "date") {
                        schema.properties[prop].type = "string";
                        schema.properties[prop].format = "date";
                        exist = true;
                    } else if (type === "objects" && meta.Cl) {
                        schema.properties[prop].type = "array";
                        const subForm =  self.generateForm(self.registeredForms[meta.Cl].class, self.initSchema(), self.initSchemaUI(), self.registeredForms[meta.Cl].inject);
                        schema.properties[prop].items = subForm.schema;
                        schemaUI[prop].items = subForm.schemaUI;

                        exist = true;
                    } else if (type === "object" && meta.Cl) {
                        const subForm =  self.generateForm(self.registeredForms[meta.Cl].class, self.initSchema(), self.initSchemaUI(), self.registeredForms[meta.Cl].inject);
                        schema.properties[prop] = subForm.schema;
                        schema.properties[prop].type = "object";
                        schemaUI[prop] = subForm.schemaUI;

                        exist = true;
                    }

                    if (exist) {
                        // Title
                        if (meta.Title) {
                            schema.properties[prop].title = self.translateManager.t(meta.Title);
                        }

                        // Required
                        if (meta.Required && (meta.Required === true)) {
                            schema.required.push(prop);
                        }

                        // Default
                        if (meta.Default) {
                            schema.properties[prop].default = self.translateManager.t(meta.Default);
                        }
                        if (meta.Value) {
                            schema.properties[prop].default = self.translateManager.t(meta.Value);
                        }

                        // Range
                        if (meta.Range) {
                            if (meta.Range instanceof Array) {
                                if (meta.Range.length > 1) {
                                    schema.properties[prop].minimum = meta.Range[0];
                                    schema.properties[prop].maximum = meta.Range[1];
                                }
                                if (meta.Range.length > 2) {
                                    schema.properties[prop].multipleOf = meta.Range[2];
                                }
                            } else {
                                const rangeResults = cl[meta.Enum](...inject);
                                if (rangeResults.length > 1) {
                                    schema.properties[prop].minimum = rangeResults[0];
                                    schema.properties[prop].maximum = rangeResults[1];
                                }
                                if (meta.Range.length > 2) {
                                    schema.properties[prop].multipleOf = rangeResults[2];
                                }
                            }
                        }

                        // Enum
                        if (meta.Enum) {
                            if (meta.Enum instanceof Array) {
                                schema.properties[prop].enum = meta.Enum;
                            } else {
                                schema.properties[prop].enum = cl[meta.Enum](...inject);
                            }
                        }

                        // Enum names
                        if (meta.EnumNames) {
                            if (meta.EnumNames instanceof Array) {
                                schema.properties[prop].enumNames = self.translateManager.translateArray(meta.EnumNames);
                            } else {
                                schema.properties[prop].enumNames = self.translateManager.translateArray(cl[meta.EnumNames](...inject));
                            }
                        }

                        // Validation
                        if (meta.Minlength) {
                            schema.properties[prop].minLength = meta.Minlength;
                        }
                        if (meta.Maxlength) {
                            schema.properties[prop].maxLength = meta.Maxlength;
                        }
                        if (meta.Minitems) {
                            schema.properties[prop].minItems = meta.Minitems;
                        }
                        if (meta.Maxitems) {
                            schema.properties[prop].maxItems = meta.Maxitems;
                        }
                        if (meta.Regexp) {
                            schema.properties[prop].pattern = meta.Regexp;
                        }
                        if (meta.Validate) {
                            schema.properties[prop].pattern = meta.Validate;
                        }
                        if (meta.Pattern) {
                            schema.properties[prop].pattern = meta.Pattern;
                        }


                        // Display
                        if (meta.Display) {
                            const display = meta.Display.toLowerCase();
                            if (display === "radio") {
                                schemaUI[prop]["ui:widget"] = "radio";
                            } else if (display === "color") {
                                schemaUI[prop]["ui:widget"] = "color";
                            } else if (display === "hidden") {
                                schemaUI[prop]["ui:widget"] = "hidden";
                            } else if (display === "checkbox") {
                                schema.properties[prop]["items"] = {};
                                schema.properties[prop].items.type = schema.properties[prop].type;
                                schema.properties[prop].type = "array";

                                if (schema.properties[prop].enum) {
                                    schema.properties[prop].items.enum = schema.properties[prop].enum;
                                    delete schema.properties[prop].enum;
                                }
                                if (schema.properties[prop].enumNames) {
                                    schema.properties[prop].items.enumNames = schema.properties[prop].enumNames;
                                    delete schema.properties[prop].enumNames;
                                }

                                if (meta.Unique) {
                                    schema.properties[prop].uniqueItems = true;
                                } else {
                                    schema.properties[prop].uniqueItems = false;
                                }

                                schemaUI[prop]["ui:widget"] = "checkboxes";
                            } else if (display === "textarea") {
                                schemaUI[prop]["ui:widget"] = "textarea";
                            }
                        }

                        // Hidden
                        if (meta.Hidden && (meta.Hidden === true)) {
                            schemaUI[prop]["ui:widget"] = "hidden";
                        }

                        // Readonly
                        if (meta.Readonly && (meta.Readonly === true)) {
                            schemaUI[prop]["ui:readonly"] = true;
                        }

                        // Disabled
                        if (meta.Disabled && (meta.Disabled === true)) {
                            schemaUI[prop]["ui:disabled"] = true;
                        }
                    }
                }
            });
        });

        return {schema:schema, schemaUI:schemaUI};
    }
}
module.exports = {class:FormManager};
