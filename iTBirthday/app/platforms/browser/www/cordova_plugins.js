cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/com.phonegap.plugins.facebookconnect/facebookConnectPlugin.js",
        "id": "com.phonegap.plugins.facebookconnect.FacebookConnectPlugin",
        "pluginId": "com.phonegap.plugins.facebookconnect",
        "clobbers": [
            "facebookConnectPlugin"
        ]
    },
    {
        "file": "plugins/ionic-plugin-keyboard/www/browser/keyboard.js",
        "id": "ionic-plugin-keyboard.keyboard",
        "pluginId": "ionic-plugin-keyboard",
        "clobbers": [
            "cordova.plugins.Keyboard"
        ],
        "runs": true
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "com.phonegap.plugins.facebookconnect": "1.0.1.1",
    "cordova-plugin-whitelist": "1.2.2",
    "ionic-plugin-keyboard": "2.2.0"
}
// BOTTOM OF METADATA
});