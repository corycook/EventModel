"use strict";

(function (em, global) {

	function foreach(s, f) { if ("length" in s) for (var i = 0; i < s.length; i++) f(s[i], i); else for (var x in s) f(s[x], x); }
	function query(e, s) { return (s === "base") ? [e] : e.querySelectorAll(s); }
	function contains(e, s) { return Array.prototype.slice.call(e).indexOf(s) > -1; }

	function Timer(interval) {
		if (this instanceof Timer) {
			var self = this;
			this.listeners = [];
			setInterval(function () { self.dispatchEvent(); }, interval || 1000);
		}
	}

	(function () {

		this.addEventListener = function (type, listener) {
			if (typeof listener === 'function')
				this.listeners.push(listener);
		}

		this.removeEventListener = function (type, listener) {
			this.listeners.remove(listener);
		}

		this.dispatchEvent = function () {
			foreach(this.listeners, setTimeout);
		}

	}).call(Timer.prototype = Object.create(EventTarget.prototype));

	function EventModelBinder(parent, model, root, q) {
		var self = this;
		this.parent = parent;
		this.model = model;
		this.root = root;
		this.query = q;
		this.nodes = [];

		foreach(query(parent.base, root), function (r) {
			foreach(query(r, q), function (node) {
				self.nodes.push(node);
				(new EventModel(model.view, node, parent)).bind();
			});
		});
	}

	(function () {

		this.observe = function (root) {
			var self = this;
			if (!self.timer)
				self.timer = new Timer(500);
			self.timer.addEventListener('tick', function () {
				foreach(query(root, self.query), function (node) {
					if (self.nodes.indexOf(node) === -1) {
						self.nodes.push(node);
						(new EventModel(self.model.view, node, self.parent)).bind();
					}
				});
			});
		};

		this.watch = function () {
			var self = this;
			foreach(query(self.parent.base, self.root), function (root) {
				self.observe(root);
			});
		};

	}).call(EventModelBinder.prototype);

	function EventModel(viewModel, baseElement, parentModel) {
		this.view = viewModel;
		this.base = baseElement || document;
		this.parent = parentModel || null;
	}

	(function () {

		function createEvent(name, init) {
			try {
				return new Event(name, init);
			} catch (e) {
				var event = document.createEvent('Event');
				event.initEvent(name, init.bubbles || false, init.cancelable || false);
				return event;
			}
		}

		function Dispatcher(name, data) {
			this.name = name;
			this.data = data;
			this.triggered = [];
			this.results = [];
			this.bubbles(true);
		}

		(function () {

			this.on = function (element) {
				if (this.triggered.indexOf(element) > -1) return;
				delete this.event.result;
				element.dispatchEvent(this.event);
				if (typeof this.event.result !== 'undefined')
					this.results.push(this.event.result);
				this.triggered.push(element);
			}

			this.bubbles = function (value) {
				this.event = createEvent(this.name, { bubbles: value, cancelable: true });
				this.event.data = this.data;
			}

		}).call(Dispatcher.prototype);

		function attachSubModel(model, item, selector) {
			var nodes = [];

			if (selector.indexOf(";") > -1) {
				var s = selector.split(';');
				var binder = new EventModelBinder(model, item, s[0], s[1]);
				binder.watch();
			} else {
				foreach(query(model.base, selector), function (node) {
					(new EventModel(item.view, node, model)).bind();
					nodes.push(node);
				});
			}
		}

		function attachDelegatedHandlers(model, item, selector) {
			var s = selector.split(";");
			foreach(query(model.base, s[0]), function (root) {
				foreach(item, function (handler, action) {
					root.addEventListener(action, function (event) {
						if (contains(query(root, s[1]), event.target))
							handler.call(event.target, event, model);
					}, true);
					if (!(action in model))
						model[action] = function (data) { model.trigger.call(model, action, data); }
				});
			});
		}

		function attachItem(item, selector) {
			var model = this;

			if (Array.isArray(item))
				return foreach(item, function (i) { attachItem.call(model, i, selector); });

			if (item instanceof EventModel)
				return attachSubModel(model, item, selector);

			if (selector.indexOf(";") > -1)
				return attachDelegatedHandlers(model, item, selector);

			foreach(query(model.base, selector), function (element) {
				foreach(item, function (handler, action) {
					element.addEventListener(action, function (event) {
						event.result = handler.call(element, event, model);
					});
					if (!(action in model)) {
						model[action] = function (data) {
							return model.trigger(action, data);
						}
					}
				});
			});
		}

		this.bind = function () {
			var model = this;
			foreach(this.view, function () { attachItem.apply(model, arguments); });
			this.trigger("bound");
		};

		this.trigger = function (name, data) {
			var model = this;
			var dispatcher = new Dispatcher(name, data);
			foreach(model.view, function (item, selector) {
				if (name in item || Array.isArray(item) && item.some(function (n) { return name in n; })) {
					if (selector.indexOf(";") > -1) {
						dispatcher.bubbles(true);
						var s = selector.split(";");
						foreach(query(model.base, s[0]), function (root) {
							foreach(query(root, s[1]), function (element) {
								dispatcher.on(element);
							});
						});
					} else {
						dispatcher.bubbles(false);
						foreach(query(model.base, selector), function (element) {
							dispatcher.on(element);
						});
					}
				}
			});
			return dispatcher.results;
		}

	}).call(EventModel.prototype)

	global.Timer = Timer;
	global.EventModel = EventModel;

} (window.em, window));
