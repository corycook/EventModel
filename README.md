# EventModel
A JavaScript library to model bind DOM Elements and Event Listeners

##EventModel
```javascript
var model = {
  object: {
    click: function(event) {
      console.log("Item clicked!");
    }
  }
};

function targetModel() {
  this.object = document.getElementById("targetElement");
};

var eventModel = new EventModel(model);

eventModel.attach(new targetModel());
```

The model object properties match properties in the target model. Each property in the model is an event that will be bound to the corresponding object in the target model.

##SelectorEventModel

```javascript
var model = {
  "#targetElement": {
    click: function(event) {
      event.model.trigger("show", this.value);
    },
    change: function (event) {
      event.model.show(this.value);
    }
  },
  ".output" {
    show: function(event) {
      this.innerText = event.data;
    }
  }
};

var eventModel = new SelectorEventModel(model);

eventModel.attach(document);
```

The SelectorEventModel will query the target (anything that implements querySelectorAll) for objects to attach to.

The example above also shows other features:
  1. event.model points to the containing model instance
  2. custom events can be triggered with either the trigger method passing the name of the event or using the property on the model corresponding to the event name (assuming there is no name collision: enumerate, pushmodel, attach, trigger, model, and targets are reserved)
  3. event.data is the value passed to the trigger method for custom events

##Examples
###combobox.html
This example shows how to use the SelectorEventModel to create a simple combobox. 
