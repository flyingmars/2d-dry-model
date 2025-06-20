const { createApp, ref, onMounted } = Vue;

createApp({
  setup() {
    const params = ref({
      radz: 2000,
      zcnt: 3000,
      KZ: 75,
      delta: -15,
      bg_profile: false,
      radx: 4000,
      imid: 0,
      KX: 75,
      sfc_temp: 300,
      top_temp: 240,
      DX: 100,
      DZ: 100,
      NX: 380,
      NZ: 64,
      DT: 0.5,
      colorMin: -10,
      colorMax: 0,
    });
    const viewT = ref(1);
    const progress = ref(0);
    const progressVisible = ref(false);
    const autoRunning = ref(false);
    let intervalHandle = null;
    let grid = null;

    const createGrid = () => {
      grid = new WholeGrid({
        radz: params.value.radz,
        zcnt: params.value.zcnt,
        KZ: params.value.KZ,
        delta: params.value.delta,
        bg_profile: params.value.bg_profile,
        radx: params.value.radx,
        imid: params.value.imid,
        KX: params.value.KX,
        sfc_temp: params.value.sfc_temp,
        top_temp: params.value.top_temp,
        DX: params.value.DX,
        DZ: params.value.DZ,
        NX: params.value.NX,
        NZ: params.value.NZ,
        DT: params.value.DT,
        colorMin: params.value.colorMin,
        colorMax: params.value.colorMax,
        viewT: viewT.value,
      });
      grid.baseState_OneDimension_Initialization();
      grid.perturbation_Initialization_Cold();
      grid.newPlot();
    };

    const updateParameter = () => {
      createGrid();
    };

    const changeView = () => {
      viewT.value = viewT.value === 2 ? 1 : 2;
      if (grid) {
        grid.viewT = viewT.value;
        grid.newPlot();
      }
    };

    const runStep = () => {
      if (!grid) return;
      progressVisible.value = true;
      pressRun(grid, 99, p => progress.value = p, () => progressVisible.value = false);
    };

    const autoRun = () => {
      if (!grid) return;
      autoRunning.value = !autoRunning.value;
      if (autoRunning.value) {
        intervalHandle = setInterval(() => runStep(), 500);
      } else if (intervalHandle) {
        clearInterval(intervalHandle);
      }
    };

    onMounted(() => {
      createGrid();
    });

    return {
      params,
      viewT,
      progress,
      progressVisible,
      autoRunning,
      changeView,
      runStep,
      autoRun,
      updateParameter
    };
  }
}).mount('#app');
