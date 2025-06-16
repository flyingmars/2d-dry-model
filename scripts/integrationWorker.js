importScripts('model.js');

let grid = null;

self.onmessage = function(e) {
  const data = e.data;
  if (data.cmd === 'init') {
    grid = new WholeGrid(data.params);
    grid.baseState_OneDimension_Initialization();
    grid.perturbation_Initialization_Cold();
    self.postMessage({cmd: 'inited'});
  } else if (data.cmd === 'run' && grid) {
    pressRun(grid, data.iter, progress => {
      self.postMessage({cmd: 'progress', value: progress});
    }, () => {
      self.postMessage({
        cmd: 'done',
        realT: grid.realT,
        th: grid.th,
        time: grid.currentTime
      });
    });
  }
};
