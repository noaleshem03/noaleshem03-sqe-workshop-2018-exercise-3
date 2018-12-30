import * as esprima from 'esprima';
import * as safeeval from 'expr-eval';
const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

//---------------------------PARSING---------------------------
function parsing (codeToParse){
    let arrayRows = [];
    let body = codeToParse.body;
    let countRow = 0;
    let scope = '';
    parsingRec(arrayRows, body, countRow, scope);
    return arrayRows;
}
function parsingRec (arrayRows, body, countRow, scope){
    for (let i=0; i<body.length; i++){
        countRow++;
        countRow = parseSingle(arrayRows, body[i], countRow, scope);
    }
    return countRow;
}
function parseSingle (arrayRows, item, countRow, scope){
    if (item.type === 'VariableDeclaration')
        countRow = parseVariable (item, countRow, arrayRows, scope);
    else if (item.type === 'ExpressionStatement')
        countRow = parseAssignment(item, countRow, arrayRows, scope);
    else if (item.type === 'IfStatement')
        countRow = parseIf(arrayRows, item, countRow, scope);
    else if (item.type === 'WhileStatement')
        countRow = parseWhile(arrayRows, item, countRow, scope);
    else
        countRow = parseSingleCon(arrayRows, item, countRow, scope);
    return countRow;
}

function parseSingleCon(arrayRows, item, countRow, scope){
    if (item.type === 'ReturnStatement')
        arrayRows.push(parseReturn(item, countRow, scope));
    /*else if (item.type === 'ForStatement')
        countRow = parseFor (arrayRows, item, countRow, scope);*/
    else /*if (item.type === 'FunctionDeclaration')*/
        countRow = parseFunction(item, countRow, arrayRows, scope);
    return countRow;
}

function parseBlock(arrayRows, item, countRow, scope){
    if (item.type === 'BlockStatement')
        countRow = parsingRec(arrayRows, item.body, countRow, scope) + 1;
    else
        countRow = parseSingle(arrayRows, item, countRow+1, scope);
    return countRow;
}

function parseVariable (item, lineNum, arrayRows, scope){
    for (let j=0; j<item.declarations.length; j++){
        arrayRows.push(parseVariableTemp(item.declarations[j], lineNum, scope));
        if (item.declarations[j].init !== null)
            arrayRows.push(parseAssignmentTemp(item.declarations[j], lineNum, scope));
    }
    return lineNum;
}

