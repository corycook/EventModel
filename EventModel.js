"use strict";

(function (em, global) {

	function forEach(seq, fn) {
		if ("length" in seq)
			for (var i = 0; i < seq.length; i++)
				fn(seq[i], i);
		else for (var x in seq)
			fn(seq[x], x);
	}

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

	function EventModel(viewModel, baseElement, parentModel) {
		this.view = viewModel;
		this.base = baseElement || document;
		this.parent = parentModel || null;
	}

	(function () {

		function wrapper(handler, model, event) {
			event.result = handler.call(this, event, model);
		}

		function delegate(query, handler, model, event) {
			if (Array.prototype.slice.call(this.querySelectorAll(query)).indexOf(event.target) > -1)
				event.result = handler.call(event.target, event, model);
		}

		function subModel(item, selector) {
			if (selector.indexOf(";") > -1) {
				var s = selector.split(";");
				forEach(model.base.querySelectorAll(s[0]), function (element) {
					var observer = new MutationObserver(function (mutations) {
						forEach(mutations, function (record) {
							if (record.type == "childList" && record.addedNodes.length > 0) {
								forEach(record.addedNodes, function (node) {
									if (Array.prototype.slice.call(element.querySelectorAll(s[1])).indexOf(node) > -1)
										(new EventModel(item.view, node, model)).bind();
								});
							}
						})
					});
					observer.observe(element, { attributes: false, childList: true, characterData: false });
				});
			} else {
				forEach(model.base.querySelectorAll(selector), function (element) {
					(new EventModel(item.view, element, model)).bind();
				});
			}
		}

		this.bind = function () {
			var model = this;
			forEach(model.view, function (item, selector) {
				if (item instanceof EventModel) {
					subModel(item, selector);
				} else {
					if (selector.indexOf(";") > -1) {
						var s = selector.split(";");
						forEach(model.base.querySelectorAll(s[0]), function (root) {
							forEach(item, function (handler, action) {
								root.addEventListener(action, delegate.bind(root, s[1], handler, model), true);
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
			this.trigger("bound");
		};

		this.trigger = function (name, data) {
			var model = this;
			var dispatcher = new Dispatcher(name, data);
			forEach(model.view, function (item, selector) {
				if (!(name in item)) return;
				if (selector.indexOf(";") > -1) {
					dispatcher.bubbles(true);
					var s = selector.split(";");
					forEach(model.base.querySelectorAll(s[0]), function (root) {
						forEach(root.querySelectorAll(s[1]), function (element) {
							dispatcher.on(element);
						});
					});
				} else {
					dispatcher.bubbles(false);
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
