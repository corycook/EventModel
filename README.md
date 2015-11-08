# eventmodel.js

eventmodel.js is an event mapping utility that simplifies event-based behavioral programming of the
UI in JavaScript.

## The View Model

The object passed to the EventModel constructor is the view model. This describes which events are attached to 
which elements based on event name and CSS query selector syntax.

### Selectors

Property names on the view model should match the CSS-style query selector of the elements that you wish
to target for that set of events.

```javascript
function ViewModel() {
	this['button'] = { /* Event Group */ };
}
``` 

### Event Groups

The value assigned to these properties are the event groups. The event group describes which events to listen to.

```javascript
function ViewModel() {
	this['button'] = {
		click: function() { /* Event Handler */ }
	};
}
```

### Event Handlers

The value assigned to the events in the event group are the handler functions.

```javascript
function ViewModel() {
	this['button'] = {
		click: function() {
			document.write("The button was clicked!");
		}
	}
}
```

This last example is a complete view model that, when bound, will write "The button was clicked!" to the page when 
any button on the page is clicked.

The event handlers "this" object is set to the target element of the event.

The event handlers accept two arguments
1. The Event
2. The EventModel

```javascript
function ViewModel() {
	this['button'] = {
		click: function(event, model) {
			/* event is the instance of the Event interface
			   and model is the EventModel instance that this
			   handler is bound to 
			*/
		}
	}
}
```

In this way two EventModel instances can be bound to the same view model.

```javascript
function ViewModel() {
	var data = { 'item': "shared_value" };
	
	this['button'] = {
		click: function(event, model) {
			console.log(data);
			console.log(model.data);
			data.item = data.item + " " + model.data.item;
		}
	};
}

var viewModel = new ViewModel();

var model = new EventModel(viewModel);
model.data = { 'item': "first" };
model.bind();

var next_model = new EventModel(viewModel);
next_model.data = { 'item': "second" };
next_model.bind();
```

In this example, each model has its own data property that handlers can access 
through the model argument and the view model has a data property that all models
can access directly.

Clicking a button on the page will log:
```
{ 'item': "shared_value" }
{ 'item': "first" }
{ 'item': "shared_value first" }
{ 'item': "second" }
```

## The Base Object

The EventModel has an optional second parameter that denotes the root or base object. 
This will default to the document object. The base element is usually an HTMLElement; however,
it can be any object that implements querySelectorAll() accepting a query string and returning 
an array-like object of EventTargets.

For example, you can bind to only the first form element on the page:

```javascript
var model = new EventModel({ /* View Model */ }, document.querySelector('form'));
```

## The Base Selector

Most selectors in the view model are simply CSS-style query selectors; however,
you can also use the 'base' keyword selector to select the base object of the model.

This will log the document object whenever a click event bubbles up:
```javascript
function ViewModel() {
	this['base'] = {
		click: function() {
			console.log(this);
		}
	}
}
```

## Custom Events

You can attach listeners for DOM events like 'click' and 'keyup;' however, you 
can also attach listeners for custom events and trigger them from the EventModel.

### Attaching Custom Events

To attach a custom event you simply give a unique identifier as a property name in the Event Group.

```javascript
function ViewModel() {
	this.base = {
		customEventName: function(event, model) {
			console.log("Custom event triggered!");
		}
	}
}
```

### Triggering Custom Events

To trigger a custom event you can call the trigger method on the EventModel.

```javascript
var model = new EventModel(new ViewModel());
model.bind():

model.trigger('customEventName');

// or the shortcut method
model.customEventName();
```

Be careful in naming your custom events since trigger will trigger across all 
selections containing that event name. Selection specification may be added 
later.

Also, trigger will only trigger events that are registered in the view model.
So, if there is an event handler registered outside of the view model that you
would like to trigger with EventModel.trigger() then you need to add a placeholder in the
selector's event group.

```javascript
function ViewModel() {
	this['button'] = {
		click: function() { /* model.click() is now available! */ }
	}
}
```

### Event Data

Passing data to and retrieving data from custom events can be done using the trigger method of
the EventModel.

```javascript
function ViewModel() {
	this['input'] = {
		getdata: function(event, model) {
			return this.value;
		},
		setdata: function(event, model) {
			this.value = event.data[this.name];
		}
	}
}

var model = new EventModel(new ViewModel());
model.bind();

var data = model.getdata(); // or model.trigger("getdata");
model.setdata({ "firstname": "Cory", "lastname": "Cook" }); // or model.trigger("setdata", { ... });
```

Data will be set to an array containing the values of all inputs on the page and then the
inputs with name "firstname" and "lastname" will be set to "Cory" and "Cook" respectively. 

Event data is passed by reference so any changes that happen in the handlers will be reflected
in the original objects. You can use this fact to get output from the event handlers in a different way.

For example, this can simplify form serialization:
```javascript
function ViewModel() {
	this['input'] = {
		getdata: function(event, model) {
			event.data[this.name] = this.value;
		}
	}
}

var model = new EventModel(new ViewModel());
model.bind();

var data = { };
model.getdata(data); // or model.trigger("getdata", data);
```

Data will be an object with property names matching the input elements names.

## Sub Models (Components)

Sub Models (Components) are EventModel instances that can take the place of Event Groups in the view model.
Also called components since they compartmentalize behavior according to target components and their 
ancestors.

```javascript
function ViewModel() {
	
	function SubViewModel() {
		this.base = {
			submit: function(event, model) {
				var data = { };
				model.getdata(data);
				console.log(data);
				event.preventDefault();
			}
		};
		this['input'] = {
			getdata: function(event, model) {
				event.data[this.name] = this.value;
			}
		};
	}
	
	this['form'] = new EventModel(new SubViewModel());
	
}

var model = new EventModel(new ViewModel());
model.bind();
```

Each form on the page will log the form data when the form is submit. 
Each form is attached to its own model and is separate from the other form models on the page.

## Sub Models And Event Groups

You can use an array to combine Event Groups and Sub Models for a single selector.

## The Bound Event

The bound event is triggered on the EventModel when EventModel.bind() has completed.

This can be used to do any necessary setup when the model first attaches.

```javascript
function ViewModel() {
	this['form'] = [
		new EventModel({
			bound: function(event, model) {
				this.model = model;
			}
		}),
		{
			getSubModels: function() {
				return this.model;
			}
		}
	];
}
```

Here, getSubModels will return an array of the sub models attached to each of the form elements.

## Delegated Handlers

All of the event handlers thus far are attached when EventModel.bind() is called. 
To handle dynamic elements you should use delegated event handlers.

Use a semicolon in the selector to separate two selectors:
1. The delegated static element that will capture the event
2. The target element that you are listening for

```javascript
function ViewModel() {
	this['tbody;tr'] = {
	};
}
```

## Delegated Sub Models
