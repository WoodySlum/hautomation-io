"use strict";
//var Logger = require("./../../logger/Logger");
const Annotation = require("annotation");
const FormObject = require("./FormObject");
const Convert = require("./../../utils/Convert");

const ERROR_NO_JSON_METHOD = "No `json` method implemented";
const ERROR_NO_FORMOBJECT_EXTEND = "The form class does not extend `FormObject` class";
const ERROR_PARENT_CLASS_NOT_REGISTERED = "The parent form class is not registered";
const BASE_SORTING = 100;

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
     * Add additional fields to a form base
     * Deprecated - Use addAdditionalFieldsWithSort
     *
     * @param {Class} formBase The base form
     * @param {string} title The form title
     * @param {Array} forms    An array of forms
     * @param {boolean} [isList=false] `true` if this is a list of objects, otherwise `false`
     */
    addAdditionalFields(formBase, title, forms, isList = false) {
        this.addAdditionalFieldsWithSort(formBase, title, forms, BASE_SORTING, isList);
    }

    /**
     * Add additional fields to a form base
     *
     * @param {Class} formBase The base form
     * @param {string} title The form title
     * @param {Array} forms    An array of forms
     * @param {number} sort    Sort
     * @param {boolean} [isList=false] `true` if this is a list of objects, otherwise `false`
     */
    addAdditionalFieldsWithSort(formBase, title, forms, sort = BASE_SORTING, isList = false) {
        const additionalProperties = this.registeredForms[formBase.name].additionalFields;
        forms.forEach((form) => {
            additionalProperties[form.name] = [
                    {key:"Type", value:(isList ? "objects" : "object")},
                    {key:"Cl", value:form.name},
                    {key:"Sort", value:(sort ? sort : BASE_SORTING)},
                    {key:"Title", value:title}
            ];
        });
        this.registeredForms[formBase.name].additionalFields = additionalProperties;
    }

    /**
     * Check if the register class is valid
     *
     * @param  {Class} cl A class
     */
    sanitize(cl) {
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
        const regex = /(extends)([ ]*)([\(]*)([a-zA-Z\.]*)([\)]*)([ ]*)(\{)/g;
        let regexRes = regex.exec(c);
        let parent = null;

        if (regexRes && regexRes.length > 4) {
            const extendExploded = regexRes[4].trim().split(".");
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
     * Sort the form recursively
     *
     * @param  {Object} schema A form schema
     */
    sort(schema) {
        let properties = [];
        let toClean = [];
        if (schema.properties) {
            Object.keys(schema.properties).forEach((property) => {
                let sort = schema.properties[property].sort;
                if (!sort) {
                    if (schema.properties[property].type) {
                        schema.properties[property] = this.sort(schema.properties[property]);
                    }

                    if (schema.properties[property].properties) {
                        schema.properties[property] = this.sort(schema.properties[property]);
                    }

                    if (schema.properties[property].items) {
                        schema.properties[property].items = this.sort(schema.properties[property].items);
                    }

                    sort = BASE_SORTING;
                } else {
                    toClean.push(schema.properties[property]);
                }

                properties.push({property: property, sort:sort});
            });
        }

        if (properties.length > 0) {
            const sorted = properties.map((data, idx) => {
                return {idx: idx, data: data};
            }).sort((a, b) => {
                if (a.data.sort < b.data.sort) return -1;
                if (a.data.sort > b.data.sort) return 1;
                return a.idx - b.idx;
            }).map(function(val){
                return val.data;
            });

            const savedProperties = Object.assign({}, schema.properties);
            schema.properties = {};
            sorted.forEach((sortedElement) => {
                if (savedProperties[sortedElement.property]) {
                    delete savedProperties[sortedElement.property].sort;
                    schema.properties[sortedElement.property] = savedProperties[sortedElement.property];
                }
            });
        }

        return schema;
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
            schema = this.sort(form.schema);
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
            const properties = Object.assign(AnnotationReader.comments.properties, additionalFields);
            Object.keys(properties).forEach((prop) => {
                const meta = Convert.class.convertProperties(properties[prop]);

                let sort = BASE_SORTING;
                if (meta.Sort) {
                    sort = parseInt(meta.Sort);
                }
                if (meta.Type) {
                    const type = meta.Type.toLowerCase();
                    let exist = false;
                    // Type and create properties
                    let schemaPropertiesProp = {sort:sort};
                    schemaUI[prop] = {};

                    if (type === "string") {
                        schemaPropertiesProp.type = "string";
                        exist = true;
                    } else if (type === "integer") {
                        schemaPropertiesProp.type = "integer";
                        exist = true;
                    } else if (type === "number" || type === "double" || type === "float") {
                        schemaPropertiesProp.type = "number";
                        exist = true;
                    } else if (type === "boolean" || type === "bool") {
                        schemaPropertiesProp.type = "boolean";
                        exist = true;
                    } else if (type === "datetime") {
                        schemaPropertiesProp.type = "string";
                        schemaPropertiesProp.format = "date-time";
                        exist = true;
                    } else if (type === "date") {
                        schemaPropertiesProp.type = "string";
                        schemaPropertiesProp.format = "date";
                        exist = true;
                    } else if (type === "objects" && meta.Cl) {
                        schemaPropertiesProp.type = "array";
                        const subForm =  self.generateForm(self.registeredForms[meta.Cl].class, self.registeredForms[meta.Cl].additionalFields, self.initSchema(), self.initSchemaUI(), ...self.registeredForms[meta.Cl].inject);
                        schemaPropertiesProp.items = subForm.schema;
                        schemaUI[prop].items = subForm.schemaUI;

                        exist = true;
                    } else if (type === "object" && meta.Cl) {
                        const subForm =  self.generateForm(self.registeredForms[meta.Cl].class, self.registeredForms[meta.Cl].additionalFields, self.initSchema(), self.initSchemaUI(), ...self.registeredForms[meta.Cl].inject);
                        schemaPropertiesProp = Object.assign({sort: sort}, subForm.schema);
                        schemaPropertiesProp.type = "object";
                        schemaUI[prop] = subForm.schemaUI;

                        exist = true;
                    } else if (type === "file") {
                        schemaPropertiesProp.type = "string";
                        schemaPropertiesProp.format = "data-url";
                        exist = true;
                    }

                    if (exist) {
                        // Title
                        if (meta.Title) {
                            if (cl[meta.Title] instanceof Function) {
                                schemaPropertiesProp.title = cl[meta.Title](...inject);
                            } else {
                                schemaPropertiesProp.title = self.translateManager.t(meta.Title);
                            }
                        } else {
                            schemaPropertiesProp.title = "";
                        }

                        // Required
                        if (meta.Required && (meta.Required === true)) {
                            schema.required.push(prop);
                        }

                        // Default
                        if (meta.Default) {
                            if (cl[meta.Default] instanceof Function) {
                                schemaPropertiesProp.default = cl[meta.Default](...inject);
                            } else {
                                schemaPropertiesProp.default = self.translateManager.t(meta.Default);
                            }
                        }
                        if (meta.Value) {
                            if (cl[meta.Value] instanceof Function) {
                                schemaPropertiesProp.default = cl[meta.Value](...inject);
                            } else {
                                schemaPropertiesProp.default = self.translateManager.t(meta.Value);
                            }
                        }

                        // Range
                        if (meta.Range) {
                            if (meta.Range instanceof Array) {
                                if (meta.Range.length > 1) {
                                    schemaPropertiesProp.minimum = meta.Range[0];
                                    schemaPropertiesProp.maximum = meta.Range[1];
                                }
                                if (meta.Range.length > 2) {
                                    schemaPropertiesProp.multipleOf = meta.Range[2];
                                }
                            } else {
                                const rangeResults = cl[meta.Enum](...inject);
                                if (rangeResults.length > 1) {
                                    schemaPropertiesProp.minimum = rangeResults[0];
                                    schemaPropertiesProp.maximum = rangeResults[1];
                                }
                                if (meta.Range.length > 2) {
                                    schemaPropertiesProp.multipleOf = rangeResults[2];
                                }
                            }
                            schemaUI[prop]["ui:widget"] = "range";
                        }

                        // Enum
                        if (meta.Enum) {
                            if (meta.Enum instanceof Array) {
                                schemaPropertiesProp.enum = meta.Enum;
                            } else {
                                schemaPropertiesProp.enum = cl[meta.Enum](...inject);
                            }
                        }

                        // Enum names
                        if (meta.EnumNames) {
                            if (meta.EnumNames instanceof Array) {
                                schemaPropertiesProp.enumNames = self.translateManager.translateArray(meta.EnumNames);
                            } else {
                                schemaPropertiesProp.enumNames = self.translateManager.translateArray(cl[meta.EnumNames](...inject));
                            }
                        }

                        // Validation
                        if (meta.Minlength) {
                            schemaPropertiesProp.minLength = meta.Minlength;
                        }
                        if (meta.Maxlength) {
                            schemaPropertiesProp.maxLength = meta.Maxlength;
                        }
                        if (meta.Minitems) {
                            schemaPropertiesProp.minItems = meta.Minitems;
                        }
                        if (meta.Maxitems) {
                            schemaPropertiesProp.maxItems = meta.Maxitems;
                        }
                        if (meta.Regexp) {
                            schemaPropertiesProp.pattern = meta.Regexp;
                        }
                        if (meta.Validate) {
                            schemaPropertiesProp.pattern = meta.Validate;
                        }
                        if (meta.Pattern) {
                            schemaPropertiesProp.pattern = meta.Pattern;
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
                                schemaPropertiesProp["items"] = {};
                                schemaPropertiesProp.items.type = schemaPropertiesProp.type;
                                schemaPropertiesProp.type = "array";

                                if (schemaPropertiesProp.enum) {
                                    schemaPropertiesProp.items.enum = schemaPropertiesProp.enum;
                                    delete schemaPropertiesProp.enum;
                                }
                                if (schemaPropertiesProp.enumNames) {
                                    schemaPropertiesProp.items.enumNames = schemaPropertiesProp.enumNames;
                                    delete schemaPropertiesProp.enumNames;
                                }

                                if (meta.Unique) {
                                    schemaPropertiesProp.uniqueItems = true;
                                } else {
                                    schemaPropertiesProp.uniqueItems = false;
                                }

                                schemaUI[prop]["ui:widget"] = "checkboxes";
                            } else if (display === "textarea") {
                                schemaUI[prop]["ui:widget"] = "textarea";
                            } else if (display === "password") {
                                schemaUI[prop]["ui:widget"] = "password";
                            } else if (display === "typeahead") {
                                if (schemaPropertiesProp.enum && schemaPropertiesProp.enumNames && schemaPropertiesProp.enum.length === schemaPropertiesProp.enumNames.length) {
                                    const typeHeadArray = [];
                                    for (let l = 0 ; l < schemaPropertiesProp.enum.length ; l++) {
                                        typeHeadArray.push({key: schemaPropertiesProp.enum[l], label: schemaPropertiesProp.enumNames[l]});
                                    }
                                    schemaUI[prop]["ui:field"] = "typeahead";
                                    schemaUI[prop]["typeahead"] = {
                                        "options": typeHeadArray,
                                        "labelKey": "label",
                                        "minLength":0,
                                        "mapping":"key",
                                        "placeholder": self.translateManager.t("form.typeahead.search", meta.Title ? self.translateManager.t(meta.Title) : "")

                                    };

                                    delete schemaPropertiesProp.enum;
                                    delete schemaPropertiesProp.enumNames;
                                }
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

                    if (meta.DependencyField && meta.DependencyValues) {
                        if (!schema.dependencies) {
                            schema.dependencies = {};
                        }
                        if (!schema.dependencies[meta.DependencyField]) {
                            schema.dependencies[meta.DependencyField] = {oneOf:[]};
                        }

                        let foundDependencyWithSameCriteria = false;
                        schema.dependencies[meta.DependencyField].oneOf.forEach((propertiesBlock) => {
                            const key = propertiesBlock.properties[meta.DependencyField].enum.join(",").toLowerCase();
                            if (meta.DependencyValues.toLowerCase() === key) {
                                foundDependencyWithSameCriteria = true;
                                propertiesBlock.properties[prop] = schemaPropertiesProp;
                            }
                        });
                        if (!foundDependencyWithSameCriteria) {
                            const dependencyForm = {};
                            if (cl[meta.DependencyValues]) {
                                dependencyForm[meta.DependencyField] = {enum:cl[meta.DependencyValues](...inject)};
                            } else {
                                dependencyForm[meta.DependencyField] = {enum:meta.DependencyValues.split(",")};
                            }

                            dependencyForm[prop] = schemaPropertiesProp;
                            schema.dependencies[meta.DependencyField].oneOf.push({
                                properties: dependencyForm
                            });
                        }
                    } else {
                        schema.properties[prop] = schemaPropertiesProp;
                    }
                }
            });
        });

        return {schema:schema, schemaUI:schemaUI};
    }
}
module.exports = {class:FormManager, ERROR_NO_JSON_METHOD:ERROR_NO_JSON_METHOD, ERROR_NO_FORMOBJECT_EXTEND:ERROR_NO_FORMOBJECT_EXTEND, ERROR_PARENT_CLASS_NOT_REGISTERED:ERROR_PARENT_CLASS_NOT_REGISTERED};
