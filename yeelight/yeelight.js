module.exports = function(RED) {
    "use strict";
    var Yeelight = require("yeelight2")

    const scenes = {
        "candle_flicker":["cf",0,0,"800,2,2700,50,800,2,2700,30,1600,2,2700,80,800,2,2700,60,1200,2,2700,90,2400,2,2700,50,1200,2,2700,80,800,2,2700,60,400,2,2700,70"],
        "sunrise" :["cf",3,1,"50,1,16731392,1,360000,2,1700,10,540000,2,2700,100"],
        "sunset" :["cf",3,2,"50,2,2700,10,180000,2,1700,5,420000,1,16731136,1"],
        "romantic_lights" :["cf",0,1,"4000,1,5838189,1,4000,1,6689834,1"],
        "happy_birthday" :["cf",0,1,"1996,1,14438425,80,1996,1,14448670,80,1996,1,11153940,80"],
        "notification" :["cf",4,0,"800,2,5000,100,800,2,5000,10,800,2,50000,100,800,2,5000,10"]
    }

    function YeelightConnection(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        if(this.credentials &&
            this.credentials.hostname && this.credentials.portnum){


            setTimeout(
             (function(self) {
                 return function() {
                        self.setupConnection.apply(self, arguments);
                    }
             })(this), 1000
            );
        }

        this.on('close', function() {
            this.light.exit();
        });

        this.connected = function(){
            console.log("connected to lamp")
            node.status({fill:"green",shape:"ring",text:"Connected"});
        }
        this.setupConnection = function(){
            this.light = Yeelight(node.credentials.hostname,node.credentials.portnum);
            if(this.light){
                node.light = this.light;
            }
            this.light.on('error',function(err){
                console.log("Yeelight error",err)
                node.status({fill:"red",shape:"ring",text:err});
                node.light = null;
                node.error(err);
                // try to reconnect in 10 seconds
                setTimeout(
                 (function(self) {
                     return function() {
                            node.setupConnection.apply(self, arguments);
                        }
                 })(this), 1000*2
                );
            })
        }

    }

    RED.nodes.registerType("yeelight-config",YeelightConnection,{
        credentials: {
            hostname: { type:"text" },
            portnum: { type:"text" }
        }
    });



    function YeelightNode(n) {
        RED.nodes.createNode(this,n);
        this.config = RED.nodes.getNode(n.config);
        this.command = n.command

        var node = this;

        node.status({});

        var msg = {};
        this.send(msg);

        this.on('input', function (msg) {
            try {
                var cmd = this.command
                this.light = this.config ? this.config.light : null;
                const promise = cmd === 'set_scene'
                    ? this.light.set_scene.apply(this.light, scenes[msg.payload])
                    : this.light[cmd](msg.payload)
                promise.then(function(response) {
                    msg.payload = response;
                    node.send(msg);
                }).catch((err) => {
                    node.status({fill:"red",shape:"ring",text:err});
                    node.error(err)
                });
                node.status({fill:"green",shape:"ring",text:"Connected"});
            } catch(err) {
                node.status({fill:"red",shape:"ring",text:err});
                node.error(err)
            }
        });
        this.on("close", function() {

        });
    }

    RED.nodes.registerType("yeelight",YeelightNode);

}
