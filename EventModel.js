(function(global) {
    "use strict";

    function EventModel(model) {
        this.targets = [];
        this.model = {};
        this.pushmodel(model);
    }

    (function() {
        function wrapper(obj, handler, event) {
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
                    obj.addEventListener(_handler, fn);
                }
            });
            this.targets.push(target);
        };
        this.trigger = function(type, data) {
            var event = new Event(type);
            event.data = data;
            for (var i = 0; i < this.targets.length; i++) {
                this.enumerate(this.targets[i], function(obj, property) {
                    obj.dispatchEvent(event);
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