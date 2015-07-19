(function(global) {
    "use strict";

    if (typeof Array.prototype.indexOf === "undefined") {
        Array.prototype.indexOf = function(obj, start) {
            for (var i = (start || 0), j = this.length; i < j; i++) {
                if (this[i] == obj)
                    return i;
            }
            return -1;
        }
    }
    if (typeof Function.prototype.bind === "undefined") {
        function toArray(arrayLike) {
            var result = [];
            if (typeof arrayLike.length === "undefined")
                return result;
            for (var i = 0; i < arrayLike.length; i++) {
                result.push(arrayLike[i]);
            }
            return result;
        }
        Function.prototype.bind = function(thisArg) {
            var self = this;
            var args = Array.prototype.slice.call(arguments, 1);
            return function() {
                self.apply(thisArg, args.concat(toArray(arguments)));
            }
        }
    }
    
    function EventModel(model) {
        this.targets = [];
        this.model = {};
        this.pushmodel(model);
    }
    (function() {
        function createEvent(type) {
            try {
                return new Event(type);
            } catch(e) {
                if (typeof document.createEvent !== "undefined") {
                    var event = document.createEvent("Event");
                    event.initEvent(type, true, true);
                    return event;
                }
            }
            return { type: type };
        }
        function wrapper(obj, handler, event) {
            if (event == null)
                event = { };
            event.model = this;
            handler.call(obj, event);
        }
        this.enumerate = function(target, callback) {
            for (var _property in this.model) {
                if (_property in target) {
                    callback(target[_property], this.model[_property]);
                }
            }
        };
        this.pushmodel = function(model) {
            for (var _property in model) {
                if (!(_property in this.model))
                    this.model[_property] = {};
                for (var _handler in model[_property]) {
                    this.model[_property][_handler] = model[_property][_handler];
                    if (!(_handler in this))
                        this[_handler] = this.trigger.bind(this, _handler);
                }
            }
        };
        this.attach = function(target) {
            var self = this;
            this.enumerate(target, function(obj, property) {
                for (var _handler in property) {
                    var fn = wrapper.bind(self, obj, property[_handler]);
                    if (typeof obj.addEventListener !== "undefined")
                        obj.addEventListener(_handler, fn);
                    else if (typeof obj.attachListener !== "undefined")
                        obj.attachListener(_handler, fn);
                    else
                        obj["on" + _handler] = fn;
                }
            });
            this.targets.push(target);
        };
        this.trigger = function(type, data) {
            var self = this;
            var event = createEvent(type);
            event.data = data;
            var objects = [];
            for (var i = 0; i < this.targets.length; i++) {
                this.enumerate(this.targets[i], function(obj, property) {
                    if (!(type in property) || objects.indexOf(obj) !== -1)
                        return;
                    if (typeof obj.dispatchEvent !== "undefined")
                        obj.dispatchEvent(event);
                    else if (("on" + type) in obj)
                        (obj["on" + type]).call(obj, event);
                    objects.push(obj);
                });
            }
        }
    }).call(EventModel.prototype);

    function SelectorEventModel(model) {
        EventModel.call(this, model);
    }
    (function() {
        this.enumerate = function(target, callback) {
            for (var _property in this.model) {
                var elements = target.querySelectorAll(_property);
                for (var i = 0; i < elements.length; i++) {
                    callback(elements[i], this.model[_property]);
                }
            }
        }
    }).call(SelectorEventModel.prototype = new EventModel());

    global.EventModel = EventModel;
    global.SelectorEventModel = SelectorEventModel;
}(window));