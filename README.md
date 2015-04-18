# calc.js
Interpolates intermediate values of z(x,y) using pre-defined grid of values. Creates facet of bi-linear forms using set of known z values at (x,y) grid.

Requires SugarJS. Usage `<script src="calc-1.2.js"></script>`

## What is it?
Sometimes you know only several values of dependency z(x,y) and need to estimate values inbetween. For example, you know that 500 copies of 24-page magazine is $741, 1000 copies is $995, and for 64 pages prices are $1643 and $2216. Prices are real and taken from [here](http://www.heidelprint.com/CatalogPrinting_MagazinePrinting_InstantQuote.php). 

You need price for 32 pages and 700 copies.

```javascript
var fprice = calc.gen(
  [// ↓ precision 
    [ 0.5,   24,    64],
    [ 100,   741,   1643],
    [ 1000,  995,   2216]
  ]
);
// Now fprice is ready-to-use interpolator function.

console.log(fprice(32, 700)); // Prints 1133.5
```
Calculator at real site gives us $1124, less then 1% difference.

Another example. Air transport of 100kg and 250kg freight from Moscow to London is ~$1030 and $2570, distance is 2500km. Same freights from Moscow to Oslo – $980 and $2480, 1600km. Prices taken from [here](http://worldfreightrates.com/en/freight).

How about 180kg freight from Moscow to Amsterdam (2150km)?
```javascript
var fprice = calc.gen(
  [// ↓ precision 
    [ 10,     100,   250],
    [ 1600,   980,   2480],
    [ 2500,   1030,  2570]
  ]
);
console.log(fprice(180, 2150)); // Prints 1820
```
Site gives average price $1815,5.

If out-of-bounds x and y passed, `null` is returned.

## Big grids and bounding function
Grids can be larger then 3×3 – so interpolation space become picewise linear. 
The only restriction – both axes must monotonically increase.

Also you can pass bounding function as a second argument. Bounding function allows to extend arguments’ range out of 
grid bounds. Function must return `false` if pair is invalid.
```javascript
// Multiplication for non-negatives, 
// rounds result to integers
var intmul = calc.gen(
  [[1,0,1],[0,0,0],[1,0,1]],
  function (x,y) { return x>=0 && y>=0 }
);
console.log(intmul (15, 11.5)); // Prints 173
console.log(intmul (5, 8));     // Prints 40
console.log(intmul (-5, 8));    // Prints null
```
## Other stuff
There are several other members of `calc`. They are documented right inside source code.

---

© 2015 ermouth. CoverCouch is MIT-licensed.
