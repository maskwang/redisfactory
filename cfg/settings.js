
module.exports = {
	servers : {
		svr01 : {
			host: 'redis1.xxx',
		    port: 6379
		}
	},
	
	providers : {
		'example' : {
			server : 'svr01'
		}
	}
};