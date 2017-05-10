"use strict";

/**
 * This class is a User POJO
 * @class
 */
class User {
    /**
     * Constructor
     *
     * @param  {string} [username=null] Username
     * @param  {string} [password=null] Password
     * @param  {int} [level=null] Authorization level
     * @param  {string} [fullName=null] Full name
     * @param  {string} [email=null] Email
     * @param  {string} [phone=null]  Phone number
     * @param  {string} [picture=null]  Picture, in base64 format
     * @returns {User} The instance
     */
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
     *
     * @param  {Object} data JSON object data
     * @returns {User} A User instance
     */
    json(data) {
        return new User(data.username, data.password, data.level, data.fullName, data.email, data.phone, data.picture);
    }
}

module.exports = {class:User};
