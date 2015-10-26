"use strict";

(function (em, global) {

	function forEach(seq, fn) {
		if ("length" in seq)
			for (var i = 0; i < seq.length; i++)
				fn(seq[i], i);
		else for (var x in seq)
			fn(seq[x], x);
	}

	function EventModel(viewModel, baseElement, parentModel) {
		this.view = viewModel;
		this.base = baseElement || document;
		this.parent = parentModel || null;
	}

	(function () {
		
		function createEvent(name, init) {
			try {
				return new Event(name, init);
			} catch(e) {
				var event = document.createEvent('Event');
				event.initEvent(name, init.bubbles || false, init.cancelable || false);
				return event;
			}
		}
		
		function Dispatcher(event) {
			this.event = event;
			this.triggered = [];
			this.results = [];
		}
		
		Dispatcher.prototype.on = function(element) {
			if (this.triggered.indexOf(element) > -1) return;
			delete this.event.result;
			element.dispatchEvent(this.event);
			if (typeof this.event.result !== 'undefined')
				this.results.push(this.event.result);
			this.triggered.push(element);
		}

		function wrapper(handler, model, event) {
			event.result = handler.call(this, event, model);
		}

		function delegate(query, handler, model, event) {
			var elements = Array.prototype.slice.call(this.querySelectorAll(query));
			if (elements.indexOf(event.target) > -1)
				event.result = handler.call(event.target, event, model);
		}

		this.bind = function () {
			var model = this;
			forEach(model.view, function (item, selector) {
				if (item instanceof EventModel) {
					forEach(model.base.querySelectorAll(selector), function (element) {
						(new EventModel(item.view, element, model)).bind();
					});
				} else {
					if (selector.indexOf(";") > -1) {
						var s = selector.split(";");
						forEach(model.base.querySelectorAll(s[0]), function (root) {
							forEach(item, function (handler, action) {
								root.addEventListener(action, delegate.bind(root, s[1], handler, model));
								if (!(action in model))
									model[action] = model.trigger.bind(model, action);
							});
						});
					} else {
						forEach(model.base.querySelectorAll(selector), function (element) {
							forEach(item, function (handler, action) {
								element.addEventListener(action, wrapper.bind(element, handler, model));
								if (!(action in model))
									model[action] = model.trigger.bind(model, action);
							});
						});
					}
				}
			});
		};

		this.trigger = function (name, data) {
			var model = this;
			var e = createEvent(name, { bubbles: true, cancelable: true });
			e.data = data;
			var dispatcher = new Dispatcher(e);
			forEach(model.view, function (item, selector) {
				if (!(name in item)) return;
				if (selector.indexOf(";") > -1) {
					var s = selector.split(";");
					forEach(model.base.querySelectorAll(s[0]), function (root) {
						forEach(root.querySelectorAll(s[1]), function (element) {
							dispatcher.on(element);
						});
					});
				} else {
					forEach(model.base.querySelectorAll(selector), function (element) {
						dispatcher.on(element);
					});
				}
			});
			return dispatcher.results;
		}

	}).call(EventModel.prototype)

	global.EventModel = EventModel;

} (window.em, window));
