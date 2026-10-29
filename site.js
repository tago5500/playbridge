// Monta o site a partir do conteúdo editado no Painel do Host (textos, imagens, logo, cores, posição do botão).
// Sem o painel (ou sem internet para ele), vale o conteudo.json daqui; sem JavaScript, o HTML que já está na página.
(function () {
  'use strict';
  // endereço do servidor do painel (Cloudflare); ?host=... troca, para testes
  var HOST = new URLSearchParams(location.search).get('host') || 'https://playbridge-host.playbridge-host.workers.dev';
  var previa = new URLSearchParams(location.search).has('previa');

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  // **assim** vira negrito
  function fmt(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
  function img(u) { return esc(u || ''); }
  var SETA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 19h16"/></svg>';

  function botao(c, texto) {
    return '<a class="baixar" href="' + esc(c.linkBaixar) + '">' + SETA + ' ' + esc(texto) + '</a>';
  }
  function mostrar(s) { return s && s.mostrar !== false; }

  function montar(c) {
    var t = c.topo || {};
    var cores = c.cores || {};
    var raiz = document.documentElement.style;
    if (cores.destaque) { raiz.setProperty('--destaque', cores.destaque); raiz.setProperty('--destaque-2', cores.destaque); }
    if (cores.fundo) raiz.setProperty('--fundo', cores.fundo);
    if (cores.cartao) raiz.setProperty('--painel', cores.cartao);
    if (c.pagina) {
      if (c.pagina.titulo) document.title = c.pagina.titulo;
      var d = document.querySelector('meta[name=description]');
      if (d && c.pagina.descricao) d.setAttribute('content', c.pagina.descricao);
    }

    var menu = ['como', 'aparelhos', 'precisa', 'perguntas'].filter(function (k) { return mostrar(c[k]) && c[k].menu; })
      .map(function (k) { return '<a href="#' + k + '">' + esc(c[k].menu) + '</a>'; }).join('');
    var h = '<header><div class="faixa"><a href="#"><img src="' + img(c.logo) + '" alt="PlayBridge"></a><nav>' + menu + '</nav></div></header><main>';

    var posFoto = t.posicaoFoto || 'direita';
    var foto = posFoto === 'sem' || !t.foto ? '' : t.molduraTv !== false
      ? '<div class="foto-topo"><div class="tv"><img src="' + img(t.foto) + '" alt=""></div><div class="pe-tv"></div></div>'
      : '<div class="foto-topo foto-solta"><img src="' + img(t.foto) + '" alt=""></div>';
    var classeFaixa = 'faixa' + (posFoto === 'esquerda' ? ' foto-esquerda' : posFoto === 'embaixo' ? ' foto-embaixo' : !foto ? ' sem-foto' : '');
    h += '<div class="topo' + (t.posicaoBotao === 'centro' ? ' botao-centro' : '') + '"><div class="' + classeFaixa + '"><div class="chamada">' +
      '<h1>' + esc(t.titulo) + (t.tituloDestaque ? ' <span>' + esc(t.tituloDestaque) + '</span>' : '') + '</h1>' +
      '<p class="subtitulo">' + fmt(t.subtitulo) + '</p>' + botao(c, t.botao) +
      (t.detalhe ? '<p class="detalhe">' + esc(t.detalhe) + '<span id="versao-atual"></span></p>' : '') + '</div>' + foto + '</div></div>';

    if (mostrar(c.vantagens)) {
      h += '<section><div class="faixa"><div class="vantagens">' + (c.vantagens.itens || []).map(function (v) {
        return '<div class="cartao"><div class="icone">' + esc(v.icone) + '</div><h3>' + esc(v.titulo) + '</h3><p>' + fmt(v.texto) + '</p></div>';
      }).join('') + '</div></div></section>';
    }
    if (mostrar(c.como)) {
      h += '<section id="como"><div class="faixa"><h2>' + esc(c.como.titulo) + '</h2><p class="explica">' + fmt(c.como.explica) + '</p><div class="passos">' +
        (c.como.passos || []).map(function (p) {
          return '<div class="passo"><div><h3>' + esc(p.titulo) + '</h3><p>' + fmt(p.texto) + '</p><div class="dica">' + fmt(p.dica) + '</div></div></div>';
        }).join('') + '</div></div></section>';
    }
    if (mostrar(c.aparelhos)) {
      h += '<section id="aparelhos"><div class="faixa"><h2>' + esc(c.aparelhos.titulo) + '</h2><p class="explica">' + fmt(c.aparelhos.explica) + '</p><div class="aparelhos">' +
        (c.aparelhos.itens || []).map(function (a) {
          return '<div class="cartao"><span class="selo ' + esc(a.selo) + '">' + esc(a.seloTexto) + '</span><h3>' + esc(a.titulo) + '</h3><p>' + fmt(a.texto) + '</p></div>';
        }).join('') + '</div></div></section>';
    }
    if (mostrar(c.precisa)) {
      h += '<section id="precisa"><div class="faixa"><h2>' + esc(c.precisa.titulo) + '</h2><p class="explica">' + fmt(c.precisa.explica) + '</p><ul class="precisa">' +
        (c.precisa.itens || []).map(function (i) { return '<li><span>' + fmt(i) + '</span></li>'; }).join('') + '</ul></div></section>';
    }
    if (mostrar(c.perguntas)) {
      h += '<section id="perguntas"><div class="faixa"><h2>' + esc(c.perguntas.titulo) + '</h2>' +
        (c.perguntas.itens || []).map(function (q) { return '<details><summary>' + esc(q.pergunta) + '</summary><p>' + fmt(q.resposta) + '</p></details>'; }).join('') +
        '</div></section>';
    }
    if (mostrar(c.final)) {
      h += '<section class="final"><div class="faixa"><h2>' + esc(c.final.titulo) + '</h2><p class="explica" style="margin: 0 auto 28px;">' + fmt(c.final.texto) + '</p>' +
        botao(c, c.final.botao) + '</div></section>';
    }
    h += '</main><footer><div class="faixa"><span>' + esc(c.rodape) + '</span><span><a href="termos.html">Termos de uso e licenças</a></span></div></footer>';
    document.getElementById('pagina').innerHTML = h;
  }

  if (previa) {
    // prévia dentro do painel: o painel manda o rascunho a cada mudança
    window.addEventListener('message', function (e) {
      if (e.data && e.data.tipo === 'pb-previa' && e.data.conteudo) montar(e.data.conteudo);
    });
    if (window.parent !== window) window.parent.postMessage({ tipo: 'pb-previa-pronta' }, '*');
    return;
  }

  function doArquivo() {
    return fetch('conteudo.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); });
  }
  var doPainel = HOST.indexOf('SUBDOMINIO') >= 0 ? Promise.reject(0)
    : fetch(HOST + '/api/site', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); });
  doPainel.catch(doArquivo).then(montar).catch(function () { /* fica o HTML que já está na página */ });
})();

// Versão que o botão Baixar entrega agora (a última publicada): o cliente confere que baixou a mais nova
(function () {
  if (!window.fetch) return;
  // (o conteúdo do painel pode redesenhar o topo depois: escreve de novo por alguns segundos)
  function escrever(texto) {
    var vezes = 0;
    var t = setInterval(function () { var e = document.getElementById('versao-atual'); if (e) e.textContent = texto; if (++vezes > 10) clearInterval(t); }, 500);
  }
  fetch('https://api.github.com/repos/tago5500/playbridge/releases/latest', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.tag_name) return;
      var data = d.published_at ? new Date(d.published_at).toLocaleDateString('pt-BR') : '';
      escrever(' · versão ' + d.tag_name.replace(/^v/, '') + (data ? ' (de ' + data + ')' : ''));
    })
    .catch(function () {});
})();
