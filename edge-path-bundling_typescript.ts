// generates bezier control points based on the edge-path bundling algorithm
  generateBezierControlPoints(k: number = 2, d: number = 2) {
    this.generateHelperEdges();

    const graph = this.renderer.getGraph();
    const edgeKeys = this.renderer.getGraph().edges();
    const skip : {edgeKey: string, source: string, target: string, attributes: Attributes}[] = [];

    edgeKeys.forEach(key => {
      graph.setEdgeAttribute(key, "bezeierControlPoints", []);
      const edgeAttribs = graph.getEdgeAttributes(key);

      graph.setEdgeAttribute(key, "skip", false);
      graph.setEdgeAttribute(key, "lock", false);
      
      // retriving & calculating necessary data
      const source = edgeAttribs.source;
      const target = edgeAttribs.target;

      const sx = graph.getNodeAttribute(source, "x");
      const sy = graph.getNodeAttribute(source, "y");

      const tx = graph.getNodeAttribute(target, "x");
      const ty = graph.getNodeAttribute(target, "y");

      const dx = tx - sx;
      const dy = ty - sy;
      const len = (dx * dx + dy * dy) ** (1/2);

      graph.setEdgeAttribute(key, "len", len);
      graph.setEdgeAttribute(key, "weight", len ** d);
    });

    edgeKeys.sort((a, b) => graph.getEdgeAttribute(b, "weight") - graph.getEdgeAttribute(a, "weight")); // sorting edgeKeys by weight descending

    edgeKeys.forEach(edgeKey => {
      const edge = graph.getEdgeAttributes(edgeKey);
      if (edge.lock) {
        return;
      }
      graph.setEdgeAttribute(edgeKey, "skip", true);

      const source = edge.source;
      const target = edge.target;

      skip.push({edgeKey: edgeKey, source: source, target: target, attributes: graph.getEdgeAttributes(edgeKey)});
      skip.forEach(edgeDict => {
        graph.dropEdge(edgeDict.edgeKey);
      })
      const nodePath = dijkstra.bidirectional(graph, source, target, "weight");
      // restore edges dropped for skip
      skip.forEach(edgeDict => {
        this.addEdgeFromSkip(edgeDict);
      })

      let path = null;
      if(nodePath != null) {
        path = edgePathFromNodePath(graph, nodePath);
      }

      if (path === null) {
        graph.setEdgeAttribute(edgeKey, "skip", false);
        skip.pop();
        return;
      }
      if (this.pathLength(path) > k * edge.len) {
        graph.setEdgeAttribute(edgeKey, "skip", false);
        skip.pop();
        return;
      }
      
      path.forEach(pathEdge => {
        graph.setEdgeAttribute(pathEdge, "lock", true);
      })
      
      const nodeExtent = graphExtent(graph);
      const normalizationFunction = createNormalizationFunction(nodeExtent); 

      // get vertecies of path
      const vertices: number[]= [];
      nodePath.forEach(pathNode => {
        const norm_xy: Coordinates = { x: graph.getNodeAttribute(pathNode, "x"), y: graph.getNodeAttribute(pathNode, "y") };
        normalizationFunction.applyTo(norm_xy);
        vertices.push(norm_xy.x , norm_xy.y);
      })

      graph.setEdgeAttribute(edgeKey, "bezeierControlPoints", vertices);
    });


    this.dropHelperEdges();
  }

  addEdgeFromSkip(edgeDict: {edgeKey: string, source: string, target: string, attributes: Attributes}): void {
    const graph = this.renderer.getGraph();
    graph.addEdgeWithKey(edgeDict.edgeKey, edgeDict.source, edgeDict.target, edgeDict.attributes);
  }

  pathLength(path: string[]): number {
    let path_len = 0;
    path.forEach(edgeKey => {
      path_len += this.renderer.getGraph().getEdgeAttribute(edgeKey, "len");
    })
    return path_len;
  }