function parseVariableTemp(item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'variable declaration';
    let n = '';
    if (item.type === 'VariableDeclarator')
        n = parseExpression(item.id);
    else n = parseExpression(item);
    let c = '';
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseAssignment(item, lineNum, arrayRows, scope){
    arrayRows.push(parseAssignmentTemp(item.expression, lineNum, scope));
    return lineNum;
}

function parseAssignmentTemp(item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'assignment expression';
    let n='', v='';
    if (item.type === 'VariableDeclarator'){
        n = parseExpression(item.id);
        v = parseExpression(item.init);
    }
    else if (item.type === 'AssignmentExpression'){
        n = parseExpression(item.left);
        v = parseExpression(item.right);
    }
    else{ /*if (item.type === 'UpdateExpression'){*/
        n = parseExpression(item.argument);
        v = n + item.operator;
    }
    let c = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseIf(arrayRows, item, countRow, scope){
    arrayRows.push(parseIfTemp(item, countRow, scope));
    countRow = parseBlock(arrayRows, item.consequent, countRow, scope);
    if (item.alternate !== null){
        if (item.alternate.type === 'IfStatement')
            countRow = parseElseIf(arrayRows, item.alternate, countRow+1, scope);
        else {
            countRow++;
            arrayRows.push(parseElse(countRow, scope));
            countRow = parseBlock(arrayRows, item.alternate, countRow, scope);
        }
    }
    return countRow;
}

function parseIfTemp (item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'if statement';
    let n = '';
    let c = parseExpression(item.test);
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseElseIf(arrayRows, item, countRow, scope){
    arrayRows.push(parseElseIfTemp(item, countRow, scope));
    countRow = parseBlock(arrayRows, item.consequent, countRow, scope);
    if (item.alternate !== null){
        if (item.alternate.type === 'IfStatement')
            countRow = parseElseIf(arrayRows, item.alternate, countRow+1, scope);
        else {
            countRow++;
            arrayRows.push(parseElse(countRow, scope));
            countRow = parseBlock(arrayRows, item.alternate, countRow, scope);
        }
    }
    return countRow;
}

function parseElseIfTemp (item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'else if statement';
    let n = '';
    let c = parseExpression(item.test);
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseElse (lineNum, scope){
    let l = lineNum;
    let t = scope + 'else statement';
    let n = '';
    let c = '';
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseWhile (arrayRows, item, countRow, scope){
    arrayRows.push(parseWhileTemp(item, countRow, scope));
    countRow = parseBlock(arrayRows, item.body, countRow, scope);
    return countRow;
}

function parseWhileTemp (item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'while statement';
    let n = '';
    let c = parseExpression(item.test);
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

/*
function parseFor (arrayRows, item, countRow, scope){
    arrayRows.push(parseForTemp(item, countRow, scope));
    countRow = parseBlock(arrayRows, item.body, countRow, scope);
    return countRow;
}*/

/*
function parseForTemp (item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'for statement';
    let n = '';
    let c = '';
    if (item.init.type === 'VariableDeclaration')
        c += item.init.declarations[0].id.name + '=' + item.init.declarations[0].init.value + '; ';
    else if (item.init.type === 'AssignmentExpression')
        c += parseExpression(item.init) + '; ';
    c += parseExpression(item.test) + '; ';
    c += item.update.argument.name + item.update.operator;
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}*/

function parseFunction(item, countRow, arrayRows, scope){
    scope = 'F ';
    arrayRows.push(parseFunctionTemp(item, countRow, scope));
    for (let i=0; i<item.params.length; i++){
        arrayRows.push(parseVariableTemp(item.params[i], countRow, scope));
    }
    countRow = parsingRec (arrayRows, item.body.body, countRow, scope) + 1;
    return countRow;
}

function parseFunctionTemp(item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'function declaration';
    let n = parseExpression(item.id);
    let c = '';
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseReturn(item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'return statement';
    let n = '';
    let c = '';
    let v = parseExpression(item.argument);
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseExpression(item){
    let v;
    if (item === null)
        v = '';
    else if (item.type === 'Literal')
        v = item.raw;
    else if (item.type === 'Identifier')
        v = item.name;
    /*else if (item.type === 'UnaryExpression')
        v = item.operator + parseExpression(item.argument);*/
    else
        v = parseExpressionCon(item);
    return v;
}

function parseExpressionCon(item){
    let v;
    if (item.type === 'BinaryExpression' || item.type === 'AssignmentExpression')
        v = parseExpression(item.left) + ' ' + item.operator + ' ' + parseExpression(item.right);
    else if (item.type === 'MemberExpression')
        v = parseExpression(item.object) + '[' + parseExpression(item.property) + ']';
    /*else if (item.type === 'CallExpression')
        v = parseCallExpression(item);*/
    else //if (item.type === 'ArrayExpression')
        v = parseArrayExpression (item);
    return v;
}

function parseArrayExpression (item){
    let v = '[';
    let elements = item.elements;
    for (let i=0; i<elements.length; i++){
        if (i === elements.length-1)
            v = v + parseExpression(elements[i]);
        else
            v = v + parseExpression(elements[i]) + ', ';
    }
    v = v + ']';
    return v;
}

/*
function parseCallExpression (item){
    let v;
    v = item.callee.name + ' (';
    let param = item.arguments;
    for (let i=0; i<param.length; i++){
        if (i === param.length-1) v = v + parseExpression(param[i]);
        else v = v + parseExpression(param[i]) + ', ';
    }
    v = v + ')';
    return v;
}*/

//--------------------------INPUT VECTOR--------------------------
function parseInputVector(parameters, inputVectorString){
    let i=0;
    let inputVector = [];
    let parsed = parseCode(inputVectorString);
    let item = parsed.body[0].expression;
    if (item.type === 'Literal')
        inputVector.push({name: parameters[i], value: item.value});
    else if (item.type === 'ArrayExpression')
        parseArray(inputVector, parameters, item, i);
    else /*if (item.type === 'SequenceExpression')*/
        parseSequence(inputVector, parameters, item, i);
    return inputVector;
}

function parseSequence(inputVector, parameters, item, i){
    let expressions = item.expressions;
    for (let j=0; j<expressions.length; j++){
        item = expressions[i];
        if (item.type === 'Literal'){
            inputVector.push({name: parameters[i], value: item.value});
            i++;
        }
        else{ //if (item.type === 'ArrayExpression'){
            parseArray(inputVector, parameters, item, i);
            i++;
        }
    }
}

function parseArray(inputVector, parameters, item, i){
    let temp = [];
    for (let j=0; j<item.elements.length; j++)
        temp.push(item.elements[j].value);
    inputVector.push({name: parameters[i], value: temp});
}

function getParameters (parsedArray){
    let parameters = [];
    let funcLine = 1;
    for (let i=0; i<parsedArray.length; i++) {
        let item = parsedArray[i];
        if (item.type === 'F variable declaration' && item.line === funcLine)
            parameters.push(item.name);
    }
    return parameters;
}

//--------------------------BUILD GRAPH--------------------------

function buildVertices (parsedArray){
    let vertices = [], count = 1, scope = [];
    for (let i=0; i<parsedArray.length; i++){
        outOfScope (parsedArray, i, scope);
        let item = parsedArray[i];
        if (item.line === 1) continue;
        if (item.type === 'F assignment expression') {
            i = assignmentVertex(parsedArray, i, vertices, count, scope);
            count++;
        }
        else if (item.type === 'F return statement'){
            let ret = 'return ' + item.value;
            vertices.push({id: count, type: 'ret', code: ret, scope: copyArray(scope)});
            count++;
        }
        else
            count = buildVerticesCon(item, vertices, count, scope);
    }
    return vertices;
}

function outOfScope (parsedArray, i, scope){
    if (i === 0)
        return;
    let def = parsedArray[i].line - parsedArray[i-1].line;
    for (let i=1; i<def; i++)
        scope.pop();
}

function buildVerticesCon(item, vertices, count, scope) {
    let cond = item.condition;
    if (item.type === 'F if statement'){
        vertices.push({id: count, type: 'if', code: cond, scope: copyArray(scope)});
        scope.push('i'+count);
        count++;
    }
    else if (item.type === 'F else if statement'){
        vertices.push({id: count, type: 'else if', code: cond, scope: copyArray(scope)});
        scope.push('ei'+count);
        count++;
    }
    else
        count = buildVerticesCon1(item, vertices, count, scope, cond);
    return count;
}

function buildVerticesCon1(item, vertices, count, scope, cond){
    if (item.type === 'F else statement'){
        vertices.push({id: 0, type: 'else', code: cond, scope: copyArray(scope)});
        scope.push('e'+count);
    }
    else if (item.type === 'F while statement'){
        vertices.push({id: count, type: 'null', code: 'NULL', scope: copyArray(scope)});
        count++;
        vertices.push({id: count, type: 'while', code: cond, scope: copyArray(scope)});
        count++;
        scope.push('w'+count);
    }
    return count;
}

function copyArray(scope){
    let s = [];
    for (let i=0; i<scope.length; i++)
        s.push(scope[i]);
    return s;
}

function assignmentVertex(parsedArray, i, vertices, count, scope){
    let assignment = parsedArray[i].name + ' = ' + parsedArray[i].value;
    let j = i + 1;
    let def = parsedArray[j].line - parsedArray[j-1].line;
    while ((parsedArray[j].type === 'F assignment expression' || parsedArray[j].type === 'F variable declaration') && (def <= 1)){
        if (parsedArray[j].type === 'F assignment expression')
            assignment += '\n' + parsedArray[j].name + ' = ' + parsedArray[j].value;
        j++;
        i++;
        def = parsedArray[j].line - parsedArray[j-1].line;
    }
    vertices.push({id: count, type: 'ass', code: assignment, scope: copyArray(scope)});
    return i;
}

function buildEdges (vertices){
    let edges = [];
    let nextInScope = 0;
    for (let i=0; i<vertices.length-1; i++){
        nextInScope = findNextInScope (vertices, i);
        let vertex = vertices[i];
        if (vertex.type === 'ass')
            assignmentEdge(vertex, vertices, edges, i);
        else if (vertex.type === 'if')
            ifEdge(vertex, vertices, edges, i, nextInScope);
        else
            buildEdgesCon (vertex, vertices, edges, i, nextInScope);
    }
    return edges;
}

function buildEdgesCon (vertex, vertices, edges, i, nextInScope){
    if (vertex.type === 'else if')
        elseIfEdge(vertex, vertices, edges, i, nextInScope);
    else if (vertex.type === 'while') {
        edges.push({from: vertex.id-1, to: vertex.id, label: ''});
        edges.push({from: vertex.id, to: vertices[i + 1].id, label: 'T'});
        edges.push({from: vertex.id, to: vertices[nextInScope].id, label: 'F'});
    }
}

function assignmentEdge(vertex, vertices, edges, i){
    let next = vertices[i+1];
    if (isInWhileScope(vertices, i) && !isInWhileScope(vertices, i+1)){
        let whileVertex = findMyWhileScope (vertices, i);
        edges.push({from: vertex.id, to: vertices[whileVertex].id, label: ''});
    }
    else
        assignmentEdgeCon (vertex, vertices, edges, i, next);
}

function assignmentEdgeCon (vertex, vertices, edges, i, next){
    if (next.type === 'else if' || next.type === 'else') {
        let nextInScope = findNextInScopeForAss(vertices, i);
        edges.push({from: vertex.id, to: vertices[nextInScope].id, label: ''});
    }
    else
        edges.push({from: vertex.id, to: next.id, label: ''});
}

function ifEdge(vertex, vertices, edges, i, nextInScope){
    edges.push({from: vertex.id, to: vertices[i+1].id, label: 'T'});
    let elseIf = findNextElseIf (vertices, i);
    let elseVertex = findNextElse (vertices, i);
    if (elseIf >= 0)
        edges.push({from: vertex.id, to: vertices[elseIf].id, label: 'F'});
    else if (elseVertex >= 0)
        edges.push({from: vertex.id, to: vertices[elseVertex+1].id, label: 'F'});
    else
        edges.push({from: vertex.id, to: vertices[nextInScope].id, label: 'F'});
}

function elseIfEdge(vertex, vertices, edges, i, nextInScope){
    edges.push({from: vertex.id, to: vertices[i+1].id, label: 'T'});
    let elseVertex = findNextElse (vertices, i);
    if (elseVertex >= 0)
        edges.push({from: vertex.id, to: vertices[elseVertex+1].id, label: 'F'});
    else
        edges.push({from: vertex.id, to: vertices[nextInScope].id, label: 'F'});
}

function findNextElseIf (vertices, i){
    let next = findNextInScope(vertices, i);
    if (next >= 0 && vertices[next].type === 'else if')
        return next;
    return -1;
}

function findNextElse (vertices, i){
    let next = findNextInScope(vertices, i);
    if (next >= 0 && vertices[next].type === 'else')
        return next;
    return -1;
}

function findNextInScope (vertices, i){
    let scope = vertices[i].scope.length;
    let j = i + 1;
    let temp = -1;
    for (j; j<vertices.length; j++) {
        if (vertices[j].scope.length === scope) {
            temp = j;
            //if (scope === 0) return temp;
            //if (findNextInScopeCon (vertices, i, temp))
            return temp;
        }
    }
    if (isInWhileScope(vertices, i)/* && !isInWhileScope(vertices, i+1)*/)
        return findMyWhileScope (vertices, i);
    return -1;
}

/*
function findNextInScopeCon (vertices, i, temp){
    let flag = true;
    if (temp >= 0){
        for (let j=0; j<vertices[i].scope.length; j++) {
            if (vertices[i].scope[j] !== vertices[temp].scope[j])
                flag = false;
        }
        return flag;
    }
    else
        return false;
}*/

function isInWhileScope(vertices, i){
    let scope = vertices[i].scope;
    for (let i=0; i<scope.length; i++){
        let s = scope[i];
        if (s.charAt(0) === 'w')
            return true;
    }
    return false;
}

function findMyWhileScope (vertices, i){
    i--;
    for (i; i>=0; i--){
        if (vertices[i].type === 'while')
            return i-1;
    }
    return -1;
}

function findNextInScopeForAss(vertices, i){
    for (i; i<vertices.length; i++) {
        if (vertices[i].type === 'ass'){
            if (vertices[i-1].type === 'ass')
                return i;
        }
        if (vertices[i].type === 'ret')
            return i;
    }
    //return -1;
}

function buildGraph (parsedArray){
    let vertices = buildVertices (parsedArray);
    let edges = buildEdges (vertices);
    let graph = [vertices, edges];
    return graph;
}

//--------------------------EVAL AND PAINT GRAPH--------------------------

function evalGraph (graph, parsedArray, inputVectorString){
    let parameters = getParameters (parsedArray);
    let inputVector = parseInputVector(parameters, inputVectorString);
    let env = createEnv(inputVector);
    let newGraph = paintGraph (graph, env);
    return newGraph;
}

function createEnv(inputVector){
    let env = {};
    for (let i=0; i<inputVector.length; i++){
        env[inputVector[i].name] = inputVector[i].value;
    }
    return env;
}
export {createEnv};

function paintGraph (graph, env){
    let vertices = graph[0];
    let edges = graph[1];
    let shapedVertices = defineShapes(vertices);
    let from = edges[0].from;
    let to = 0;
    let pos = indexVertices(from, shapedVertices);
    paintVertex (pos, true, shapedVertices, edges[0]);
    for (let i=0; i<edges.length; i++){
        from = edges[i].from;
        to = edges[i].to;
        paintGraphCon (graph, env, from, to, shapedVertices, vertices, pos, edges, i);
    }
    let retIndex = shapedVertices.length-1;
    let ret = shapedVertices[retIndex];
    shapedVertices[retIndex] = {id: ret.id, code: ret.code, shape: ret.shape, color: 'G'};
    let newGraph = [shapedVertices, edges];
    return newGraph;
}

function paintGraphCon (graph, env, from, to, shapedVertices, vertices, pos, edges, i){
    let fromPos = indexVertices(from, shapedVertices);
    if (fromPos >= 0 && shapedVertices[fromPos].color === 'G'){
        let shouldPaint = evalVertex(vertices, from, env);
        pos = indexVertices(to, shapedVertices);
        if (shapedVertices[pos].color === '')
            paintVertex (pos, shouldPaint, shapedVertices, edges[i]);
    }
}

function paintVertex (index, shouldPaint, shapedVertices, edge){
    let vertex = shapedVertices[index];
    let c = '';
    if (shouldPaint){
        if (edge.label === 'T' || edge.label === '')
            c = 'G';
    }
    else
        c = paintVertexCon (index, shouldPaint, shapedVertices, edge, c);
    shapedVertices[index] = {id: vertex.id, code: vertex.code, shape: vertex.shape, color: c};
}

function paintVertexCon (index, shouldPaint, shapedVertices, edge, c){
    if (edge.label === 'F' || edge.label === '')
        c = 'G';
    return c;
}

function defineShapes (vertices){
    let shapedVertices = [];
    for (let i=0; i<vertices.length; i++){
        let vertex = vertices[i];
        if (vertex.id === 0)
            continue;
        let s = defineShapesCon(vertex);
        shapedVertices.push({id: vertex.id, code: vertex.code, shape: s, color: ''});
    }
    return shapedVertices;
}

function defineShapesCon(vertex){
    let s = 'rhombus';
    if (vertex.type === 'ass' || vertex.type === 'ret' || vertex.type === 'null')
        s = 'square';
    return s;
}

function evalVertex (vertices, id, env){
    let i = indexVertices (id, vertices);
    let vertex = vertices[i];
    let result = true;
    if (vertex.type === 'ass')
        result = evalAss (vertices, i, env);
    else if (vertex.type === 'if' || vertex.type === 'else if' || vertex.type === 'while')
        result = evalCond (vertices, i, env);
    else//null
        result = true;
    return result;
}

function indexVertices (id, vertices){
    for (let i=0; i<vertices.length; i++) {
        if (vertices[i].id === id)
            return i;
    }
    return -1;
}

function evalAss (vertices, i, env) {
    let assignments = vertices[i].code.split('\n');
    for (let j = 0; j < assignments.length; j++) {
        let expr = assignments[j].split(' = ');
        let n = expr[0];
        let v = evalExprType(expr[1], env);
        env[n] = v;
    }
    return true;
}

function evalExprType (exp, env){
    let Parser = safeeval.Parser;
    let parser = new Parser();
    let pos = exp.indexOf('[');
    if (pos === -1) {//value
        let val = parser.parse(exp);
        let v = val.evaluate(env);
        return v;
    }
    else if (pos === 0)//array
        return evalArray(exp, env, parser);
    else //if (pos > 0)//member
        return evalMember(exp, env, parser, pos);
}

function evalArray(exp, env, parser){
    let res = [];
    exp = exp.slice(1, exp.length-1);
    let arr = exp.split(', ');
    for (let i=0; i<arr.length; i++){
        let val = parser.parse(arr[i]);
        let v = val.evaluate(env);
        res.push(v);
    }
    return res;
}

function evalMember(exp, env, parser, pos){
    let arrName = exp.slice(0, pos);
    let close = exp.indexOf(']');
    let index = exp.slice(pos+1, close);
    let val = parser.parse(index);
    let v = val.evaluate(env);
    let arr = env[arrName];
    let result = arr[v];
    return result;
}

function evalCond (vertices, i, env){
    let Parser = safeeval.Parser;
    let parser = new Parser();
    let expr = parser.parse(vertices[i].code);
    let value = expr.evaluate(env);
    if (value)
        return true;
    else
        return false;
}

//--------------------------DRAW GRAPH--------------------------

function drawGraph (parsedArray, inputVectorString){
    let graph = buildGraph (parsedArray);
    graph = evalGraph (graph, parsedArray, inputVectorString);
    let draw = '';
    draw += addVertices(graph);
    draw += addEdges(graph);
    return draw;
}

function addVertices(graph){
    let draw = '';
    let vertices = graph[0];
    for (let i=0; i<vertices.length; i++){
        let vertex = vertices[i];
        draw += 'v' + vertex.id + '=>';
        if (vertex.shape === 'rhombus')
            draw += 'condition: ';
        else
            draw += 'operation: ';
        draw += '#' + vertex.id + '\n' + vertex.code;
        if (vertex.color === 'G')
            draw += '|paint' + '\n';
        else
            draw += '|noPaint' + '\n';
    }
    return draw;
}

function addEdges(graph) {
    let edges = graph[1];
    let times = countFrom(graph);
    let last = 0, draw = '', remove = [];
    for (let i = 0; i < edges.length; i++) {
        if (isIncludes(remove, i))
            continue;
        let from = edges[i].from;
        let to = edges[i].to;
        let label = edges[i].label;
        draw += addEdgesCon(from, to, label, times/*, last*/);
        if (times[to] > 1)
            last = 0;
        else {
            last = to;
            draw += addEdgesCon1 (edges, i, last, times, remove);
        }
    }
    return draw;
}

function addEdgesCon(from, to, label, times/*, last*/){
    let draw = '';
    let cond = '';
    if (label === 'T') cond = 'yes';
    else cond = 'no';
    //if (last !== from) {
    if (times[from] > 1)
        draw += '\n' + 'v' + from + '(' + cond + ')' + '->' + 'v' + to;
    else
        draw += '\n' + 'v' + from + '->' + 'v' + to;
    //}
    //else
    //   draw += '->' + 'v' + to;
    return draw;
}

function addEdgesCon1 (edges, i, last, times, remove){
    let draw = '';
    for (let j=i+1; j<edges.length; j++){
        let from = edges[j].from;
        let to = edges[j].to;
        if (from === last && times[from] <= 1){
            draw += '->' + 'v' + to;
            last = to;
            remove.push(j);
        }
    }
    return draw;
}

function isIncludes(remove, index){
    for (let i=0; i<remove.length; i++){
        if (remove[i] === index)
            return true;
    }
    return false;
}

function countFrom (graph) {
    let vertices = graph[0];
    let edges = graph[1];
    let result = [];
    result.push(0);
    for (let i = 0; i < vertices.length; i++) {
        result.push(0);
    }
    for (let i = 0; i < edges.length; i++) {
        let from = edges[i].from;
        let t = result[from];
        t++;
        result[from] = t;
    }
    return result;
}

export {getParameters};
export {parseCode};
export {parsing};
export {buildEdges};
export {buildVertices};
export {defineShapes};
export {drawGraph};
export {countFrom};
export {paintGraph};
export {evalGraph};
export {buildGraph};
export {evalAss};
export {evalCond};
export {evalVertex};
export {addVertices};
export {addEdges};
export {indexVertices};
export {findMyWhileScope};
export {parseInputVector};
export {evalExprType};
