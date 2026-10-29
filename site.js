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
  // Na prévia do painel (Padrão do Painel Host da IV Futuro): cada texto diz de onde vem (data-c) e cada parte,
  // qual grupo do editor abre (data-g). No site de verdade, nada disso aparece.
  function A(caminho) { return previa ? ' data-c="' + esc(caminho) + '"' : ''; }
  function G(grupo) { return previa ? ' data-g="' + esc(grupo) + '"' : ''; }
  // Link seguro nas partes extras: https, e-mail, âncora ou caminho do próprio site.
  function linkOk(u) { u = String(u || '').trim(); return /^(https:\/\/|mailto:|#|\/(?!\/))/.test(u) && !/[\s"'<>]/.test(u) ? u : ''; }
  function imgOk(u) { u = String(u || '').trim(); return /^https:\/\/[^\s"'<>]+$/.test(u) || /^[\w./-]+$/.test(u) ? u : ''; }

  // Partes extras, acrescentadas no editor do painel: texto, imagem, botões ou código livre.
  function extra(x, i) {
    var cam = 'extras.' + i + '.';
    if (x.tipo === 'texto') {
      return '<section' + G('extras') + '><div class="faixa">' + (x.titulo ? '<h2' + A(cam + 'titulo') + '>' + esc(x.titulo) + '</h2>' : '') +
        '<p class="explica"' + A(cam + 'texto') + '>' + fmt(x.texto) + '</p>' +
        (imgOk(x.imagem) ? '<img src="' + esc(imgOk(x.imagem)) + '" alt="" style="max-width:100%;border-radius:16px;margin-top:16px">' : '') + '</div></section>';
    }
    if (x.tipo === 'imagem') {
      if (!imgOk(x.imagem)) return '';
      return '<section' + G('extras') + '><div class="faixa" style="text-align:center"><img src="' + esc(imgOk(x.imagem)) + '" alt="" style="max-width:100%;border-radius:16px">' +
        (x.legenda ? '<p class="explica"' + A(cam + 'legenda') + '>' + esc(x.legenda) + '</p>' : '') + '</div></section>';
    }
    if (x.tipo === 'botoes') {
      return '<section' + G('extras') + '><div class="faixa" style="text-align:center">' + (x.itens || []).filter(function (b) { return b.texto; }).map(function (b, j) {
        var l = linkOk(b.link);
        return '<a class="baixar" style="margin:6px"' + (l ? ' href="' + esc(l) + '"' : '') + (l && l.indexOf('https') === 0 ? ' target="_blank" rel="noreferrer"' : '') + '><span' + A(cam + 'itens.' + j + '.texto') + '>' + esc(b.texto) + '</span></a>';
      }).join('') + '</div></section>';
    }
    if (x.tipo === 'codigo') {
      // Moldura isolada (sandbox sem allow-same-origin): o código não alcança nada do site.
      return '<section' + G('extras') + '><div class="faixa"><iframe sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" style="width:100%;border:0;height:' +
        Math.max(80, Math.min(4000, Number(x.altura) || 400)) + 'px" srcdoc="' + esc('<!doctype html><meta charset="utf-8"><base target="_blank">' + String(x.html || '')) + '"></iframe></div></section>';
    }
    return '';
  }

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
    h += '<div' + G('topo') + ' class="topo' + (t.posicaoBotao === 'centro' ? ' botao-centro' : '') + '"><div class="' + classeFaixa + '"><div class="chamada">' +
      '<h1>' + esc(t.titulo) + (t.tituloDestaque ? ' <span>' + esc(t.tituloDestaque) + '</span>' : '') + '</h1>' +
      '<p class="subtitulo"' + A('topo.subtitulo') + '>' + fmt(t.subtitulo) + '</p>' + botao(c, t.botao) +
      (t.detalhe ? '<p class="detalhe">' + esc(t.detalhe) + '<span id="versao-atual"></span></p>' : '') + '</div>' + foto + '</div></div>';

    if (mostrar(c.vantagens)) {
      h += '<section' + G('vantagens') + '><div class="faixa"><div class="vantagens">' + (c.vantagens.itens || []).map(function (v, i) {
        return '<div class="cartao"><div class="icone">' + esc(v.icone) + '</div><h3' + A('vantagens.itens.' + i + '.titulo') + '>' + esc(v.titulo) + '</h3><p' + A('vantagens.itens.' + i + '.texto') + '>' + fmt(v.texto) + '</p></div>';
      }).join('') + '</div></div></section>';
    }
    if (mostrar(c.como)) {
      h += '<section id="como"' + G('como') + '><div class="faixa"><h2' + A('como.titulo') + '>' + esc(c.como.titulo) + '</h2><p class="explica"' + A('como.explica') + '>' + fmt(c.como.explica) + '</p><div class="passos">' +
        (c.como.passos || []).map(function (p, i) {
          return '<div class="passo"><div><h3' + A('como.passos.' + i + '.titulo') + '>' + esc(p.titulo) + '</h3><p' + A('como.passos.' + i + '.texto') + '>' + fmt(p.texto) + '</p><div class="dica"' + A('como.passos.' + i + '.dica') + '>' + fmt(p.dica) + '</div></div></div>';
        }).join('') + '</div></div></section>';
    }
    if (mostrar(c.aparelhos)) {
      h += '<section id="aparelhos"' + G('aparelhos') + '><div class="faixa"><h2' + A('aparelhos.titulo') + '>' + esc(c.aparelhos.titulo) + '</h2><p class="explica"' + A('aparelhos.explica') + '>' + fmt(c.aparelhos.explica) + '</p><div class="aparelhos">' +
        (c.aparelhos.itens || []).map(function (a, i) {
          return '<div class="cartao"><span class="selo ' + esc(a.selo) + '">' + esc(a.seloTexto) + '</span><h3' + A('aparelhos.itens.' + i + '.titulo') + '>' + esc(a.titulo) + '</h3><p' + A('aparelhos.itens.' + i + '.texto') + '>' + fmt(a.texto) + '</p></div>';
        }).join('') + '</div></div></section>';
    }
    if (mostrar(c.precisa)) {
      h += '<section id="precisa"' + G('precisa') + '><div class="faixa"><h2' + A('precisa.titulo') + '>' + esc(c.precisa.titulo) + '</h2><p class="explica"' + A('precisa.explica') + '>' + fmt(c.precisa.explica) + '</p><ul class="precisa">' +
        (c.precisa.itens || []).map(function (i, n) { return '<li><span' + A('precisa.itens.' + n) + '>' + fmt(i) + '</span></li>'; }).join('') + '</ul></div></section>';
    }
    if (mostrar(c.perguntas)) {
      h += '<section id="perguntas"' + G('perguntas') + '><div class="faixa"><h2' + A('perguntas.titulo') + '>' + esc(c.perguntas.titulo) + '</h2>' +
        (c.perguntas.itens || []).map(function (q, i) { return '<details' + (previa ? ' open' : '') + '><summary>' + esc(q.pergunta) + '</summary><p' + A('perguntas.itens.' + i + '.resposta') + '>' + fmt(q.resposta) + '</p></details>'; }).join('') +
        '</div></section>';
    }
    h += (c.extras || []).filter(mostrar).map(function (x) { return extra(x, c.extras.indexOf(x)); }).join('');
    if (mostrar(c.final)) {
      h += '<section class="final"' + G('final') + '><div class="faixa"><h2' + A('final.titulo') + '>' + esc(c.final.titulo) + '</h2><p class="explica" style="margin: 0 auto 28px;"' + A('final.texto') + '>' + fmt(c.final.texto) + '</p>' +
        botao(c, c.final.botao) + '</div></section>';
    }
    h += '</main><footer' + G('rodape') + '><div class="faixa"><span' + A('rodape') + '>' + esc(c.rodape) + '</span><span><a href="termos.html">Termos de uso e licenças</a></span></div></footer>';
    document.getElementById('pagina').innerHTML = h;
    if (previa) editavel(c);
  }

  // Prévia editável: clica num texto e escreve ali mesmo (ao sair, o texto vai para o editor do painel); clicar em
  // qualquer parte abre o grupo dela no editor. Texto com **negrito** se edita só no painel, para não perder o negrito.
  function editavel(c) {
    var raiz = document.getElementById('pagina');
    if (!document.getElementById('estilo-previa')) {
      var s = document.createElement('style');
      s.id = 'estilo-previa';
      s.textContent = '[data-g]{cursor:pointer}[data-g]:hover{outline:2px dashed rgba(245,158,11,.55);outline-offset:-2px}' +
        '[data-c][contenteditable]{cursor:text;border-radius:4px}[data-c][contenteditable]:hover{outline:1px dashed #f59e0b;outline-offset:2px}' +
        '[data-c][contenteditable]:focus{outline:2px solid #f59e0b;outline-offset:2px;background:rgba(245,158,11,.08)}';
      document.head.appendChild(s);
    }
    raiz.querySelectorAll('[data-c]').forEach(function (el) {
      var valor = pegar(c, el.getAttribute('data-c'));
      if (typeof valor !== 'string' || valor.indexOf('**') >= 0) return;
      el.setAttribute('contenteditable', 'plaintext-only');
      el.addEventListener('keydown', function (e) { if (e.key === 'Escape' || (e.key === 'Enter' && /^H[1-6]$/.test(el.tagName))) { e.preventDefault(); el.blur(); } });
      el.addEventListener('blur', function () {
        var novo = el.innerText.replace(/\n+$/, '');
        if (novo !== valor) window.parent.postMessage({ tipo: 'pb-editar', caminho: el.getAttribute('data-c'), valor: novo }, '*');
      });
    });
    raiz.onclick = function (e) {
      if (e.target.closest('a')) e.preventDefault();
      var g = e.target.closest('[data-g]');
      if (g) window.parent.postMessage({ tipo: 'pb-abrir', grupo: g.getAttribute('data-g'), escrevendo: !!e.target.closest('[contenteditable]') }, '*');
    };
  }
  function pegar(obj, caminho) {
    return String(caminho).split('.').reduce(function (o, k) { return o == null ? o : o[/^\d+$/.test(k) ? Number(k) : k]; }, obj);
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
