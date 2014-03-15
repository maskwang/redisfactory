var redis = require('redisfactory');

redis.setSettings({
	servers : {
		svr01 : {
			host: '172.16.2.1',
		    port: 6379
		}
	},
	
	providers : {
		'example' : {
			server : ['svr01', 'svr02']
		}
	}
});

redis('example', function(err, client) {
	console.log(err);
	if(!err) {
		client.set('Love It1', 'Love It2', function(err) {
			console.log(err);
			if(!err) {
				client.get('Love It1', function(err, data) {
					console.log(err);
					console.log(data);
				});
			}
		});
	}
});

