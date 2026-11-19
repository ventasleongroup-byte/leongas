// Página del amigo invitado: arma el enlace de WhatsApp con el código público
// del cliente que lo invitó (?c=K7Q2). El código no abre nada privado: solo
// viaja en el mensaje para saber de quién viene el pedido.
(function () {
  var NUMERO = '51999995646'
  var params = new URLSearchParams(location.search)
  var codigo = (params.get('c') || '').toUpperCase()
  if (!/^[A-Z0-9]{4,6}$/.test(codigo)) codigo = ''
  var texto = 'Hola LEONGAS 👋 Quiero pedir un balón con mi descuento de bienvenida 🎁' +
    (codigo ? ' (código ' + codigo + ')' : '')
  document.getElementById('pedir').href = 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(texto)
})()
