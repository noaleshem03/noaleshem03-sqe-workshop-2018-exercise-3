import assert from 'assert';
import {parseCode, parsing, buildGraph, evalGraph, drawGraph, countFrom, parseInputVector, getParameters, buildVertices, buildEdges, createEnv, defineShapes, paintGraph, evalAss, evalCond, evalVertex, addEdges, addVertices, indexVertices, findMyWhileScope, evalExprType} from '../src/js/code-analyzer';
describe('The javascript parser', () => {
    it('1. variable declaration', () => {
        assert.deepEqual(
            parsing (parseCode('let a, b;')),
            [{'line': 1, 'type': 'variable declaration', 'name': 'a', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'variable declaration', 'name': 'b', 'condition': '', 'value': ''}]
        );
    });

    it('2. variable declaration and assignment', () => {
        assert.deepEqual(
            parsing (parseCode('let a = 1, b = 2;')),
            [{'line': 1, 'type': 'variable declaration', 'name': 'a', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'assignment expression', 'name': 'a', 'condition': '', 'value': 1},
                {'line': 1, 'type': 'variable declaration', 'name': 'b', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'assignment expression', 'name': 'b', 'condition': '', 'value': 2}]
        );
    });

    it('3. variable assignment with binary expression', () => {
        assert.deepEqual(
            parsing (parseCode('a = b + 1;')),
            [{'line': 1, 'type': 'assignment expression', 'name': 'a', 'condition': '', 'value': 'b + 1'}]
        );
    });


    it('4. variable assignment with update expression', () => {
        assert.deepEqual(
            parsing (parseCode('a++;')),
            [{'line': 1, 'type': 'assignment expression', 'name': 'a', 'condition': '', 'value': 'a++'}]
        );
    });


    it('5. function declaration without return', () => {
        assert.deepEqual(
            parsing (parseCode('function foo (x, y){\n' +
                'a = y;\n' +
                '}')),
            [{'line': 1, 'type': 'F function declaration', 'name': 'foo', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'x', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'y', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F assignment expression', 'name': 'a', 'condition': '', 'value': 'y'}]
        );
    });

    it('6. function declaration with return', () => {
        assert.deepEqual(
            parsing (parseCode('function goo (a, b){\n' +
                'let c = 0;\n' +
                'if (a > 0)\n' +
                'c--;\n' +
                'return c;\n' +
                '}')),
            [{'line': 1, 'type': 'F function declaration', 'name': 'goo', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'a', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'b', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F variable declaration', 'name': 'c', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F assignment expression', 'name': 'c', 'condition': '', 'value': '0'},
                {'line': 3, 'type': 'F if statement', 'name': '', 'condition': 'a > 0', 'value': ''},
                {'line': 4, 'type': 'F assignment expression', 'name': 'c', 'condition': '', 'value': 'c--'},
                {'line': 5, 'type': 'F return statement', 'name': '', 'condition': '', 'value': 'c'}]
        );
    });

    it('7. function declaration with return', () => {
        assert.deepEqual(
            parsing (parseCode('function f(){\n' +
                'return;\n' +
                '}')),
            [{'line': 1, 'type': 'F function declaration', 'name': 'f', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F return statement', 'name': '', 'condition': '', 'value': ''}]
        );
    });

    it('8. if and else if statement', () => {
        assert.deepEqual(
            parsing (parseCode('if (a>0)\n' +
                'a++;\n' +
                'else if (b>0)\n' +
                'b++;')),
            [{'line': 1, 'type': 'if statement', 'name': '', 'condition': 'a > 0', 'value': ''},
                {'line': 2, 'type': 'assignment expression', 'name': 'a', 'condition': '', 'value': 'a++'},
                {'line': 3, 'type': 'else if statement', 'name': '', 'condition': 'b > 0', 'value': ''},
                {'line': 4, 'type': 'assignment expression', 'name': 'b', 'condition': '', 'value': 'b++'}]
        );
    });

    it('9. parse input vector', () => {
        let parameters = ['a', 'b', 'c'];
        assert.deepEqual(
            parseInputVector(parameters, '1, 2, 3'),
            [{'name': 'a', 'value': 1}, {'name': 'b', 'value': 2}, {'name': 'c', 'value': 3}]
        );
    });

    it('10. parse input vector', () => {
        let parameters = ['a'];
        assert.deepEqual(
            parseInputVector(parameters, '"aaa"'),
            [{'name': 'a', 'value': 'aaa'}]
        );
    });


    it('11. parse input vector', () => {
        let parameters = ['a'];
        assert.deepEqual(
            parseInputVector(parameters, '[1, 2]'),
            [{'name': 'a', 'value': [1, 2]}]
        );
    });

    it('12. parse input vector', () => {
        let parameters = ['a', 'b'];
        assert.deepEqual(
            parseInputVector(parameters, '[1, 2], true'),
            [{'name': 'a', 'value': [1, 2]}, {'name': 'b', 'value': true}]
        );
    });

    it('13. get parameters', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' + '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' + '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' + '    \n' +
            '    return c;\n' + '}\n'));
        assert.deepEqual(
            getParameters (parsedArray),
            ['x', 'y', 'z']
        );
    });

    it('14. build vertices', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' + '    let b = a + y;\n' +
            '    let c = 0;\n' + '    \n' + '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' + '    }\n' + '    \n' +
            '    return c;\n' + '}\n'));
        assert.deepEqual(buildVertices (parsedArray),
            [{'id': 1, 'type': 'ass', 'code': 'a = x + 1\nb = a + y\nc = 0', 'scope': []},
                {'id': 2, 'type': 'if', 'code': 'b < z', 'scope': []},
                {'id': 3, 'type': 'ass', 'code': 'c = c + 5', 'scope': ['i2']},
                {'id': 4, 'type': 'else if', 'code': 'b < z * 2', 'scope': []},
                {'id': 5, 'type': 'ass', 'code': 'c = c + x + 5', 'scope': ['ei4']},
                {'id': 0, 'type': 'else', 'code': '', 'scope': []},
                {'id': 6, 'type': 'ass', 'code': 'c = c + z + 5', 'scope': ['e6']},
                {'id': 7, 'type': 'ret', 'code': 'return c', 'scope': []}]
        );
    });

    it('15. build vertices', () => {
        let parsedArray = parsing (parseCode('function foo(x, y){\n' + 'let a = x + 1;\n' + 'let b = a + y;\n' + 'if (b > 0){\n' + 'if (b > 1){\n' + 'if (b > 2){\n' + 'b = 10;\n' + '}\n' +
            'else{\n' + 'b = 20;\n' + '}\n' + '}\n' + 'else{\n' + 'b = 30;\n' + '}\n' + '}\n' + 'else{\n' + 'b = 40;\n' + '}\n' + 'return b;\n' + '}'));
        assert.deepEqual(
            buildVertices (parsedArray),
            [{'id': 1, 'type': 'ass', 'code': 'a = x + 1\nb = a + y', 'scope': []},
                {'id': 2, 'type': 'if', 'code': 'b > 0', 'scope': []},
                {'id': 3, 'type': 'if', 'code': 'b > 1', 'scope': ['i2']},
                {'id': 4, 'type': 'if', 'code': 'b > 2', 'scope': ['i2', 'i3']},
                {'id': 5, 'type': 'ass', 'code': 'b = 10', 'scope': ['i2', 'i3', 'i4']},
                {'id': 0, 'type': 'else', 'code': '', 'scope': ['i2', 'i3']},
                {'id': 6, 'type': 'ass', 'code': 'b = 20', 'scope': ['i2', 'i3', 'e6']},
                {'id': 0, 'type': 'else', 'code': '', 'scope': ['i2']},
                {'id': 7, 'type': 'ass', 'code': 'b = 30', 'scope': ['i2', 'e7']},
                {'id': 0, 'type': 'else', 'code': '', 'scope': []},
                {'id': 8, 'type': 'ass', 'code': 'b = 40', 'scope': ['e8']},
                {'id': 9, 'type': 'ret', 'code': 'return b', 'scope': []}]
        );
    });

    it('16. build vertices', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    while (b < z) {\n' +
            '        if (c > 0){\n' +
            '            c = c + 5;\n' + '        }\n' +
            '        b = b + 1;\n' + '    }\n' +
            '    return c;\n' + '}\n'));
        assert.deepEqual(buildVertices (parsedArray),
            [{'id': 1, 'type': 'ass', 'code': 'a = x + 1\nb = a + y\nc = 0', 'scope': []},
                {'id': 2, 'type': 'null', 'code': 'NULL', 'scope': []},
                {'id': 3, 'type': 'while', 'code': 'b < z', 'scope': []},
                {'id': 4, 'type': 'if', 'code': 'c > 0', 'scope': ['w4']},
                {'id': 5, 'type': 'ass', 'code': 'c = c + 5', 'scope': ['w4', 'i4']},
                {'id': 6, 'type': 'ass', 'code': 'b = b + 1', 'scope': ['w4']},
                {'id': 7, 'type': 'ret', 'code': 'return c', 'scope': []}]
        );
    });

    it('17. build edges', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '   let a = x + 1;\n' +
            '   let b = a + y;\n' +
            '   let c = 0;\n' + '   \n' +
            '   while (a < z) {\n' +
            '       c = a + b;\n' +
            '       z = c * 2;\n' +
            '       a++;\n' +
            '   }\n' + '   \n' +
            '   return z;\n' + '}\n'));
        let vertices = buildVertices (parsedArray);
        assert.deepEqual(buildEdges (vertices),
            [{'from': 1, 'to': 2, 'label': ''},
                {'from': 2, 'to': 3, 'label': ''},
                {'from': 3, 'to': 4, 'label': 'T'},
                {'from': 3, 'to': 5, 'label': 'F'},
                {'from': 4, 'to': 2, 'label': ''}]
        );
    });

    it('18. build edges', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' + '    \n' +
            '    if (b < z) {\n' + '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' +
            '    } else {\n' + '        c = c + z + 5;\n' +
            '    }\n' + '    \n' + '    return c;\n' + '}\n'));
        let vertices = buildVertices (parsedArray);
        assert.deepEqual(buildEdges (vertices),
            [{'from': 1, 'to': 2, 'label': ''},
                {'from': 2, 'to': 3, 'label': 'T'},
                {'from': 2, 'to': 4, 'label': 'F'},
                {'from': 3, 'to': 7, 'label': ''},
                {'from': 4, 'to': 5, 'label': 'T'},
                {'from': 4, 'to': 6, 'label': 'F'},
                {'from': 5, 'to': 7, 'label': ''},
                {'from': 6, 'to': 7, 'label': ''}]);});

    it('19. build graph', () => {
        let parsedArray = parsing (parseCode('function foo(x, y){\n' + 'let a = x + 1;\n' + 'let b = a + y;\n' + 'if (b > 0){\n' + 'if (b > 1){\n' + 'if (b > 2){\n' + 'b = 10;\n'
            + '}\n' + 'else{\n' + 'b = 20;\n' + '}\n' + '}\n' + 'else{\n' + 'b = 30;\n' + '}\n' + '}\n' + 'else{\n' + 'b = 40;\n' + '}\n' + 'return b;\n' + '}'));
        assert.deepEqual(buildGraph (parsedArray),
            [[{'id': 1, 'type': 'ass', 'code': 'a = x + 1\nb = a + y', 'scope': []},
                {'id': 2, 'type': 'if', 'code': 'b > 0', 'scope': []},
                {'id': 3, 'type': 'if', 'code': 'b > 1', 'scope': ['i2']},
                {'id': 4, 'type': 'if', 'code': 'b > 2', 'scope': ['i2', 'i3']},
                {'id': 5, 'type': 'ass', 'code': 'b = 10', 'scope': ['i2', 'i3', 'i4']},
                {'id': 0, 'type': 'else', 'code': '', 'scope': ['i2', 'i3']},
                {'id': 6, 'type': 'ass', 'code': 'b = 20', 'scope': ['i2', 'i3', 'e6']},
                {'id': 0, 'type': 'else', 'code': '', 'scope': ['i2']},
                {'id': 7, 'type': 'ass', 'code': 'b = 30', 'scope': ['i2', 'e7']},
                {'id': 0, 'type': 'else', 'code': '', 'scope': []},
                {'id': 8, 'type': 'ass', 'code': 'b = 40', 'scope': ['e8']},
                {'id': 9, 'type': 'ret', 'code': 'return b', 'scope': []}],
            [{'from': 1, 'to': 2, 'label': ''}, {'from': 2, 'to': 3, 'label': 'T'}, {'from': 2, 'to': 8, 'label': 'F'}, {'from': 3, 'to': 4, 'label': 'T'}, {'from': 3, 'to': 7, 'label': 'F'},
                {'from': 4, 'to': 5, 'label': 'T'}, {'from': 4, 'to': 6, 'label': 'F'}, {'from': 5, 'to': 9, 'label': ''}, {'from': 6, 'to': 9, 'label': ''}, {'from': 7, 'to': 9, 'label': ''}, {'from': 8, 'to': 9, 'label': ''}]]
        );
    });

    it('20. parse input vector', () => {
        let parameters = ['a', 'b', 'c'];
        let inputVector = parseInputVector(parameters, '1, 2, 3');
        assert.deepEqual(
            createEnv(inputVector),
            {'a': 1, 'b': 2, 'c': 3}
        );
    });

    it('21. define shapes', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' + '    \n' +
            '    if (b < z) {\n' + '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' +
            '    } else {\n' + '        c = c + z + 5;\n' +
            '    }\n' + '    \n' + '    return c;\n' + '}\n'));
        let vertices = buildVertices(parsedArray);
        assert.deepEqual(defineShapes (vertices),
            [{'id': 1, 'code': 'a = x + 1\nb = a + y\nc = 0', 'shape': 'square', 'color': ''},
                {'id': 2, 'code': 'b < z', 'shape': 'rhombus', 'color': ''},
                {'id': 3, 'code': 'c = c + 5', 'shape': 'square', 'color': ''},
                {'id': 4, 'code': 'b < z * 2', 'shape': 'rhombus', 'color': ''},
                {'id': 5, 'code': 'c = c + x + 5', 'shape': 'square', 'color': ''},
                {'id': 6, 'code': 'c = c + z + 5', 'shape': 'square', 'color': ''},
                {'id': 7, 'code': 'return c', 'shape': 'square', 'color': ''}]
        );
    });

    it('22. eval assignment', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' + '    \n' +
            '    if (b < z) {\n' + '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' +
            '    } else {\n' + '        c = c + z + 5;\n' +
            '    }\n' + '    \n' + '    return c;\n' + '}\n'));
        let parameters = getParameters (parsedArray);
        let inputVector = parseInputVector(parameters, '1, 2, 3');
        let env = createEnv(inputVector);
        let tempVertices = buildVertices(parsedArray);
        let vertices = defineShapes (tempVertices);
        evalAss (vertices, 0, env);
        assert.deepEqual(env,
            {'x': '1', 'y': '2', 'z': '3', 'a': 2, 'b': 4, 'c': 0}
        );
    });

    it('22. eval cond', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' + '    \n' +
            '    if (b < z) {\n' + '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' +
            '    } else {\n' + '        c = c + z + 5;\n' +
            '    }\n' + '    \n' + '    return c;\n' + '}\n'));
        let parameters = getParameters (parsedArray);
        let inputVector = parseInputVector(parameters, '1, 2, 3');
        let env = createEnv(inputVector);
        let tempVertices = buildVertices(parsedArray);
        let vertices = defineShapes (tempVertices);
        evalAss (vertices, 0, env);
        assert.deepEqual(evalCond(vertices, 1, env), false
        );
    });

    it('23. eval cond', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' + '    \n' +
            '    if (b < z) {\n' + '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' +
            '    } else {\n' + '        c = c + z + 5;\n' +
            '    }\n' + '    \n' + '    return c;\n' + '}\n'));
        let parameters = getParameters (parsedArray);
        let inputVector = parseInputVector(parameters, '1, 2, 3');
        let env = createEnv(inputVector);
        let tempVertices = buildVertices(parsedArray);
        let vertices = defineShapes (tempVertices);
        evalAss (vertices, 0, env);
        assert.deepEqual(evalCond(vertices, 3, env), true
        );
    });

    it('24. eval vertex', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    while (b < z) {\n' +
            '        if (c > 0){\n' +
            '            c = c + 5;\n' +
            '        }\n' +
            '        b = b + 1;\n' +
            '    }\n' +
            '    return c;\n' + '}'));
        let parameters = getParameters (parsedArray);
        let inputVector = parseInputVector(parameters, '1, 2, 3');
        let env = createEnv(inputVector);
        let vertices = buildVertices(parsedArray);
        evalAss (vertices, 0, env);
        assert.deepEqual(evalVertex (vertices, 3, env), false
        );
    });

    it('25. paint graph', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' + '    \n' + '    if (b < z) {\n' + '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' + '    } else {\n' + '        c = c + z + 5;\n' + '    }\n' + '    \n' + '    return c;\n' + '}\n'));
        let parameters = getParameters (parsedArray), inputVector = parseInputVector(parameters, '1, 2, 3'), env = createEnv(inputVector), graph = buildGraph(parsedArray);
        assert.deepEqual(paintGraph (graph, env),
            [[{'id': 1, 'code': 'a = x + 1\nb = a + y\nc = 0', 'shape': 'square', 'color': 'G'},
                {'id': 2, 'code': 'b < z', 'shape': 'rhombus', 'color': 'G'},
                {'id': 3, 'code': 'c = c + 5', 'shape': 'square', 'color': ''},
                {'id': 4, 'code': 'b < z * 2', 'shape': 'rhombus', 'color': 'G'},
                {'id': 5, 'code': 'c = c + x + 5', 'shape': 'square', 'color': 'G'},
                {'id': 6, 'code': 'c = c + z + 5', 'shape': 'square', 'color': ''},
                {'id': 7, 'code': 'return c', 'shape': 'square', 'color': 'G'}],
            [{'from': 1, 'to': 2, 'label': ''},
                {'from': 2, 'to': 3, 'label': 'T'},
                {'from': 2, 'to': 4, 'label': 'F'},
                {'from': 3, 'to': 7, 'label': ''},
                {'from': 4, 'to': 5, 'label': 'T'},
                {'from': 4, 'to': 6, 'label': 'F'},
                {'from': 5, 'to': 7, 'label': ''},
                {'from': 6, 'to': 7, 'label': ''}]]);});

    it('26. eval graph', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' + '    \n' +
            '    if (b < z) {\n' + '        c = c + 5;\n' + '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' + '    } else {\n' + '        c = c + z + 5;\n' + '    }\n' + '    \n' + '    return c;\n' + '}\n'));
        let graph = buildGraph(parsedArray);
        assert.deepEqual(evalGraph (graph, parsedArray, '1, 2, 3'),
            [[{'id': 1, 'code': 'a = x + 1\nb = a + y\nc = 0', 'shape': 'square', 'color': 'G'},
                {'id': 2, 'code': 'b < z', 'shape': 'rhombus', 'color': 'G'},
                {'id': 3, 'code': 'c = c + 5', 'shape': 'square', 'color': ''},
                {'id': 4, 'code': 'b < z * 2', 'shape': 'rhombus', 'color': 'G'},
                {'id': 5, 'code': 'c = c + x + 5', 'shape': 'square', 'color': 'G'},
                {'id': 6, 'code': 'c = c + z + 5', 'shape': 'square', 'color': ''},
                {'id': 7, 'code': 'return c', 'shape': 'square', 'color': 'G'}],
            [{'from': 1, 'to': 2, 'label': ''},
                {'from': 2, 'to': 3, 'label': 'T'},
                {'from': 2, 'to': 4, 'label': 'F'},
                {'from': 3, 'to': 7, 'label': ''},
                {'from': 4, 'to': 5, 'label': 'T'},
                {'from': 4, 'to': 6, 'label': 'F'},
                {'from': 5, 'to': 7, 'label': ''},
                {'from': 6, 'to': 7, 'label': ''}]]);});

    it('27. count from', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' + '    \n' +
            '    return c;\n' + '}\n'));
        let tempGraph = buildGraph(parsedArray);
        let graph = evalGraph (tempGraph, parsedArray, '1, 2, 3');
        assert.deepEqual(countFrom (graph),
            [0, 1, 2, 1, 2, 1, 1, 0]
        );
    });

    it('28. add vertices', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' + '    \n' + '    if (b < z) {\n' + '        c = c + 5;\n' + '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' + '    } else {\n' + '        c = c + z + 5;\n' + '    }\n' + '    \n' + '    return c;\n' + '}\n'));
        let tempGraph = buildGraph(parsedArray);
        let graph = evalGraph (tempGraph, parsedArray, '1, 2, 3');
        assert.deepEqual(addVertices(graph),
            'v1=>operation: #1\n' + 'a = x + 1\n' + 'b = a + y\n' + 'c = 0|paint\n' + 'v2=>condition: #2\n' +
            'b < z|paint\n' +
            'v3=>operation: #3\n' +
            'c = c + 5|noPaint\n' +
            'v4=>condition: #4\n' +
            'b < z * 2|paint\n' +
            'v5=>operation: #5\n' +
            'c = c + x + 5|paint\n' +
            'v6=>operation: #6\n' +
            'c = c + z + 5|noPaint\n' +
            'v7=>operation: #7\n' +
            'return c|paint\n'
        );
    });

    it('28. add edges', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' + '    \n' + '    if (b < z) {\n' + '        c = c + 5;\n' + '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' + '    } else {\n' + '        c = c + z + 5;\n' + '    }\n' + '    \n' + '    return c;\n' + '}\n'));
        let tempGraph = buildGraph(parsedArray);
        let graph = evalGraph (tempGraph, parsedArray, '1, 2, 3');
        assert.deepEqual(addEdges(graph),
            '\nv1->v2\n' +
            'v2(yes)->v3->v7\n' +
            'v2(no)->v4\n' +
            'v4(yes)->v5->v7\n' +
            'v4(no)->v6->v7');
    });

    it('29. draw graph', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' + '    \n' + '    if (b < z) {\n' + '        c = c + 5;\n' + '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' + '    } else {\n' + '        c = c + z + 5;\n' + '    }\n' + '    \n' + '    return c;\n' + '}\n'));
        assert.deepEqual(drawGraph (parsedArray, '1, 2, 3'), 'v1=>operation: #1\n' + 'a = x + 1\n' + 'b = a + y\n' + 'c = 0|paint\n' + 'v2=>condition: #2\n' + 'b < z|paint\n' +
            'v3=>operation: #3\n' +
            'c = c + 5|noPaint\n' +
            'v4=>condition: #4\n' +
            'b < z * 2|paint\n' +
            'v5=>operation: #5\n' +
            'c = c + x + 5|paint\n' +
            'v6=>operation: #6\n' +
            'c = c + z + 5|noPaint\n' +
            'v7=>operation: #7\n' +
            'return c|paint\n' +
            '\n' +
            'v1->v2\n' +
            'v2(yes)->v3->v7\n' +
            'v2(no)->v4\n' +
            'v4(yes)->v5->v7\n' +
            'v4(no)->v6->v7');
    });

    it('30. draw graph', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' + '    while (b < 10) {\n' + '        if (c > 0){\n' + '            c = c + 5;\n' + '        }\n' + '        b = b + 1;\n' + '    }\n' + '    return c;\n' + '}'));
        assert.deepEqual(drawGraph (parsedArray, '1, 2, 3'),
            'v1=>operation: #1\n' + 'a = x + 1\n' + 'b = a + y\n' + 'c = 0|paint\n' +
            'v2=>operation: #2\n' +
            'NULL|paint\n' +
            'v3=>condition: #3\n' +
            'b < 10|paint\n' +
            'v4=>condition: #4\n' +
            'c > 0|paint\n' +
            'v5=>operation: #5\n' +
            'c = c + 5|noPaint\n' +
            'v6=>operation: #6\n' +
            'b = b + 1|paint\n' +
            'v7=>operation: #7\n' +
            'return c|paint\n' + '\n' + 'v1->v2->v3\n' +
            'v3(yes)->v4\n' + 'v3(no)->v7\n' +
            'v4(yes)->v5->v6->v2\n' + 'v4(no)->v6->v2');
    });

    it('31. eval assignment', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            '    let a = x;\n' +
            '    let c = 0;\n' +
            '    if (a) {\n' +
            '        c = c + 5;\n' +
            '    } \n' +
            '    return c;\n' +
            '}'));
        let parameters = getParameters (parsedArray);
        let inputVector = parseInputVector(parameters, 'true');
        let env = createEnv(inputVector);
        let tempVertices = buildVertices(parsedArray);
        let vertices = defineShapes (tempVertices);
        evalAss (vertices, 0, env);
        assert.deepEqual(env,
            {'x': true, 'a' : true, 'c': 0}
        );
    });

    it('32. eval vertex', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    while (b < z) {\n' +
            '        if (c > 0){\n' +
            '            c = c + 5;\n' +
            '        }\n' +
            '        b = b + 1;\n' +
            '    }\n' +
            '    return c;\n' + '}'));
        let vertices = buildVertices(parsedArray);
        assert.deepEqual(indexVertices (10, vertices), -1
        );
    });

    it('33. draw graph', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            '    let a = x + 1;\n' + '    if (a > 2){\n' + '        a = a + 1;\n' + '    }\n' + '    else{\n' +
            '        a = a - 1;\n' + '    }\n' + '    a = 200;\n' + '    return a;\n' + '}'));
        assert.deepEqual(drawGraph (parsedArray, '5'),
            'v1=>operation: #1\n' + 'a = x + 1|paint\n' + 'v2=>condition: #2\n' +
            'a > 2|paint\n' +
            'v3=>operation: #3\n' +
            'a = a + 1|paint\n' +
            'v4=>operation: #4\n' +
            'a = a - 1|noPaint\n' +
            'v5=>operation: #5\n' +
            'a = 200|paint\n' +
            'v6=>operation: #6\n' +
            'return a|paint\n' +
            '\n' +
            'v1->v2\n' +
            'v2(yes)->v3->v5->v6\n' +
            'v2(no)->v4->v5->v6');
    });

    it('34. while scope', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            '    let a = x + 1;\n' +
            '    if (a > 2){\n' +
            '        a = a + 1;\n' +
            '    }\n' +
            '    else{\n' +
            '        a = a - 1;\n' +
            '    }\n' +
            '    a = 200;\n' +
            '    return a;\n' +
            '}'));
        let vertices = buildVertices(parsedArray);
        assert.deepEqual(findMyWhileScope (vertices, 0), -1
        );
    });

    it('35. draw graph', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            '    let a = x + 1;\n' + '    if (a > 2){\n' +
            '        a = a + 1;\n' + '    }\n' + '    a = 200;\n' + '    return a;\n' + '}'));
        assert.deepEqual(drawGraph (parsedArray, '0'),
            'v1=>operation: #1\n' +
            'a = x + 1|paint\n' +
            'v2=>condition: #2\n' +
            'a > 2|paint\n' +
            'v3=>operation: #3\n' +
            'a = a + 1|noPaint\n' +
            'v4=>operation: #4\n' +
            'a = 200|paint\n' +
            'v5=>operation: #5\n' +
            'return a|paint\n' +
            '\n' +
            'v1->v2\n' +
            'v2(yes)->v3->v4->v5\n' +
            'v2(no)->v4->v5');
    });

    it('36. draw graph', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            '    let a = x + 1;\n' + '    if (a > 2){\n' + '        a = a + 1;\n' + '    }\n' +
            '    else if (a > 4){\n' + '        a = a - 1;\n' + '    }\n' + '    a = 200;\n' + '    return a;\n' + '}'));
        assert.deepEqual(drawGraph (parsedArray, '2'),
            'v1=>operation: #1\n' +
            'a = x + 1|paint\n' +
            'v2=>condition: #2\n' +
            'a > 2|paint\n' +
            'v3=>operation: #3\n' +
            'a = a + 1|paint\n' +
            'v4=>condition: #4\n' +
            'a > 4|noPaint\n' +
            'v5=>operation: #5\n' +
            'a = a - 1|noPaint\n' +
            'v6=>operation: #6\n' +
            'a = 200|paint\n' +
            'v7=>operation: #7\n' +
            'return a|paint\n' + '\n' + 'v1->v2\n' + 'v2(yes)->v3->v6->v7\n' + 'v2(no)->v4\n' + 'v4(yes)->v5->v6->v7\n' + 'v4(no)->v6->v7');
    });

    it('37. draw graph', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' + '    let a = x + 1;\n' + '    if (a > 2){\n' + '        a = a + 1;\n' + '    }\n' + '    else if (a > 4){\n' + '        a = a - 1;\n' + '    }\n' + '    else if (a > 3){\n' + '        a = a - 2;\n' + '    }\n' + '    a = 200;\n' + '    return a;\n' + '}'));
        assert.deepEqual(drawGraph (parsedArray, '2'),
            'v1=>operation: #1\n' + 'a = x + 1|paint\n' + 'v2=>condition: #2\n' + 'a > 2|paint\n' + 'v3=>operation: #3\n' + 'a = a + 1|paint\n' + 'v4=>condition: #4\n' + 'a > 4|noPaint\n' + 'v5=>operation: #5\n' + 'a = a - 1|noPaint\n' + 'v6=>condition: #6\n' + 'a > 3|noPaint\n' +
            'v7=>operation: #7\n' +
            'a = a - 2|noPaint\n' +
            'v8=>operation: #8\n' +
            'a = 200|paint\n' +
            'v9=>operation: #9\n' +
            'return a|paint\n' +
            '\n' +
            'v1->v2\n' +
            'v2(yes)->v3->v8->v9\n' +
            'v2(no)->v4\n' +
            'v4(yes)->v5->v8->v9\n' +
            'v4(no)->v6\n' +
            'v6(yes)->v7->v8->v9\n' +
            'v6(no)->v8->v9');
    });

    it('38. build vertices', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            '    let a = [1, 2]\n' +
            'if (a[1] > x){\n' +
            'x = x + 1;\n' +
            '}\n' +
            'return x;\n' +
            '}'));
        assert.deepEqual(buildVertices (parsedArray),
            [{'id': 1, 'type': 'ass', 'code': 'a = [1, 2]', 'scope': []},
                {'id': 2, 'type': 'if', 'code': 'a[1] > x', 'scope': []},
                {'id': 3, 'type': 'ass', 'code': 'x = x + 1', 'scope': ['i2']},
                {'id': 4, 'type': 'ret', 'code': 'return x', 'scope': []}]
        );
    });

    it('39. eval expr type', () => {
        let env = {x:0, y:[1, 2, 3]};
        assert.deepEqual(evalExprType('y', env), [1, 2, 3]);
    });

    it('40. eval expr type', () => {
        let env = {x:0, y:[1, 2, 3]};
        assert.deepEqual(evalExprType('x', env), 0);
    });

    it('41. eval expr type', () => {
        let env = {x:0, y:[1, 2, 3]};
        assert.deepEqual(evalExprType('y[1]', env), 2);
    });

    it('42. eval expr type', () => {
        let env = {x:0, y:[1, 2, 3]};
        assert.deepEqual(evalExprType('y[x]', env), 1);
    });

    it('43. eval expr type', () => {
        let env = {x:0, y:[1, 2, 3]};
        assert.deepEqual(evalExprType('y[x+2]', env), 3);
    });

    it('44. eval expr type', () => {
        let env = {x:0, y:1};
        assert.deepEqual(evalExprType('[x, y]', env), [0, 1]);
    });

    it('45. eval graph', () => {
        let parsedArray = parsing (parseCode('function f (x, y){\n' +
            'let a = x + y;\n' +
            'while (a > 0){\n' +
            'a = a - 1;\n' + '}\n' +
            'return a;\n' + '}'));
        let graph = buildGraph(parsedArray);
        assert.deepEqual(evalGraph (graph, parsedArray, '1, 2'),
            [[{'id': 1, 'code': 'a = x + y', 'shape': 'square', 'color': 'G'},
                {'id': 2, 'code': 'NULL', 'shape': 'square', 'color': 'G'},
                {'id': 3, 'code': 'a > 0', 'shape': 'rhombus', 'color': 'G'},
                {'id': 4, 'code': 'a = a - 1', 'shape': 'square', 'color': 'G'},
                {'id': 5, 'code': 'return a', 'shape': 'square', 'color': 'G'}],
            [{'from': 1, 'to': 2, 'label': ''},
                {'from': 2, 'to': 3, 'label': ''},
                {'from': 3, 'to': 4, 'label': 'T'},
                {'from': 3, 'to': 5, 'label': 'F'},
                {'from': 4, 'to': 2, 'label': ''}]]
        );
    });

    it('46. eval graph', () => {
        let parsedArray = parsing (parseCode('function f (x, y){\n' +
            'let a = x + y;\n' + 'while (a > 0){\n' + 'if (a > 1){\n' + 'a = a - 1;\n' + '}\n' + '}\n' + 'return a;\n' + '}'));
        let graph = buildGraph(parsedArray);
        assert.deepEqual(evalGraph (graph, parsedArray, '1, 2'),
            [[{'id': 1, 'code': 'a = x + y', 'shape': 'square', 'color': 'G'},
                {'id': 2, 'code': 'NULL', 'shape': 'square', 'color': 'G'},
                {'id': 3, 'code': 'a > 0', 'shape': 'rhombus', 'color': 'G'},
                {'id': 4, 'code': 'a > 1', 'shape': 'rhombus', 'color': 'G'},
                {'id': 5, 'code': 'a = a - 1', 'shape': 'square', 'color': 'G'},
                {'id': 6, 'code': 'return a', 'shape': 'square', 'color': 'G'}],
            [{'from': 1, 'to': 2, 'label': ''},
                {'from': 2, 'to': 3, 'label': ''},
                {'from': 3, 'to': 4, 'label': 'T'},
                {'from': 3, 'to': 6, 'label': 'F'},
                {'from': 4, 'to': 5, 'label': 'T'},
                {'from': 4, 'to': 2, 'label': 'F'},
                {'from': 5, 'to': 2, 'label': ''}]]
        );
    });

});


