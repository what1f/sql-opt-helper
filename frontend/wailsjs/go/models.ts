export namespace backend {
	
	export class Config {
	    driver: string;
	    path: string;
	    username: string;
	    password: string;
	    database: string;
	    threads: number[];
	    iterations: number;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.driver = source["driver"];
	        this.path = source["path"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.database = source["database"];
	        this.threads = source["threads"];
	        this.iterations = source["iterations"];
	    }
	}
	export class Result {
	    threads: number;
	    max: number;
	    min: number;
	    avg: number;
	    p95: number;
	    p99: number;
	
	    static createFrom(source: any = {}) {
	        return new Result(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.threads = source["threads"];
	        this.max = source["max"];
	        this.min = source["min"];
	        this.avg = source["avg"];
	        this.p95 = source["p95"];
	        this.p99 = source["p99"];
	    }
	}

}

