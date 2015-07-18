# EventModel
A JavaScript library to model bind DOM Elements and Event Listeners

##EventModel
```javascript
(function() {
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
}());
```

The model object properties match properties in the target model. Each property in the model is an event that will be bound to the corresponding object in the target model.
