"use strict";

class User {
    constructor(username = null, password = null, level = null, fullName = null, email = null, phone = null, picture = null) {
        /**
         * The username
         * @type {string}
         */
        this.username = username;
        /**
         * The password
         * @type {string}
         */
        this.password = password;
        /**
         * The authorization level
         * @type {int}
         */
        this.level = level;
        /**
         * The full name
         * @type {string}
         */
        this.fullName = fullName;
        /**
         * The email
         * @type {string}
         */
        this.email = email;
        /**
         * The phone
         * @type {string}
         */
        this.phone = phone;
        /**
         * The picture
         * @type {data}
         */
        this.picture = picture;
    }

    /**
     * Transform json raw object to instance
     * @param  {Object} data JSON object data
     * @return {User} A User instance
     */
    json(data) {
        return new User(data.username, data.password, data.level, data.fullName, data.email, data.phone, data.picture);
    }
}

module.exports = {class:User};
