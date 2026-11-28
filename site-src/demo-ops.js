'use strict';

// Vitrine independente: dados inventados e estado em memória de uma aba.
(() => {
  const preview = document.querySelector('[data-ops-preview]');
  if (!preview) return;
  const find = selector => preview.querySelector(selector);
  const all = selector => [...preview.querySelectorAll(selector)];
  const list = find('[role=tablist]');
  const tabs = all('[role=tab]');
  const panes = all('[role=tabpanel]');
  const selectTab = (index, focus = false) => {
    if (!tabs[index]) return;
    const target = tabs[index].getAttribute('aria-controls');
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    panes.forEach(pane => { pane.hidden = pane.id !== target; });
    if (focus) tabs[index].focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(i));
    tab.addEventListener('keydown', event => {
      const indices = {
        ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length,
        Home: 0, End: tabs.length - 1
      };
      if (!Object.hasOwn(indices, event.key)) return;
      event.preventDefault();
      selectTab(indices[event.key], true);
    });
  });
  selectTab(0);
  list.hidden = false;

  const diagnostics = [
    ['14:20:00', '3', 'Sem sinal recente', 'warn', 'Aguardando sinal da coleta', 'O que checar primeiro: a coleta. O acesso à Central e a fila são sinais independentes.'],
    ['14:20:14', '3', 'Reconectando', 'warn', 'Restabelecendo a conexão', 'O coletor voltou a responder, mas ainda não chegou um novo registro.'],
    ['14:20:27', '1', 'Coletando', 'ok', 'Processando a fila', 'A coleta retomou e a fila começou a baixar. Ainda há um registro a processar.'],
    ['14:20:40', '0', 'Em dia', 'ok', 'Sem itens em processamento', 'Novos registros chegaram e a fila zerou neste cenário.']
  ];
  const advance = find('[data-demo-advance]');
  const play = find('[data-demo-play]');
  const lastStep = diagnostics.length - 1;
  let step = 0;
  let timer = null;
  const stopPlayback = () => {
    clearInterval(timer);
    timer = null;
    play.setAttribute('aria-pressed', 'false');
    play.textContent = 'Reproduzir cenário';
  };
  const showStep = next => {
    step = next;
    const [clock, count, collector, tone, process, note] = diagnostics[step];
    find('[data-demo-clock]').textContent = clock;
    find('[data-demo-queue]').textContent = count;
    find('[data-demo-process]').textContent = process;
    const state = find('[data-demo-collector]');
    state.textContent = collector;
    state.dataset.tone = tone;
    find('[data-demo-diagnosis]').textContent = note;
    advance.textContent = step === lastStep ? 'Reiniciar cenário' : 'Avançar uma etapa';
    if (step === lastStep) stopPlayback();
  };
  find('[data-demo-playback]').hidden = false;
  advance.addEventListener('click', () => {
    stopPlayback();
    showStep((step + 1) % diagnostics.length);
  });
  play.addEventListener('click', () => {
    if (timer !== null) return stopPlayback();
    if (step === lastStep) showStep(0);
    play.setAttribute('aria-pressed', 'true');
    play.textContent = 'Pausar cenário';
    timer = setInterval(() => showStep(step + 1), 1600);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPlayback();
  });

  const requests = {
    list: ['GET /exemplo/chamados', '200 · OK', 'App de teste', '14:20:03', '42 ms', '0,6 kB', '5,1 kB'],
    log: ['GET /exemplo/historico', '403 · Acesso negado', 'Navegador de teste', '14:20:06', '18 ms', '0,4 kB', '0,2 kB'],
    entry: ['POST /exemplo/registro', '201 · Registro criado', 'App de teste', '14:20:11', '86 ms', '1,4 kB', '0,8 kB']
  };
  const buttons = all('[data-demo-request]');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.demoRequest;
      if (!Object.hasOwn(requests, key)) return;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      ['path', 'response', 'origin', 'at', 'time', 'in', 'out'].forEach((field, i) => {
        find('[data-demo-' + field + ']').textContent = requests[key][i];
      });
    });
  });

  const profile = all('[data-demo-profile]');
  const grants = all('[data-demo-grant]');
  const showGrants = () => {
    const count = grants.filter(input => input.checked).length;
    find('[data-demo-grants-status]').textContent = count === 1
      ? '1 permissão marcada na simulação.'
      : count + ' permissões marcadas na simulação.';
  };
  find('[data-demo-admin]').hidden = false;
  grants.forEach(input => { input.disabled = false; input.addEventListener('change', showGrants); });
  profile.forEach(button => {
    button.addEventListener('click', () => {
      const edit = button.dataset.demoProfile === 'edit';
      profile.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      find('[data-demo-account]').textContent = edit ? 'Colaborador de exemplo' : 'Nova conta de exemplo';
      grants.forEach(input => { input.checked = edit && ['cases', 'evidence'].includes(input.dataset.demoGrant); });
      showGrants();
    });
  });
})();
