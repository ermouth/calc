/*
 * ermouth.calc interpolator 1.3
 * 
 * (c) ermouth
 * 
 * Requires SugarJS 1.4.~
 * 
 */
(function(global){
	var calc,
		isA = Object.isArray,
		isB = Object.isBoolean,
		isS = Object.isString,
		isO = Object.isObject,
		isN = Object.isNumber,
		isR = Object.isRegExp,
		isF = Object.isFunction;
	
	if (!global.calc) global.calc = calc = {
		gen: function(data, bounds) {
			// Returns interpolator function of (x,y).
			// data is array of fixed points in xyz space, formed like a table of values of z(x,y) function
			// where x and y grows monotonically by columns and rows
			// [
			//   [.1,	0,	100		], //here .1 is precision, 0 and 100 x coordinates of fixed points
			//   [0,	1,	10		], //here 0 is y coordinate of values and 1,10 is values of z(0,0) and z(100,0)
			//   [10,	10,	1000	], //here 10 is y coordinate of values and 10,1000 is values of z(0,10) and z(100,10)
			//   [20,	20,	1500	]  //here 20 is y coordinate of values and 20,1500 is values of z(0,0) and z(100,0)
			// ]

			// x and|or y can be string – this case appropriate axis will make no
			// interpolation, approprite column/row/value will be fetched by index
			// calc.make ([[1,"a","b"],[0,0,500],[10,100,1000]])("b",5) will return 750

			// bounds is arbitrary function of x,y which must return false if xy pair of args lays outside 
			// of required boundaries.

			// For example
			// calc.make([[1,1,10],[1,1,10],[10,10,100]], function (x,y) {return !!(x>0 && y>0)})
			// will return function of x,y, calculating rounded integer product of arguments if they both are >0 or null otherwise


			if (!isA(data) || !data.length) return null;

			var a = data.slice(0), xc = a[0].length, yc = a.length, i, r, ok;
			var ax = a[0].slice(1).join("ᴥ").split("ᴥ"), 
					ay = a.map(function(e){
						return e[0]
					})
					.slice(1)
					.join("ᴥ")
					.split("ᴥ");
			for (i=1; i<yc; i++) if (a[i].length < xc) return null;

			if (yc<2) return null;

			//check if we have strings in axes
			//if we have, the axe is considered to be index, not range
			var xs=false, ys= false;
			for (i=1; i<xc && !xs; i++) xs = isNaN(a[0][i]);
			for (i=1; i<yc && !ys; i++) ys = isNaN(a[i][0]);	

			ok = (isF(bounds))?(bounds):function(x,y) {	
				if ((xs && ax.indexOf(x)==-1) || (ys && ay.indexOf(y)==-1)) return !1;
				var r=true;
				if (!xs && (x<a[0][1] || x>a[0][xc-1])) r=!1;
				if (r && !ys && (y<a[1][0] || y>a[yc-1][0])) r=!1;
				return r;
			};

			if (yc==2 && !ys) {a[2]=a[1].slice(0);a[2][0]+=1;yc=3}

			//generate interpolator
			var f = function InterpolateZ (x0,y0) {
				var x = xs?String(x0):(Number(x0)||0), 
						y = ys?String(y0):(Number(y0)||0), 
						r ,i, j, n, xi, yi,
						ai=[];
				if (!ok(x,y)) return null;

				r = [[Number(a[0][0])||0],[],[]], xi=0, yi = 0;

				if (xs && ys) {
					//get by index
					i = ax.indexOf(x); j = ay.indexOf(y); if (j==-1 || i==-1) return null;
					n = a[j+1][i+1];
					if (isNaN(n)) return null;
					return r[0][0]?r[0][0]*Math.round(n/r[0][0]):n;

				}

				if (!xs) { // x is range
					for (i=1; i<xc-1; i++) {
						if ( (x>=a[0][i] && x<= a[0][i+1]) ||
								(i==1 && x<a[0][1]) || 
								(i==xc-2 && x>a[0][xc-1])
							 ) {
							r[0][1]=a[0][i];
							r[0][2]=a[0][i+1];
							xi=i;
						}
					}
				} else { //x is string index
					xi= ax.indexOf(x)+1;
					r[0][1]=1;r[0][2]=2;
				}
				if (xi>0) {
					if (!ys) { //y is range
						for (i=1; i<yc-1; i++) {
							if ((y>=a[i][0] && y<= a[i+1][0]) ||
									(i==1 && y<a[1][0]) || 
									(i==yc-2 && y>a[yc-1][0])	
								 ) {
								j = !!(xc-xi==1);
								ai=a[i]; r[1]=[ai[0],ai[xi],(j?ai[xi]+1:ai[xi+1])];
								ai=a[i+1]; r[2]=[ai[0],ai[xi],(j?ai[xi]+1:ai[xi+1])];
								yi=i;
							} 					
						}
					} else {
						i = ay.indexOf(y)+1;
						ai=a[i];
						r[1]=[1,ai[xi],ai[xi+1]]; 
						r[2]=[2,ai[xi],ai[xi+1]];
						yi=i;
					}
					if (yi>0) {
						x=xs?1:x;y=ys?1:y;

						var r0=r[0],r1=r[1],r2=r[2],p11=r1[1],p21=r2[1],y1=r1[0],y2=r2[0]; 
						var p3=r0[2]-r0[1],p4=y2-y1,p12=r1[2]-r1[1],p22=r2[2]-r2[1],x1=x-r0[1];
						n = (p11+x1*p12/p3)*(1-(y-y1)/p4)+(p21+x1*p22/p3)*(1-(y2-y)/p4);

						if (isNaN(n)) return null;
						return r0[0]?r0[0]*Math.round(n/r0[0]):n;
					}
				}
				return null;
			}
			return f;
		},
		tiles: function (x0,y0,px,py, gap) {
			// tiles area px*py with x*y bars with gaps around each bar
			// return count of bars
			var add = gap||0, x=1*x0+add, y=1*y0+add;
			function f(x) {return Math.floor(x);}
			return Math.max( f(py/y)*f(px/x), f(px/y)*f(py/x) );
		},
		min: function (x,y,flist) {
			return Object.keys(flist).map(function(e){return flist[e](x, y)}).compact().min();
		},
		minkey: function (x,y,flist) {
			var min = 1e50, key=null;
			for (var i in flist) {
				var v = flist[i](x,y);
				if (v!=null && v< min) {key=i;min=v}
			}
			return key;
		},

		report:function (order, data, precision) {
			// returns calculated report as array of lines
			// {type:"production", desc:"Total taxes to pay", v:%value% or null, e:"" or error msg},
			// from command list supplied with order and data supplied with data
			// order may be crlf-separated string or array
			// each row of order can be presented as 
			// {type:"production", fn:'123 + qty_size(qty, size)', desc:"Total taxes to pay"},
			// or, shorter, 
			// ["tax",'%10','Total taxes to pay']
			// or even much shorter, if formula has no spaces inside
			// 'tax qty*price1*0.15 Total taxes to pay'.
			// 
			// Last formula will calculate data.qty * data.price1 * 0.15,
			// variables in the formula are fields of data object

			var report = {total:0, rows:[], errors:[], budget:[]}, rows = order, d = data||{}
			,prec = (isNaN(precision)?2:Number(precision)), total = 0, backp = 0, subtotal = 0, backok = true, budget = {}
			,row, rowe, rowv, fn_, r_, ri, rt, rc, i, j, e, v;	
			if (isS(order)) rows=order.lines().compact();
			if (!isA(rows) || !rows.length || !isO(data)) return {total:null, rows:[], errors:["Invalid data"]};


			//counting subtotal
			for (i=0; i<rows.length; i++) {
				ri = rows[i], row = null;
				if (isS(ri)) ri = ri.compact().split(" ")
				//traverse array
				if (isA(ri) && ri.length>1) {	
					r_ = undefined; rc = ri[1].compact();
					fn_ = "("+rc.replace(/(^%)|(%$)/g,"")+")";

					try {with (d) {r_ = eval(fn_)}} 
					catch (e) {}

					if (isN(r_)) { //null or number
						if (!isNaN(r_)) {
							if (/^%/.test(rc)) {} 
							else if (/%$/g.test(rc)) {subtotal += subtotal*(Number(r_)/100)} 
							else {subtotal += Number(r_)}
						} 
					} 
				}
			}

			//counting back percents
			for (i=0; i<rows.length; i++) {
				ri = rows[i], row = null;
				if (isS(ri)) ri = ri.compact().split(" ")
				if (isA(ri) && ri.length>1) {	
					r_ = undefined; rc = ri[1].compact();
					fn_ = "("+rc.replace(/^%|%$/g,"")+")";
					try {with (d) {r_ = eval(fn_)}} 
					catch (e) {}
					if (isN(r_) && /^%/.test(rc)) backp += Number(r_);
				}
			}
			if (backp>=100) backok = false;
			else subtotal = subtotal/(1-(backp/100));

			//counting final		
			for (i=0; i<rows.length; i++) {
				ri = rows[i], row = null;
				if (isS(ri)) ri = ri.compact().split(" ")
				//traverse array
				if (isA(ri) && ri.length>1) {	
					row={type:ri[0].compact(),desc:ri.slice(2).join(" "),e:"", v:null};
					r_ = undefined; 
					rc = ri[1].compact();
					fn_ = "("+rc.replace(/^%|%$/g,"")+")";

					try {with (d) {r_ = eval(fn_)}} 
					catch (e) {row.e = e.message}

					if (isN(r_)) { //null or number
						if (!isNaN(r_)) {
							if (/^%/.test(rc)) {
								if (backok) {
									row.v = subtotal*(Number(r_)/100);
								} else {
									row.v = "?"; row.e = "Back % sum must be less than 100%"
								}
							} 
							else if (/%$/.test(rc)) {row.v = report.total*(Number(r_)/100)} 
							else {row.v = Number(r_)}
							if (row.v!="?") { 
								row.v = row.v.round(prec);
								report.total+=row.v;
							}
						} else {row.v = "?";row.e = "null or NaN"}
					} else {
						if (r_!==undefined) row.v = r_+"";
						else {row.v = "?"; row.e = row.e||"error in params";}
					}
					report.rows[i] = row;
				}
			}
			//errors
			for (var i in report.rows) if (report.rows[i].e) report.errors.push("Line "+i+": "+report.rows[i].e);
			//budget
			for (var i in report.rows) {
				var row = report.rows[i];
				if (!row.e && !isNaN(row.v)) {
					if (!budget[row.type]) budget[row.type] = 0;
					budget[row.type]+=Number(row.v);
				}
			};
			for (var i in budget) {report.budget.push({type:i,v:budget[i],e:"",desc:""})};
			report.budget=report.budget.sortBy(function(elt){return elt.type});
			return report;
		},

		html: function (rows, template) {
			var html = "",
					tmpl = template ||
					'<div><span class="w100 dib">{type}:</span> {v} '+
					'<span class="fs85">{desc}</span> <span class="red fs90">{e}</span></div>';
			for (var i=0; i<rows.length; i++) html+=tmpl.assign(rows[i]);
			return html;
		}
	};
})(window);
