
    const telefoneInput = document.getElementById('telefone');

    telefoneInput.addEventListener('input', function () {
      let numero = this.value.replace(/\D/g, ''); 

      
      if (numero.length > 11) {
        numero = numero.slice(0, 11); 
      }

      if (numero.length > 0) {
        numero = '(' + numero;
      }
      if (numero.length > 3) {
        numero = numero.slice(0, 3) + ') ' + numero.slice(3);
      }
      if (numero.length > 10) {
        numero = numero.slice(0, 10) + '-' + numero.slice(10);
      }

      this.value = numero;
    });