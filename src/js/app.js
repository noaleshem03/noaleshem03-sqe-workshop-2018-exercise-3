import $ from 'jquery';
import * as flowchart from 'flowchart.js';
import {parseCode, parsing, drawGraph} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        $('p').empty();
        let codeToParse = $('#codePlaceholder').val();
        let inputVectorString = $('#inputVectorPlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let parsedArray = parsing(parsedCode);
        draw (parsedArray, inputVectorString);
        $('#tableBody').empty();
        for (let i = 0; i < parsedArray.length; i++) {
            let item = parsedArray[i];
            let row = `<tr><td>${item.line}</td><td>${item.type}</td>
                        <td>${item.name}</td><td>${item.condition}</td><td>${item.value}</td></tr>`;
            $('#tableBody').append(row);
        }
    });});

function draw (parsedArray, inputVectorString){
    let graph = drawGraph (parsedArray, inputVectorString);
    $('#diagram').text('');
    let diagram = flowchart.parse(graph);
    diagram.drawSVG('diagram', {
        'line-width': 3,
        'line-length': 50,
        'text-margin': 10,
        'font-size': 14,
        'font-color': 'black',
        'line-color': 'black',
        'yes-text': 'T',
        'no-text': 'F',
        'flowstate' : {
            'paint' : { 'fill' : 'green', 'font-size' : 12},
            'noPaint' : { 'fill' : 'white', 'font-size' : 12},
        }
    });
}
