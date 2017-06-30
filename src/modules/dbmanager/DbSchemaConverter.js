"use strict";
//var Logger = require("./../../logger/Logger");
const Annotation = require("annotation");
var Convert = require("./../../utils/Convert");

/**
 * Convert a DbObject with annotations into a JSON schema (adapter)
 * @class
 */
class DbSchemaConverter {
    /**
     * Get a table name from a DbObject extended class
     *
     * @param  {DbObject} dbObjectClass A class extending DbObject
     * @returns {string}               The table name
     */
    static tableName(dbObjectClass) {
        return dbObjectClass.name.toLowerCase();
    }

    /**
     * Convert DbObject annotations to db schema
     *
     * @param  {DbObject} dbObjectClass A class extending DbObject
     * @returns {Object}               A database schema
     */
    static toSchema(dbObjectClass) {
        let schema = {};
        const table = this.tableName(dbObjectClass);
        schema[table] = [];
        let c = dbObjectClass.toString();
        Annotation(c, function(AnnotationReader) {
            const properties = AnnotationReader.comments.properties;
            Object.keys(AnnotationReader.comments.properties).forEach((prop) => {
                const meta = Convert.class.convertProperties(properties[prop]);
                if (meta.Type && meta.Version) {
                    let localSchema = {};
                    localSchema[prop] = {type : meta.Type, version : meta.Version};
                    schema[table].push(localSchema);
                }
            });
        });

        return schema;
    }
}
module.exports = {class:DbSchemaConverter};
