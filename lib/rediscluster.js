var commands = require('./rediscommands');

var hash = function(str) {
	var hash = 0;
	if(str)
	{
		for (var i = 0; i < str.length; i++)
		{
			hash = hash * 31 + str.charCodeAt(i);
			hash = hash & hash;
		}
	}
	return hash < 0 ? -hash : hash;
};

function RedisCluster(redisfactory, servers) {
	this.redisfactory = redisfactory;
	this.servers = servers;
}

for(var i in commands){
	(function(name){
		RedisCluster.prototype[name] = function(){
			var args = arguments;
			if(args.length > 1) {
				var partitionKey = hash(args[0]) % this.servers.length;
				this.redisfactory(this.servers[partitionKey], function(err, client){
					if(err) {
						// invoke callback if the last parameter is callback function.
						var cb = args[args.length-1];
						if(toString.call(cb) === '[object Function]') {
							cb(err,client);
						}
					}else{
						client[name].apply(client, args);
					}
				});
			}
		};
	})(commands[i]);
}

module.exports = function(redisfactory, servers, cb) {
	cb(0,new RedisCluster(redisfactory, servers));
};
