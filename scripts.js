


var myApp = angular.module('Firmata', []);


var ipc = require('ipc');
ipc.send('asynchronous-message', { message : 'get-ports'});


ipc.on('asynchronous-reply', function(msg) {
    var scope = angular.element(document.getElementById('datadiv')).scope();
    switch(msg.message){
        case 'get-ports':
            scope.$apply(function() { scope.setPorts(msg.ports); });
            break;
        case 'connect':
            //console.log("Got connected");
            ipc.send('asynchronous-message', { message : 'capability-query'});
            ipc.send('asynchronous-message', { message : 'analog-mapping-query'});
            break;
        case 'capability-query':
            //console.log("Got capabilities");
            scope.$apply(function() { scope.setPins(msg.pins); });
            setInterval(function(){
                scope.queryValues();
            },33);
            break;
        case 'set-pin-mode':
            break;
        case 'pin-state':
            scope.$apply(function() { scope.setPinState(msg.pin,msg.state); });
            break;
        case 'query-value':
            scope.$apply(function() { scope.setValuePin(msg.pin,msg.value); });
        case 'set-value':
            break;
    }
});


myApp.controller('PeopleController', ['$scope', function($scope){
    $scope.pins=[];
    $scope.ports=[];
    $scope.port=null;
    $scope.values=[];
    $scope.modeName=[
      "Input",
      "Output",
      "Analog",
      "PWM",
      "Servo",
      "I2C",
      "OneWire",
      "Stepper",
      "Encoder"
    ];
    $scope.modeNumber ={
        Input  : 0,
        Output : 1,
        Analog : 2,
        PWM    : 3,
        Servo  : 4,
        I2C    : 5,
        OneWire: 6,
        Stepper: 7,
        Encoder: 8
    }

    $scope.setPorts = function(ports){
        $scope.ports = ports;
    };
    $scope.selectPort = function(){
        ipc.send('asynchronous-message', { message : 'connect', port : $scope.port });
        //console.log($scope.port);
    };
    $scope.setPinMode = function(pin) {
        //console.log("Pin number "+pin+" and mode "+($scope.pins[pin].mode));
        ipc.send('asynchronous-message', { message : 'set-pin-mode', pin:pin, mode:$scope.modeNumber[$scope.pins[pin].mode] });
    };
    $scope.setValuePin = function(pin,value){
        $scope.values[pin] = value;
    };

    $scope.queryValues = function(){
        for(var i=0;i<$scope.pins.length;i=i+1){
            var mode = $scope.pins[i].mode;
            if(mode=="Input" || mode=="Analog"){
                ipc.send('asynchronous-message', { message : 'query-value', pin:i, mode: mode });
            }
        }
    };

    $scope.isReadOnly = function(pin) {
        var mode = $scope.pins[pin].mode;
        if(mode=="Input" || mode=="Analog") return 1;
        else return 0;
    };

    $scope.isShowHide = function(pin,kind) {
        var mode = $scope.pins[pin].mode;
        if(mode=="Input"  && kind=="checkbox") return 1;
        if(mode=="Output" && kind=="checkbox") return 1;
        if(mode=="Servo"  && kind=="range") return 1;
        if(mode=="PWM"    && kind=="range") return 1;
        if(mode=="Analog" && kind=="text") return 1;
        return 0;
    };

    $scope.pinOnOff = function(pin) {
        if($scope.pins[pin].value!=0) return 1;
        else return 0;
    };

    $scope.getMargin = function(pin){
        var mode = $scope.pins[pin].mode;
        if(mode=="Input" || mode=="Output") return "50px";
        else return "20px";
    };

    $scope.getWidth = function(pin){
        var mode = $scope.pins[pin].mode;
        if(mode=="Input" || mode=="Output") return "50px";
        else return "80px";
    };

    $scope.setValue = function(pin){
        //console.log("Setting pin "+pin+" to "+$scope.values[pin]);
        ipc.send('asynchronous-message', { message : 'set-value', pin:pin, value: $scope.values[pin], mode : $scope.pins[pin].mode });
    };

    $scope.setPins = function(pins) {
        $scope.pins = pins;
        for(var i=0;i<pins.length;i=i+1){
            ipc.send('asynchronous-message', { message : 'pin-state', pin:i });
        }
    };

    $scope.setPinState = function(pin,state){
        $scope.pins[pin].mode=$scope.modeName[state.mode];
        $scope.pins[pin].value=state.value;
    };

}]);
