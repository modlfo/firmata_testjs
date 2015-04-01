var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var ipc = require('ipc');

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  //if (process.platform != 'darwin')
    app.quit();
});

// This method will be called when atom-shell has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 300, height: 600});

  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});



var firmata = require('firmata');
var serialPort = require("serialport");
var global_board = null;

ipc.on('asynchronous-message', function(event, msg) {
  switch(msg.message){
    case 'get-ports':
      //console.log("Requesting ports");
      serialPort.list(function (err, ports) {
        var port_names = [];
        ports.forEach(function(port) {
          port_names.push(port.comName);
          //console.log("'"+port.comName+"'")
        });
        event.sender.send('asynchronous-reply', { message : 'get-ports', ports : port_names});
      });
      break;
    case 'connect':
      var fixed_port = msg.port.trim();
      //console.log("Requesting to connect to '"+fixed_port+"'");
      global_board = null;
      var once = true;
      global_board = new firmata.Board(fixed_port,function(){
        if(once) event.sender.send('asynchronous-reply', { message : 'connect'});
        once = false;
      });

      break;
    case 'capability-query':
      //console.log("Requesting capabilities");
      global_board.queryCapabilities(function(){
        event.sender.send('asynchronous-reply',
          {
            message : 'capability-query',
            pins    : global_board.pins
          });
      });
      break;
    case 'set-pin-mode':
      if(global_board){
        global_board.pinMode(msg.pin,msg.mode);
        event.sender.send('asynchronous-reply', { message : 'set-pin-mode', pin : msg.pin, mode : msg.mode });
      }
      break;
    case 'pin-state':
      if(global_board){
        global_board.queryPinState(msg.pin,function(){
          //console.log(global_board.pins[msg.pin]);
          event.sender.send('asynchronous-reply', { message : 'pin-state', pin : msg.pin, state : global_board.pins[msg.pin] });
        });
      }
      break;
    case 'query-value':
      if(global_board){
        if(msg.mode=="Input"){
            event.sender.send('asynchronous-reply', { message : 'query-value', pin : msg.pin, value : global_board.pins[msg.pin].value });
        }
        if(msg.mode=="Analog"){
            event.sender.send('asynchronous-reply', { message : 'query-value', pin : msg.pin, value : global_board.pins[msg.pin].value });
        }
      }
      break;
    case 'set-value':
      if(global_board){
        if(msg.mode=="Output"){
          global_board.digitalWrite(msg.pin,msg.value);
        }
      }
      if(global_board){
        if(msg.mode=="PWM" || msg.mode=="Servo"){
          global_board.analogWrite(msg.pin,msg.value);
        }
      }
      event.sender.send('asynchronous-reply', { message : 'set-value', pin : msg.pin});
      break;

  }
});