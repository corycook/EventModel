"use strict";

(function (edm) {

	function forEach(seq, fn) {
		if ("length" in seq)
			for (var i = 0; i < seq.length; i++)
				fn(seq[i], i);
		else for (var x in seq)
			fn(seq[x], x);
	}

	function Model(viewModel) {
		this.viewmodel = viewModel;
	}

	(function () {

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
			forEach(this.viewmodel, function (item, selector) {
				if (selector.indexOf(";") > -1) {
					var s = selector.split(";");
					forEach(document.querySelectorAll(s[0]), function (root) {
						forEach(item, function (handler, action) {
							root.addEventListener(action, delegate.bind(root, s[1], handler, model));
							if (!(action in model))
								model[action] = model.trigger.bind(model, action);
						});
					});
				} else {
					forEach(document.querySelectorAll(selector), function (element) {
						forEach(item, function (handler, action) {
							element.addEventListener(action, wrapper.bind(element, handler, model));
							if (!(action in model))
								model[action] = model.trigger.bind(model, action);
						});
					});
				}
			});
		};

		this.trigger = function (name, data) {
			var e = new Event(name, { bubbles: true, cancelable: true });
			e.data = data;
			var triggered = [];
			var results = [];
			forEach(this.viewmodel, function (item, selector) {
				if (!(name in item)) return;
				if (selector.indexOf(";") > -1) {
					var s = selector.split(";");
					forEach(document.querySelectorAll(s[0]), function (root) {
						forEach(root.querySelectorAll(s[1]), function (element) {
							if (triggered.indexOf(element) > -1) return;
							e.result = null;
							element.dispatchEvent(e);
							if (e.result)
								results.push(e.result);
							triggered.push(element);
						});
					});
				} else {
					forEach(document.querySelectorAll(selector), function (element) {
						if (triggered.indexOf(element) > -1) return;
						e.result = null;
						element.dispatchEvent(e);
						if (e.result)
							results.push(e.result);
						triggered.push(element);
					});
				}
			});
			if (results.length > 1)
				return results;
			else if (results.length == 1)
				return results[0];
			return null;
		}

	}).call(Model.prototype)

	edm.Model = Model;

} (window.edm = {}));
