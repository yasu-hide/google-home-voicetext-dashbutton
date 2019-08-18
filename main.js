'use strict'
const dashbutton = require('node-dash-button');
const fs = require('fs');
const request = require('request-promise');
const dashlistfile = "/tmp/dashbutton.json"

const loadfile = (filename) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf-8', (err, data) => {
            if (err) {
                return reject(err);
            }
            let js;
            try {
                js = JSON.parse(data);
            } catch (err) {
                reject(err);
            }
            if(!js || js === "") {
                return reject(new SyntaxError(filename + ": invalid format."))
            }
            console.log(filename + " file loaded.");

            console.log("awaiting", Object.keys(js));
            const dash = dashbutton(Object.keys(js), null, null, 'all');
            dash.on('detected', (macaddr) => {
                console.log("Device", macaddr, "was detected.");
                const message = js[macaddr]["message"];
                let servers = js[macaddr]["servers"];
                if(!message) {
                    return reject(new SyntaxError(macaddr + " " + "message required."));
                }
                if(!servers) {
                    return reject(new SyntaxError(macaddr + " " + "servers required."));
                }
                else if(typeof servers === 'string') {
                    servers = [ servers ];
                }
                servers.forEach((urlstr) => {
                    console.log("Request to", urlstr);
                    request({
                        url: urlstr,
                        method: 'POST',
                        form: {
                            'text': message,
                            'speaker': js[macaddr]["speaker"] || 'hikari',
                            'emotion': js[macaddr]["emotion"] || 'happiness',
                            'emotion_level': js[macaddr]["emotion_level"] || 'normal'
                        }
                    }).then((res) => {
                        console.log(res);
                    }).catch((err) => console.error(err));
                });
            });
            resolve(dash);
        });
    });
};

loadfile(dashlistfile).catch((err) => console.error(err));