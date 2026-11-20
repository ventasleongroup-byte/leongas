// Página del amigo invitado (?c=123, el código de cliente de quien invita).
// Arma el pedido por WhatsApp con ese código y permite registrarse (celular +
// dirección) para tener su propio enlace de invitar, aunque no compre todavía.
// Todo el texto se pone con textContent.
(function () {
  'use strict'
  var API = 'https://cnychdelfsppsinohkaf.supabase.co/functions/v1/referidos'
  var NUMERO = '51999995646'
  var params = new URLSearchParams(location.search)
  var codigo = (params.get('c') || '').toUpperCase().replace(/\s/g, '')
  if (!/^[A-Z0-9]{1,10}$/.test(codigo)) codigo = ''
  function $(id) { return document.getElementById(id) }
  function wa(texto) { return 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(texto) }

  $('pedir').href = wa('Hola LEONGAS 👋 Quiero pedir un balón, vengo invitado 🎁' +
    (codigo ? ' (código ' + codigo + ')' : ''))

  // Sin código de quien invita no hay registro: solo es para invitados.
  if (!codigo) return
  $('registro').classList.remove('oculto')

  var motivos = {
    celular: 'Escribe un celular de 9 dígitos que empiece en 9.',
    direccion: 'Escribe tu dirección completa.',
    codigo: 'Este enlace de invitación no es válido. Pide a tu amigo que te lo reenvíe.',
    limite: 'Por hoy no podemos registrar más. Inténtalo mañana.',
    apagado: 'El programa está en pausa por ahora.',
  }
  $('form-registro').addEventListener('submit', function (e) {
    e.preventDefault()
    var celular = $('r-celular').value.replace(/\D/g, '').replace(/^51(?=9\d{8}$)/, '')
    var direccion = $('r-direccion').value.trim()
    if (!/^9\d{8}$/.test(celular)) { $('r-error').textContent = motivos.celular; return }
    if (direccion.length < 5) { $('r-error').textContent = motivos.direccion; return }
    var b = $('r-enviar')
    b.disabled = true; b.textContent = 'Guardando…'; $('r-error').textContent = ''
    fetch(API, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accion: 'registrar', codigo: codigo, telefono: celular, direccion: direccion,
        nombre: $('r-nombre').value.trim() }),
    }).then(function (r) { return r.json() }).then(function (j) {
      if (j && j.ok && /^[A-Za-z0-9]{12}$/.test(j.token)) {
        location.href = '../r/#' + j.token
        return
      }
      if (j && j.motivo === 'ya_registrado') {
        $('r-error').textContent = 'Ese celular ya es cliente de LEONGAS. Pide tu enlace por WhatsApp:'
        $('r-wa').href = wa('Hola LEONGAS 👋 Ya soy cliente y quiero mi enlace de Pasa la llama 🔥')
        $('r-wa').classList.remove('oculto')
        $('form-registro').classList.add('oculto')
        return
      }
      $('r-error').textContent = motivos[j && j.motivo] || 'No se pudo guardar. Inténtalo otra vez.'
      b.disabled = false; b.textContent = 'Quiero mi enlace para invitar'
    }).catch(function () {
      $('r-error').textContent = 'No hay conexión. Revisa tu internet e inténtalo otra vez.'
      b.disabled = false; b.textContent = 'Quiero mi enlace para invitar'
    })
  })
})()
