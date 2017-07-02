/* eslint-disable */
"use strict";

function loaded(api) {

    class MyForm extends api.exported.FormObject.class {
        constructor(id, myParameter) {
            super(id);
            /**
             * @Property("myParameter");
             * @Type("string");
             * @Title("A parameter sample");
             */
            this.myParameter = myParameter;

        }

        json(data) {
            return new MyForm(data.id, data.myParameter);
        }
    }

    return MyForm;
}

module.exports = loaded;
