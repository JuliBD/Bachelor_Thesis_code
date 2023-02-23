// bezier functions:
  fact(n: number): number {
    var result = 1;
    for(var i = 2; i <=n; ++i) {
      result *= i;
    }
    return result;
  }
 
  comb(n: number, k: number): number {
    const fact = this.fact;
    return fact(n) / (fact(k) * fact(n-k))
  }

  get_bezier_curve(points: Array<Array<number>>): Function {
    const n = points.length - 1;

    return (t: number): Array<number> => {
      var sum_x = 0;
      var sum_y = 0;

      for(var i = 0; i <= n; ++i) {
        sum_x += this.comb(n,i) * t ** i * (1-t) ** (n-i) * points[i][0]
        sum_y += this.comb(n,i) * t ** i * (1-t) ** (n-i) * points[i][1]
      }
      return [sum_x, sum_y];
    }
  }

  // input: control points, number of samples
  // returns: [[x1,y1],...[xn,yn]] points along the curve
  evaluate_bezier(points: Array<Array<number>>, total: number): Array<Array<number>> {
    const n = total -1;
    var bezier = this.get_bezier_curve(points);
    var new_points = [];
    
    for(var i = 0; i <= n; i++) {
      const t = i / n;
      new_points.push(bezier(t));
    }
    return new_points;
  }
