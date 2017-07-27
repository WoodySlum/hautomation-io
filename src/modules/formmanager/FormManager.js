"use strict";
//var Logger = require("./../../logger/Logger");
const Annotation = require("annotation");
const FormObject = require("./FormObject");
const Convert = require("./../../utils/Convert");

const ERROR_NO_JSON_METHOD = "No `json` method implemented";
const ERROR_NO_FORMOBJECT_EXTEND = "The form class does not extend `FormObject` class";
const ERROR_PARENT_CLASS_NOT_REGISTERED = "The parent form class is not registered";

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
        this.register(FormObject.class);
    }

    /**
     * Register a form class
     *
     * @param  {Class} cl     A class with form annotations
     * @param  {...Object} inject Parameters injection on static methods
     */
    register(cl, ...inject) {
        this.registerWithAdditionalFields(cl, {}, ...inject);
    }

    /**
     * Register a form class with additional fields
     *
     * @param  {Class} cl     A class with form annotations
     * @param  {Object} additionalFields     Additional fields object in annotation format
     * @param  {...Object} inject Parameters injection on static methods
     */
    registerWithAdditionalFields(cl, additionalFields, ...inject) {
        this.sanitize(cl);
        this.registeredForms[cl.name] = {
            class: cl,
            inject:inject,
            additionalFields: additionalFields
        };
    }

    /**
     * Check if the register class is valid
     *
     * @param  {Class} cl A class
     */
    sanitize(cl) {
        //console.log(cl.name);
        // Check if json method is implemented
        const methods = Object.getOwnPropertyNames(cl.prototype);
        if (methods.indexOf("json") == -1) {
            throw Error(ERROR_NO_JSON_METHOD);
        }

        // Check if object inherits from FormObject
        if (cl.name !== "FormObject") {
            let extendedFound = true;
            let lastExtendedClass = null;
            try {
                while(extendedFound) {
                    let extendedClass = this.getExtendedClass(cl);
                    if (extendedClass) {
                        lastExtendedClass = extendedClass;

                        if (!this.registeredForms[extendedClass]) {
                            throw Error(ERROR_PARENT_CLASS_NOT_REGISTERED);
                        } else {
                            cl = this.registeredForms[extendedClass].class;
                        }
                    } else {
                        extendedFound = false;
                    }
                }
            } catch(e) {
                throw e;
            }

            if (lastExtendedClass !== "FormObject") {
                throw Error(ERROR_NO_FORMOBJECT_EXTEND);
            }
        }
    }

    /**
     * Get the extended class (parent) from a class
     *
     * @param  {Class} cl A class
     * @returns {string}    Extended class
     */
    getExtendedClass(cl) {
        let c = cl.toString();
        // Extend class lookup
        // Classic regex : class A extends B {
        // ;
        console.log("--------------------");
        console.log(c);
        console.log("--------------------");
        const regex = /(extends)([ ]+)([a-zA-Z\.]*)([ ]*)(\{)/g;
        let regexRes = regex.exec(c);
        let parent = null;

        if (regexRes && regexRes.length > 3) {
            const extendExploded = regexRes[3].trim().split(".");
            if (extendExploded.length > 0) {
          	   if (extendExploded[extendExploded.length - 1].toLowerCase() !== "class") {
            	   parent = extendExploded[extendExploded.length - 1];
                } else if (extendExploded.length > 1) {
        			if (extendExploded[extendExploded.length - 2].toLowerCase() !== "class") {
                        parent = extendExploded[extendExploded.length - 2];
                    }
                }
            }
        }

        return parent;
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
            form = this.generateForm(c, this.registeredForms[className].additionalFields, schema, schemaUI, ...inject);
            schema = form.schema;
            schemaUI = form.schemaUI;
        });

        return form;
    }

    /**
     * Generates a form for a specific class
     *
     * @param  {Class} cl     A class with form annotations
     * @param  {Object} additionalFields     Additional fields object in annotation format
     * @param  {Object} schema   Current schema (append)
     * @param  {Object} schemaUI   Current UI schema (append)
     * @param  {...Object} inject Parameters injection on static methods
     * @returns {Object}        A form object with the properties `schema` and `schemaUI`
     */
    generateForm(cl, additionalFields, schema, schemaUI, ...inject) {
        let c = cl.toString();

        const self = this;
        Annotation(c, function(AnnotationReader) {
            const properties = Object.assign(additionalFields, AnnotationReader.comments.properties);
            Object.keys(properties).forEach((prop) => {

                const meta = Convert.class.convertProperties(properties[prop]);
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
                    } else if (type === "boolean" || type === "bool") {
                        schema.properties[prop].type = "boolean";
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
                        const subForm =  self.generateForm(self.registeredForms[meta.Cl].class, self.registeredForms[meta.Cl].additionalFields, self.initSchema(), self.initSchemaUI(), ...self.registeredForms[meta.Cl].inject);
                        schema.properties[prop].items = subForm.schema;
                        schemaUI[prop].items = subForm.schemaUI;

                        exist = true;
                    } else if (type === "object" && meta.Cl) {
                        const subForm =  self.generateForm(self.registeredForms[meta.Cl].class, self.registeredForms[meta.Cl].additionalFields, self.initSchema(), self.initSchemaUI(), ...self.registeredForms[meta.Cl].inject);
                        schema.properties[prop] = subForm.schema;
                        schema.properties[prop].type = "object";
                        schemaUI[prop] = subForm.schemaUI;

                        exist = true;
                    }

                    if (exist) {
                        // Title
                        if (meta.Title) {
                            if (cl[meta.Title] instanceof Function) {
                                schema.properties[prop].title = cl[meta.Title](...inject);
                            } else {
                                schema.properties[prop].title = self.translateManager.t(meta.Title);
                            }
                        }

                        // Required
                        if (meta.Required && (meta.Required === true)) {
                            schema.required.push(prop);
                        }

                        // Default
                        if (meta.Default) {
                            if (cl[meta.Default] instanceof Function) {
                                schema.properties[prop].default = cl[meta.Default](...inject);
                            } else {
                                schema.properties[prop].default = self.translateManager.t(meta.Default);
                            }
                        }
                        if (meta.Value) {
                            if (cl[meta.Value] instanceof Function) {
                                schema.properties[prop].default = cl[meta.Value](...inject);
                            } else {
                                schema.properties[prop].default = self.translateManager.t(meta.Value);
                            }
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
module.exports = {class:FormManager, ERROR_NO_JSON_METHOD:ERROR_NO_JSON_METHOD, ERROR_NO_FORMOBJECT_EXTEND:ERROR_NO_FORMOBJECT_EXTEND, ERROR_PARENT_CLASS_NOT_REGISTERED:ERROR_PARENT_CLASS_NOT_REGISTERED};
