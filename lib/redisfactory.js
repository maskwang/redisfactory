var redis = require('redis'),
	settings = require('../cfg/settings'),
	rediscluster = require('./rediscluster'),
	connections = {},
	connectionWaitings = {};

var redisfactory = function(server, cb) {
	// Get connection from pool first.
	if( connections[server] ) {
		cb(false,connections[server]);
	}else if( connectionWaitings[server] ) {
		// If waiting list is already there. add callback into it
		connectionWaitings[server].push(cb);
	}else{
		// Prepare waiting list.
		connectionWaitings[server] = [cb];
		
		// Connect server and cache connection.
		var svrSetting = settings.servers[server];
		if(redis.createClient) {
		    var client = redis.createClient(svrSetting.port, svrSetting.host);
		    
		    client.on('ready', function(){
		    	
		    	console.log('Redis Ready : ' + server);
		    	
		    	connections[server] = client;
		    	
		    	// Get the waiting list.
		    	var waitingList = connectionWaitings[server];
		    	
		    	// Clear waiting list first. avoid crashing in callback.
		    	connectionWaitings[server] = undefined;
		    	
		    	// Callback when ready.
		    	for(var key in waitingList ) {
		    		waitingList[key](0,client);
		    	}
		    });
		    
		    client.on('error', function(){
		    	console.error.apply(console, arguments);
		    	if( connections[server] === client ) {
		    		connections[server] = undefined;
		    	}
		    	
		    	// Get the waiting list.
		    	var waitingList = connectionWaitings[server];
		    	
		    	// Clear waiting list first. avoid crashing in callback.
		    	connectionWaitings[server] = undefined;
		    	
		    	// Callback when error.
		    	for(var key in waitingList ) {
		    		waitingList[key](arguments[0]);
		    	}
		    });
		    
		    client.on('end', function(){
		    	console.log.apply(console, arguments);
		    	if( connections[server] === client ) {
		    		connections[server] = undefined;
		    	}
		    });
		}
	}
};

module.exports = function(name, partitionkey, cb) {
	//TODO : Support partition
	if(toString.call(partitionkey) === '[object Function]') {
		cb = partitionkey;
		partitionkey = undefined;
	}
	
	var providerSetting = settings.providers[name]?settings.providers[name]:settings.providers['*'];
	if(providerSetting) {
		if( toString.call(providerSetting.server) === '[object Array]' ) {
			rediscluster(redisfactory,providerSetting.server,cb);
		}else{
			redisfactory(providerSetting.server,cb);
		}
	}else{
		cb(true,'Connection Setting Not Found');
	}
};

module.exports.setSettings = function(stgs) {
	settings = stgs;
	return module.exports;
};
