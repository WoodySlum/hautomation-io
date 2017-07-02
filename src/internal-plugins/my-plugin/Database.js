/* eslint-disable */
"use strict";

function loaded(api) {

    class MyTable extends api.exported.DbObject.class {
        constructor(dbHelper = null, ...values) {
            super(dbHelper, ...values);

            /**
             * @Property("text");
             * @Type("string");
             * @Version("0.0.0");
             */
            this.text;

            /**
             * @Property("number");
             * @Type("int");
             * @Version("0.0.0");
             */
            this.number;
        }
    }

	return MyTable;
}

module.exports = loaded;
