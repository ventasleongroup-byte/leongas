// Prueba de las dos incógnitas del diseño, en el celular real:
// 1) ¿el navegador que abre WhatsApp tiene el selector de contactos?
// 2) ¿WhatsApp arma la vista previa con og:image en un mensaje prellenado?
// Nada sale del teléfono: esta página no tiene conexión a ningún servidor.
(function () {
  var BASE = 'https://ventasleongroup-byte.github.io/leongas'
  var estado = document.getElementById('agenda-estado')
  var lista = document.getElementById('agenda-lista')
  var soporta = 'contacts' in navigator && 'ContactsManager' in window

  document.getElementById('navegador').textContent =
    (soporta ? 'agenda: SÍ' : 'agenda: NO') + ' · ' + navigator.userAgent

  document.getElementById('agenda').addEventListener('click', function () {
    lista.textContent = ''
    if (!soporta) {
      estado.textContent = 'Este navegador no permite abrir la agenda. (Respaldo: escribir los números.)'
      return
    }
    navigator.contacts.select(['name', 'tel'], { multiple: true }).then(function (contactos) {
      estado.textContent = 'Funcionó: elegiste ' + contactos.length + ' contacto(s).'
      contactos.forEach(function (c) {
        var fila = document.createElement('div')
        fila.className = 'contacto'
        var t = document.createElement('div')
        t.className = 't'
        t.textContent = (c.name && c.name[0]) || '(sin nombre)'
        var s = document.createElement('small')
        s.textContent = (c.tel || []).join(' · ') || '(sin número)'
        t.appendChild(s)
        fila.appendChild(t)
        lista.appendChild(fila)
      })
    }).catch(function (e) {
      estado.textContent = 'La agenda dio un error: ' + (e && e.message ? e.message : e)
    })
  })

  var texto = 'Prueba LEONGAS (no enviar): ' + BASE + '/a/?c=PRUEB\n📞 999 995 646'
  document.getElementById('preview').href = 'https://wa.me/?text=' + encodeURIComponent(texto)
})()
