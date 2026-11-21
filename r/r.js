// Página del cliente que invita (Pasa la llama). El token secreto viaja tras
// '#' (/r/#AbC123xyZ987): no llega a GitHub ni sale en el Referer. Solo habla
// con la Edge Function "referidos". Todo el texto se pone con textContent.
(function () {
  'use strict'
  var API = 'https://cnychdelfsppsinohkaf.supabase.co/functions/v1/referidos'
  var SITIO = 'https://ventasleongroup-byte.github.io/leongas'
  var LEONGAS = '51999995646'
  var token = (location.hash || '').replace('#', '')
  var estado = null           // respuesta de referidos_web_estado
  var elegidos = []           // [{nombre, telefono(51…)}]
  var enviados = {}

  function $(id) { return document.getElementById(id) }
  function texto(sel, valor) {
    var els = document.querySelectorAll(sel)
    for (var i = 0; i < els.length; i++) els[i].textContent = valor
  }
  function soles(n) { n = Number(n) || 0; return n % 1 === 0 ? String(n) : n.toFixed(2) }
  function normalizar(s) {
    var d = String(s || '').replace(/\D/g, '')
    if (/^9\d{8}$/.test(d)) return '51' + d
    if (/^519\d{8}$/.test(d)) return d
    return null
  }
  function mostrar(tel) { var d = tel.replace(/^51/, ''); return d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6) }
  function iniciales(n) {
    var p = String(n || '').trim().split(/\s+/)
    return ((p[0] || '?').charAt(0) + (p[1] ? p[1].charAt(0) : '')).toUpperCase()
  }
  function primerNombre(n) { return String(n || '').trim().split(/\s+/)[0] || '' }
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic']
  function fecha(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''))
    return m ? Number(m[3]) + ' ' + MESES[Number(m[2]) - 1] : ''
  }
  function hoyLima() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
  }
  function nodo(tag, clase, valor) {
    var e = document.createElement(tag)
    if (clase) e.className = clase
    if (valor != null) e.textContent = valor
    return e
  }

  // «Así de fácil»: una sola escena; cada paso cambia la imagen y suma su texto
  // sin borrar los anteriores. Avanza solo y también con el botón.
  var timerPasos = null
  function paso(n) {
    $('v-como').setAttribute('data-paso', String(n))
    $('como-btn').textContent = n >= 3 ? 'Paso 1: elegir amigos' : 'Siguiente →'
    $('como-btn').classList.toggle('pulso', n >= 3)
  }
  function iniciarPasos() {
    var n = 0
    function sig() {
      n += 1; paso(n)
      if (n < 3) timerPasos = setTimeout(sig, 2800)
    }
    paso(0)
    timerPasos = setTimeout(sig, 350)
  }
  function lanzarConfeti() {
    var caja = $('confeti')
    caja.textContent = ''
    var gana = estado && (Number(estado.saldo) > 0 || Number(estado.ganado_invitando) > 0)
    if (!gana || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    for (var i = 0; i < 18; i++) {
      var c = document.createElement('i')
      c.style.left = (Math.random() * 100) + '%'
      c.style.animationDelay = (Math.random() * 1.6) + 's'
      c.style.setProperty('--dx', (Math.random() * 16 - 8) + 'cqw')
      caja.appendChild(c)
    }
  }

  function ver(nombre) {
    var vistas = ['cargando', 'error', 'bienvenida', 'como', 'elegir', 'enviar', 'saldo', 'cuenta']
    for (var i = 0; i < vistas.length; i++) $('v-' + vistas[i]).classList.toggle('oculto', vistas[i] !== nombre)
    document.body.className = 'v-' + nombre
    clearTimeout(timerPasos)
    if (nombre === 'como') iniciarPasos()
    if (nombre === 'saldo') { pintarSaldo(); lanzarConfeti() }
    if (nombre === 'cuenta') pintarCuenta()
    window.scrollTo(0, 0)
  }
  function fallar(msg) { if (msg) $('error-texto').textContent = msg; ver('error') }

  function api(cuerpo) {
    return fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, json: j } }) })
  }

  // ── Paso 1: elegir ──
  function pintarElegidos() {
    var cont = $('elegidos')
    cont.textContent = ''
    elegidos.forEach(function (c, i) {
      var fila = document.createElement('div'); fila.className = 'contacto'
      var av = document.createElement('span'); av.className = 'av'; av.textContent = iniciales(c.nombre || '#')
      var t = document.createElement('div'); t.className = 't'; t.textContent = c.nombre || 'Sin nombre'
      var s = document.createElement('small'); s.textContent = mostrar(c.telefono); t.appendChild(s)
      var x = document.createElement('button'); x.className = 'quitar'; x.type = 'button'; x.textContent = '✕'
      x.setAttribute('aria-label', 'Quitar')
      x.addEventListener('click', function () { elegidos.splice(i, 1); pintarElegidos() })
      fila.appendChild(av); fila.appendChild(t); fila.appendChild(x); cont.appendChild(fila)
    })
    var b = $('guardar')
    b.disabled = elegidos.length === 0
    b.textContent = 'Paso 2: enviar invitaciones' + (elegidos.length ? ' (' + elegidos.length + ')' : '')
  }
  function agregar(nombre, tel) {
    var n = normalizar(tel)
    if (!n) return false
    for (var i = 0; i < elegidos.length; i++) if (elegidos[i].telefono === n) return true
    if (elegidos.length >= 50) return false
    elegidos.push({ nombre: String(nombre || '').slice(0, 60), telefono: n })
    return true
  }

  // La agenda del celular solo se puede abrir desde Chrome: Brave y Opera
  // muestran el botón pero no abren nada. En ellos se ofrece abrir Chrome.
  var ua = navigator.userAgent || ''
  var esAndroid = /Android/i.test(ua)
  var esChrome = !/OPR\/|Opera|OPT\/|Brave|EdgA|SamsungBrowser|DuckDuckGo|Firefox/i.test(ua) && !navigator.brave
  var soportaAgenda = 'contacts' in navigator && 'ContactsManager' in window && esChrome
  function abrirEnChrome() {
    if (!esAndroid || esChrome) return
    $('abrir-chrome').href = 'intent://' + location.host + location.pathname + location.search + location.hash +
      '#Intent;scheme=https;package=com.android.chrome;end'
    $('abrir-chrome').classList.remove('oculto')
  }
  if (!soportaAgenda) {
    $('agenda').classList.add('oculto')
    $('o-escribe').textContent = 'o escribe el celular de tu amigo'
    abrirEnChrome()
  }

  // Invitar por el selector de WhatsApp: sus chats frecuentes salen primero y
  // se marcan varios, como en cualquier envío de WhatsApp.
  $('compartir').addEventListener('click', function () {
    if (!estado) return
    var msg = mensajeAmigo('')
    function listo() { $('compartido').classList.remove('oculto'); $('terminar').classList.remove('oculto') }
    function viaWa() { window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); listo() }
    if (navigator.share) {
      navigator.share({ text: msg }).then(listo).catch(function (e) {
        if (!e || e.name !== 'AbortError') viaWa()
      })
    } else viaWa()
  })

  $('enviar-todos').addEventListener('click', function () {
    var msg = mensajeAmigo('')
    if (navigator.share) {
      navigator.share({ text: msg }).catch(function (e) {
        if (!e || e.name !== 'AbortError') window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener')
      })
    } else window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener')
  })
  $('como-btn').addEventListener('click', function () {
    var n = Number($('v-como').getAttribute('data-paso')) || 0
    if (n >= 3) { ver('elegir'); return }
    clearTimeout(timerPasos)
    paso(n + 1)
  })

  $('agenda').addEventListener('click', function () {
    $('error-elegir').textContent = ''
    function sinAgenda() {
      $('error-elegir').textContent = 'Usa «Invitar por WhatsApp», escribe el celular aquí abajo o abre el enlace en Chrome si no aparece tu agenda acá.'
      abrirEnChrome()
      $('agenda').classList.add('oculto')
      $('numero').focus()
    }
    var pedido, inicio = Date.now()
    try { pedido = navigator.contacts.select(['name', 'tel'], { multiple: true }) } catch (e) { sinAgenda(); return }
    pedido.then(function (lista) {
      var malos = 0
      lista.forEach(function (c) {
        var tels = c.tel || []
        var ok = false
        for (var i = 0; i < tels.length && !ok; i++) ok = agregar(c.name && c.name[0], tels[i])
        if (!ok) malos++
      })
      if (malos) $('error-elegir').textContent = malos + ' contacto(s) sin celular válido no se agregaron.'
      pintarElegidos()
    }).catch(function (e) {
      // Cerrar la agenda es normal (AbortError); cualquier otra cosa: se avisa.
      // Si "se cerró" al instante, el navegador la bloqueó: no la abrió nadie.
      if (!e || e.name !== 'AbortError' || Date.now() - inicio < 700) sinAgenda()
    })
  })
  $('agregar').addEventListener('click', function () {
    var input = $('numero')
    if (agregar('', input.value)) { input.value = ''; $('error-elegir').textContent = '' }
    else $('error-elegir').textContent = 'Escribe un celular de 9 dígitos que empiece en 9.'
    pintarElegidos()
  })
  $('numero').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('agregar').click() })

  $('guardar').addEventListener('click', function () {
    var b = $('guardar')
    b.disabled = true; b.textContent = 'Guardando…'
    api({ accion: 'invitar', token: token, contactos: elegidos }).then(function (r) {
      if (!r.ok || !r.json || r.json.activo === false) throw new Error('no')
      pintarEnvio(r.json.guardados || [], r.json.rechazados || [])
      elegidos = []; pintarElegidos()
      ver('enviar')
    }).catch(function () {
      $('error-elegir').textContent = 'No se pudo guardar. Revisa tu internet e inténtalo otra vez, ¡tus premios esperan por ti!'
      pintarElegidos()
    })
  })

  // ── Paso 2: enviar ──
  function mensajeAmigo(nombre) {
    var quien = primerNombre(estado.nombre)
    var hola = primerNombre(nombre)
    return '¡Hola' + (hola ? ' ' + hola : '') + '! Soy ' + (quien || 'tu amigo') + '. Yo pido mi gas y agua a LEONGAS y llega rapidito 🔥 ' +
      'Pide con mi invitación y tendrás promociones esperando por ti.\n\n' +
      '📞 Llama: 999 995 646\n\n' +
      '💬 Pide por WhatsApp:\nhttps://wa.me/' + LEONGAS + '?text=Hola%20LEONGAS,%20codigo%20' + encodeURIComponent(estado.codigo) + '\n\n' +
      '🎁 Mira tus promociones:\n' + SITIO + '/a/?c=' + encodeURIComponent(estado.codigo)
  }
  function pintarEnvio(guardados, rechazados) {
    var cont = $('por-enviar')
    cont.textContent = ''
    guardados.forEach(function (c) {
      var fila = document.createElement('div'); fila.className = 'contacto'
      var av = document.createElement('span'); av.className = 'av'; av.textContent = iniciales(c.nombre || '#')
      var t = document.createElement('div'); t.className = 't'; t.textContent = c.nombre || 'Sin nombre'
      var s = document.createElement('small'); s.textContent = mostrar(c.telefono); t.appendChild(s)
      var a = document.createElement('a'); a.className = 'send'
      a.href = 'https://wa.me/' + c.telefono + '?text=' + encodeURIComponent(mensajeAmigo(c.nombre))
      a.target = '_blank'; a.rel = 'noopener'
      var boton = document.createElement('button'); boton.type = 'button'
      boton.className = enviados[c.telefono] ? 'enviado' : 'enviar'
      boton.textContent = enviados[c.telefono] ? 'Enviado ✓' : 'Enviar ▶'
      boton.addEventListener('click', function () {
        enviados[c.telefono] = true
        boton.className = 'enviado'; boton.textContent = 'Enviado ✓'
        window.open(a.href, '_blank', 'noopener')
        progreso(guardados.length)
      })
      // Respaldo para quien usa WhatsApp Business: el menú de compartir lista ambos.
      var otro = document.createElement('button'); otro.type = 'button'; otro.className = 'enviar'
      otro.textContent = '⋯'; otro.title = 'Enviar con otro WhatsApp'; otro.setAttribute('aria-label', 'Enviar con otro WhatsApp')
      otro.addEventListener('click', function () {
        var texto = mensajeAmigo(c.nombre)
        enviados[c.telefono] = true
        boton.className = 'enviado'; boton.textContent = 'Enviado ✓'
        if (navigator.share) navigator.share({ text: texto }).catch(function () {})
        else if (navigator.clipboard) navigator.clipboard.writeText(texto).then(function () { alert('Mensaje copiado. Pégalo en WhatsApp.') })
        progreso(guardados.length)
      })
      fila.appendChild(av); fila.appendChild(t); fila.appendChild(boton); fila.appendChild(otro); cont.appendChild(fila)
    })
    var motivos = { numero_invalido: 'número no válido', es_tu_numero: 'es tu propio número',
      limite_diario: 'llegaste al límite de hoy' }
    $('rechazados').textContent = rechazados.length
      ? 'No se agregaron: ' + rechazados.map(function (r) {
        return (normalizar(r.telefono) ? mostrar(normalizar(r.telefono)) : r.telefono) + ' (' + (motivos[r.motivo] || 'no válido') + ')'
      }).join(', ')
      : ''
    progreso(guardados.length)
  }
  function progreso(total) {
    var n = 0
    for (var k in enviados) if (enviados[k]) n++
    $('progreso').textContent = total
      ? '🔥 ' + Math.min(n, total) + ' de ' + total + ' enviadas. Cuando tus amigos pidan, tu descuento te espera en tu próxima compra.'
      : 'No quedó nadie por invitar.'
  }

  // ── Saldo ──
  // El enlace "web" lo vio quien llenó el registro: solo muestra lo que ganó
  // invitando. Lo personal (saldo, escalera, compras) llega con el enlace que
  // LEONGAS manda por WhatsApp a su celular después de su primera compra.
  function pintarSaldo() {
    var web = estado.vista !== 'app'
    var monto = web ? estado.ganado_invitando : estado.saldo
    $('saldo').textContent = soles(monto)
    $('saldo-titulo').textContent = Number(monto) > 0 ? '¡vas ganando!' : 'tus premios están activos!'
    $('tv-codigo').textContent = estado.codigo || ''
    var pidieron = (estado.invitados || []).filter(function (i) { return i.estado === 'compro' }).length
    var sellos = $('sellos')
    sellos.textContent = ''
    for (var k = 0; k < 10; k++) {
      var sl = document.createElement('i')
      if (k < pidieron) { sl.className = 'on'; sl.textContent = '🔥'; sl.style.animationDelay = (0.25 + k * 0.08) + 's' }
      sellos.appendChild(sl)
    }
    $('tv-amigos').textContent = pidieron === 1 ? '1 amigo ya pidió' : pidieron + ' amigos ya pidieron'
    $('tv-puntos').classList.toggle('oculto', typeof estado.puntos !== 'number')
    if (typeof estado.puntos === 'number') $('tv-puntos').textContent = '⭐ ' + estado.puntos + ' puntos'
    $('saldo-sub').textContent = web ? 'ganados por tus amigos, para tus compras' : 'de descuento para tu próximo balón'
    $('ver-cuenta').classList.toggle('oculto', web)
    $('aviso-web').classList.toggle('oculto', !web)
    if (web) {
      $('aviso-web').textContent = 'Aun no tienes compras, pide tus premios y promociones con nosotros! ¡Nosotros premiamos tu preferencia!'
    }
    var uso = !web && Number(estado.saldo) === 0 && estado.ultimo_uso
    $('ultimo-uso').classList.toggle('oculto', !uso)
    if (uso) {
      $('ultimo-uso').textContent = 'La última vez ahorraste S/' + soles(estado.ultimo_uso.monto) + ' (' +
        fecha(estado.ultimo_uso.fecha) + '). Invita a más amigos y sigue ahorrando.'
    }
    var e = !web && estado.escalera
    $('escalera').classList.toggle('oculto', !e)
    if (e) {
      var hasta = e.racha_hasta && e.racha_hasta >= hoyLima()
      $('escalera').textContent = !e.racha_hasta
        ? '🎁 Tu próxima compra tiene S/' + soles(e.segunda) + ' de descuento! Reclama tu descuento HOY! Nosotros premiamos tu preferencia.'
        : hasta
          ? '🎁 Tu próxima compra tiene S/' + soles(e.racha) + ' de descuento! Reclama tu descuento HOY! Nosotros premiamos tu preferencia.'
          : '🎁 Hoy te ofrecemos S/' + soles(e.segunda) + ' de descuento en tu compra, no olvides que nosotros premiamos tu preferencia.'
    }
    var cont = $('invitados')
    cont.textContent = ''
    var marca = { compro: ['ok', '✓', ' ya pidió · Tus ahorros van creciendo!'], pendiente: ['espera', '…', ' todavía no pide'],
      vencida: ['espera', '–', ' su invitación venció, vuelve a invitarlo para seguir ahorrando.'] }
    ;(estado.invitados || []).slice(0, 30).forEach(function (i) {
      var m = marca[i.estado] || marca.pendiente
      var fila = document.createElement('div'); fila.className = 'tarjeta'
      var n = document.createElement('span'); n.className = 'num ' + m[0]; n.textContent = m[1]
      var t = document.createElement('span')
      var b = document.createElement('strong'); b.textContent = i.nombre
      t.appendChild(b); t.appendChild(document.createTextNode(m[2]))
      fila.appendChild(n); fila.appendChild(t); cont.appendChild(fila)
    })
  }

  // ── Mi LEONGAS ──
  function pintarCuenta() {
    var h = estado.historial || {}
    var g = h.gas
    $('gas').classList.toggle('oculto', !g)
    if (g) {
      $('gas-texto').textContent = 'Tu balón de ' + g.kg + ' kg te dura unos ' + g.dias_por_balon + ' días. ' +
        'Tu próximo pedido sería cerca del ' + fecha(g.proximo) + '.'
    }
    var a = h.ahorro || { total: 0, ultimos_12m: {} }
    $('ahorro-titulo').textContent = 'Ahorraste S/' + soles(a.total) + ' con LEONGAS'
    // Con poca historia una proyección engaña (1 mes con S/10 no son S/120 al año).
    var nCompras = (h.compras || []).length
    $('ahorro-detalle').textContent = Number(a.meses_cliente) >= 12
      ? 'En promedio, S/' + soles(Math.round(a.promedio_anual)) + ' al año.'
      : Number(a.meses_cliente) >= 3 && nCompras >= 2
        ? 'A este ritmo, unos S/' + soles(Math.round(a.promedio_anual)) + ' al año.'
        : 'Cada compra con LEONGAS y AQUAVIDA suma a tu ahorro.'
    var p = a.ultimos_12m || {}
    var partes = $('ahorro-partes')
    partes.textContent = ''
    ;[['Por invitar amigos', p.invitar], ['Por tu promo de invitado', p.promo], ['Otras promociones', p.otras]]
      .forEach(function (x) {
        if (!(Number(x[1]) > 0)) return
        var fila = nodo('div', 'compra')
        fila.appendChild(nodo('span', null, x[0]))
        fila.appendChild(nodo('span', 'monto ahorro', 'S/' + soles(x[1])))
        partes.appendChild(fila)
      })
    var lista = $('compras')
    lista.textContent = ''
    ;(h.compras || []).forEach(function (c) {
      var fila = nodo('div', 'compra')
      var izq = nodo('span', null, c.productos)
      izq.appendChild(nodo('small', null, fecha(c.fecha)))
      var der = nodo('span', 'monto', 'S/' + soles(c.pagado))
      if (Number(c.ahorro) > 0) der.appendChild(nodo('small', 'ahorro', 'ahorraste S/' + soles(c.ahorro)))
      fila.appendChild(izq); fila.appendChild(der); lista.appendChild(fila)
    })
    if (!(h.compras || []).length) lista.appendChild(nodo('p', 'chico', 'Todavía no hay compras.'))
  }

  // ── Arranque ──
  var botones = document.querySelectorAll('[data-ir]')
  for (var i = 0; i < botones.length; i++) {
    botones[i].addEventListener('click', function (e) { ver(e.currentTarget.getAttribute('data-ir')) })
  }
  if (!/^[A-Za-z0-9]{12}$/.test(token)) { fallar(); return }
  api({ accion: 'estado', token: token }).then(function (r) {
    if (r.status === 404) return fallar()
    if (!r.ok || !r.json) throw new Error('no')
    if (r.json.activo === false) return fallar('El programa está en pausa por ahora. ¡Gracias por tu interés!')
    estado = r.json
    texto('.js-nombre', estado.nombre || 'amigo')
    texto('.js-premio', soles(estado.premio))
    texto('.js-racha', soles(estado.promo_racha))
    pintarElegidos()
    $('ver-cuenta-b').classList.toggle('oculto', estado.vista !== 'app')
    var conAlgo = (estado.invitados || []).length || Number(estado.saldo) > 0 || Number(estado.ganado_invitando) > 0 ||
      (estado.vista === 'app' && estado.escalera)
    ver(conAlgo ? 'saldo' : 'bienvenida')
  }).catch(function () { fallar('No hay conexión. Revisa tu internet y vuelve a abrir el enlace.') })
})()
