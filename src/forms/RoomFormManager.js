/* eslint-disable */
"use strict";
const RoomForm = require("./RoomForm");
const FormManager = require("./../modules/formmanager/FormManager");
const DeviceManager = require("./../modules/devicemanager/DeviceManager");
const SensorsManager = require("./../modules/sensorsmanager/SensorsManager");

/**
 * This class allows to generate a form part with an icon select box
 * @class
 */
class RoomFormManager {
    /**
     * Constructor
     *
     * @param  {FormManager} formManager A form manager
     * @param  {EventEmitter} eventBus    The global event bus
     * @param  {string} readyEventName The ready event name
     * @param {SensorsManager} sensorsManager  The sensors manager
     * @param  {DeviceManager} deviceManager The device manager
     * @param  {TranslateManager} translateManager     The translate manager
     * @returns {RoomFormManager}             The instance
     */
    constructor(formManager, eventBus, readyEventName, sensorsManager, deviceManager, translateManager) {

        this.formManager = formManager;
        this.sensorsManager = sensorsManager;
        this.deviceManager = deviceManager;
        this.translateManager = translateManager;
        this.eventBus = eventBus;
        const self = this;

        eventBus.on(readyEventName, () => {
            self.registerRoomsForm(self);
        });

        eventBus.on(DeviceManager.EVENT_UPDATE_CONFIG_DEVICES, () => {
            self.registerRoomsForm(self);
        });

        eventBus.on(SensorsManager.EVENT_UPDATE_CONFIG_SENSORS, () => {
            self.registerRoomsForm(self);
        });
    }

    /**
     * Register form
     *
     * @param  {RoomFormManager} context This class instance
     */
    registerRoomsForm(context = null) {
        if (!context) {
            context = this;
        }

        let rooms = [];

        rooms.push(context.translateManager.t("room.living.room"));
        rooms.push(context.translateManager.t("room.stairs"));
        rooms.push(context.translateManager.t("room.playroom"));
        rooms.push(context.translateManager.t("room.kitchen"));
        rooms.push(context.translateManager.t("room.dining.room"));
        rooms.push(context.translateManager.t("room.hall"));
        rooms.push(context.translateManager.t("room.stairs"));
        rooms.push(context.translateManager.t("room.bedroom"));
        rooms.push(context.translateManager.t("room.bathroom"));
        rooms.push(context.translateManager.t("room.toilets"));
        rooms.push(context.translateManager.t("room.guestroom"));
        rooms.push(context.translateManager.t("room.corridor"));
        rooms.push(context.translateManager.t("room.hallway"));
        rooms.push(context.translateManager.t("room.closet"));
        rooms.push(context.translateManager.t("room.basement"));
        rooms.push(context.translateManager.t("room.attic"));
        rooms.push(context.translateManager.t("room.cellar"));
        rooms.push(context.translateManager.t("room.storeroom"));
        rooms.push(context.translateManager.t("room.pantry"));
        rooms.push(context.translateManager.t("room.roof"));
        rooms.push(context.translateManager.t("room.vestibule"));
        rooms.push(context.translateManager.t("room.garage"));
        rooms.push(context.translateManager.t("room.garden"));
        rooms.push(context.translateManager.t("room.terrace"));
        rooms.push(context.translateManager.t("room.balcony"));
        rooms.push(context.translateManager.t("room.swiming.pool"));
        rooms.push(context.translateManager.t("room.garden.shed"));

        const sensors = context.sensorsManager.getAllSensors();
        Object.keys(sensors).forEach((sensorKey) => {
            const sensor = context.sensorsManager.getSensor(sensorKey);
            if (sensor && sensor.configuration && sensor.configuration.room && sensor.configuration.room.room && (rooms.indexOf(sensor.configuration.room.room) === -1)) {
                rooms.push(sensor.configuration.room.room);
            }

        });

        context.deviceManager.getDevices().forEach((device) => {
            if (device && device.room && device.room.room && (rooms.indexOf(device.room.room) === -1)) {
                rooms.push(device.room.room);
            }
        });

        context.formManager.unregister(RoomForm.class);
        context.formManager.register(RoomForm.class, rooms);

        context.eventBus.emit("room-update");
    }
}

module.exports = {class:RoomFormManager};
