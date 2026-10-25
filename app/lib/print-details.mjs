/**
 * Printing must not lose collapsed research apparatus. Before printing, open
 * every closed <details>; afterwards, close exactly those again. The print
 * stylesheet in globals.css covers browsers that print without these events.
 */
export const printDetailsBoot = `(function(){var opened=[];addEventListener('beforeprint',function(){opened=[].slice.call(document.querySelectorAll('details:not([open])'));opened.forEach(function(d){d.open=true})});addEventListener('afterprint',function(){opened.forEach(function(d){d.open=false});opened=[]})})()`;
