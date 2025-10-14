

class CPF {
  constructor(cpf) {
    this.cpf = cpf.replace(/\D/g, '');
    if (this.cpf.length !== 11) {
      throw new Error('CPF deve conter 11 dígitos');
    }
    
    if (/^(\d)\1{10}$/.test(this.cpf)) {
      throw new Error('CPF não pode ter todos os dígitos iguais');
    }
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(this.cpf[i]) * (10 - i);
    }
    let digito1 = 11 - (soma % 11);
    if (digito1 > 9) digito1 = 0;
    
    if (digito1 !== parseInt(this.cpf[9])) {
      throw new Error('Primeiro dígito verificador incorreto');
    }
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(this.cpf[i]) * (11 - i);
    }
    let digito2 = 11 - (soma % 11);
    if (digito2 > 9) digito2 = 0;
    
    if (digito2 !== parseInt(this.cpf[10])) {
      throw new Error('Segundo dígito verificador incorreto');
    }    
  }

  getCPF() {
    return this.cpf;
  }

  getCPFFormatado() {
    return this.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}


class Conta {
  constructor(nome, sobrenome, cpf, email, senha) {
    this.nome = nome;
    this.sobrenome = sobrenome;
    this.cpf = cpf;
    this.email = email;
    this.senha = senha;
    this.dataCriacao = new Date();
  }

  getNomeCompleto() {
    return this.nome + ' ' + this.sobrenome;
  }
}


class GerenciadorContas {
  constructor() {
    this.contas = new Map();
    this.contaAtual = null;
  }

  adicionarConta(conta) {
    this.contas.set(conta.email, conta);
  }

  buscarContaPorEmail(email) {
    return this.contas.get(email);
  }

  autenticar(email, senha) {
    const conta = this.buscarContaPorEmail(email);
    if (conta && conta.senha === senha) {
      this.contaAtual = conta;
      return true;
    }
    return false;
  }

  logout() {
    this.contaAtual = null;
  }

  getContaAtual() {
    return this.contaAtual;
  }

  getTotalContas() {
    return this.contas.size;
  }

  listarTodasContas() {
    return Array.from(this.contas.values());
  }

  emailJaCadastrado(email) {
    return this.contas.has(email);
  }
}


const gerenciador = new GerenciadorContas();


window.addEventListener('DOMContentLoaded', function() {
  criarPaginaConta();
  mostrarApenasHome();
  configurarLoginForm();
  configurarNovaContaForm();
});


function criarPaginaConta() {
  if (document.getElementById('pagina-conta')) return;

  const main = document.querySelector('main');
  const paginaConta = document.createElement('div');
  paginaConta.id = 'pagina-conta';
  paginaConta.style.display = 'none';
  
  paginaConta.innerHTML = `
    <h1><i class="menuIcon material-icons">account_circle</i> Minha Conta</h1>
    <div class="info-conta">
      <h2>Informações da Conta</h2>
      <p><strong>Nome Completo:</strong> <span id="info-nome"></span></p>
      <p><strong>Email:</strong> <span id="info-email"></span></p>
      <p><strong>CPF:</strong> <span id="info-cpf"></span></p>
      <p><strong>Data de Criação:</strong> <span id="info-data"></span></p>
      <button id="botao-logout" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
        <i class="menuIcon material-icons">logout</i> Sair
      </button>
    </div>
  `;
  
  main.appendChild(paginaConta);
  document.getElementById('botao-logout').addEventListener('click', logout);
}


function mostrarApenasHome() {
  document.getElementById('divHome').style.display = 'block';
  document.getElementById('login-body').style.display = 'none';
  document.getElementById('nova-conta').style.display = 'none';
  document.getElementById('pagina-conta').style.display = 'none';
}


function mostrarApenasLogin() {
  document.getElementById('divHome').style.display = 'none';
  document.getElementById('login-body').style.display = 'block';
  document.getElementById('nova-conta').style.display = 'none';
  document.getElementById('pagina-conta').style.display = 'none';
  resetarLoginForm();
}


function mostrarApenasConta() {
  document.getElementById('divHome').style.display = 'none';
  document.getElementById('login-body').style.display = 'none';
  document.getElementById('nova-conta').style.display = 'block';
  document.getElementById('pagina-conta').style.display = 'none';
  resetarNovaContaForm();
}


function mostrarPaginaConta() {
  const conta = gerenciador.getContaAtual();
  if (!conta) return;

  document.getElementById('divHome').style.display = 'none';
  document.getElementById('login-body').style.display = 'none';
  document.getElementById('nova-conta').style.display = 'none';
  document.getElementById('pagina-conta').style.display = 'block';
  
  document.getElementById('info-nome').textContent = conta.getNomeCompleto();
  document.getElementById('info-email').textContent = conta.email;
  document.getElementById('info-cpf').textContent = conta.cpf.getCPFFormatado();
  document.getElementById('info-data').textContent = conta.dataCriacao.toLocaleString('pt-BR');
}


function logout() {
  gerenciador.logout();
  mostrarApenasHome();
  alert('Logout realizado com sucesso!');
}


function resetarLoginForm() {
  const loginForm = document.querySelector('#login-body form');
  loginForm.reset();
  document.getElementById('botaoLogin').disabled = true;
    
  senhaVisivel = false;
  document.getElementById('login-password').type = 'password';
  document.getElementById('olho').src = 'https://cdn0.iconfinder.com/data/icons/ui-icons-pack/100/ui-icon-pack-14-512.png';
}


function configurarLoginForm() {
  const emailInput = document.querySelector('#login-body input[type="text"]');
  const senhaInput = document.getElementById('login-password');
  const botaoLogin = document.getElementById('botaoLogin');

  // Validação em tempo real
  function validarLoginForm() {
    const email = emailInput.value.trim();
    const senha = senhaInput.value;
    
    // Verifica se ambos os campos têm conteúdo e se o email contém exatamente um @
    const emailValido = email.length > 0 && (email.match(/@/g) || []).length === 1;
    const senhaValida = senha.length > 0;
    
    botaoLogin.disabled = !(emailValido && senhaValida);
  }

  emailInput.addEventListener('input', validarLoginForm);
  senhaInput.addEventListener('input', validarLoginForm);

  // Prevenir submit e fazer login
  document.querySelector('#login-body form').addEventListener('submit', function(e) {
    e.preventDefault();
  });

  botaoLogin.addEventListener('click', function(e) {
    e.preventDefault();
    fazerLogin();
  });
}


function fazerLogin() {
  const emailInput = document.querySelector('#login-body input[type="text"]');
  const senhaInput = document.getElementById('login-password');
  
  const email = emailInput.value.trim();
  const senha = senhaInput.value;

  if (gerenciador.autenticar(email, senha)) {
    alert('Login realizado com sucesso!');
    mostrarPaginaConta();
  } else {
    alert('Email ou senha incorretos!');
  }
}


let senhaVisivel = false;

function toggleSenha() {
  const senhaInput = document.getElementById('login-password');
  const olho = document.getElementById('olho');
  
  if (!senhaInput || !olho) return;
  
  if (senhaVisivel) {
    // Ocultar senha
    senhaVisivel = false;
    senhaInput.type = 'password';
    olho.src = 'https://cdn0.iconfinder.com/data/icons/ui-icons-pack/100/ui-icon-pack-14-512.png';
  } else {
    // Mostrar senha
    senhaVisivel = true;
    senhaInput.type = 'text';
    olho.src = 'https://cdn0.iconfinder.com/data/icons/ui-icons-pack/100/ui-icon-pack-15-512.png';
  }
}

// Manter funções antigas para compatibilidade com HTML
function mostrarSenha() {
  const senhaInput = document.getElementById('login-password');
  const olho = document.getElementById('olho');
  
  if (!senhaInput || !olho) return;
  
  senhaVisivel = true;
  senhaInput.type = 'text';
  olho.src = 'https://cdn0.iconfinder.com/data/icons/ui-icons-pack/100/ui-icon-pack-15-512.png';
}

function ocultarSenha() {
  const senhaInput = document.getElementById('login-password');
  const olho = document.getElementById('olho');
  
  if (!senhaInput || !olho) return;
  
  senhaVisivel = false;
  senhaInput.type = 'password';
  olho.src = 'https://cdn0.iconfinder.com/data/icons/ui-icons-pack/100/ui-icon-pack-14-512.png';
}


window.addEventListener('DOMContentLoaded', function() {
  const senhaInput = document.getElementById('login-password');
  const olho = document.getElementById('olho');
  
  if (olho) {
    olho.onmousedown = null;
    olho.onmouseup = null;
    
    olho.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleSenha();
    });
    
    olho.style.cursor = 'pointer';
  }
    
  if (senhaInput) {
    senhaInput.addEventListener('blur', function() {
      if (senhaVisivel) {
        ocultarSenha();
      }
    });
  }
});



function resetarNovaContaForm() {
  const form = document.querySelector('#nova-conta form');
  form.reset();
    
  document.getElementById('statusNome').innerHTML = '';
  document.getElementById('statusSobrenome').innerHTML = '';
  document.getElementById('statusCPF').innerHTML = '';
  document.getElementById('statusEmail').innerHTML = '';
  document.getElementById('statusSenha').innerHTML = '';
  document.getElementById('statusRepitaSenha').innerHTML = '';
    
  const inputs = document.querySelectorAll('#nova-conta input[type="text"], #nova-conta input[type="password"]');
  inputs.forEach(input => {
    input.dataset.valido = 'false';
  });
    
  document.querySelector('#nova-conta input[type="button"]').disabled = true;
}

function configurarNovaContaForm() {
  const inputs = document.querySelectorAll('#nova-conta input[type="text"], #nova-conta input[type="password"]');
  const botaoCriar = document.querySelector('#nova-conta input[type="button"]');
    
  inputs[3].addEventListener('blur', function() {
    validaEmail(this);
  });
    
  inputs[4].addEventListener('blur', function() {
    validaSenha();
  });
  
  inputs[5].addEventListener('blur', function() {
    validaConfirmacaoSenha();
  });
    
  botaoCriar.addEventListener('click', function() {
    criarNovaConta();
  });
  
  // Add input listeners to check if button should be enabled
  inputs.forEach(input => {
    input.addEventListener('input', verificarTodosCamposValidos);
  });
}

function validaTextoEmBranco(input, statusId, nomeCampo) {
  const status = document.getElementById(statusId);
  const valor = input.value.trim();
  
  if (valor === '') {
    status.innerHTML = nomeCampo + ' não pode estar vazio';
    status.style.color = 'red';
    input.dataset.valido = 'false';
  } else {
    status.innerHTML = nomeCampo + ' válido';
    status.style.color = 'green';
    input.dataset.valido = 'true';
  }
  
  verificarTodosCamposValidos();
}

function validarCPF(input) {
  const status = document.getElementById('statusCPF');
  
  try {
    new CPF(input.value);
    status.innerHTML = 'CPF válido';
    status.style.color = 'green';
    input.dataset.valido = 'true';
  } catch (error) {
    status.innerHTML = error.message;
    status.style.color = 'red';
    input.dataset.valido = 'false';
  }
  
  verificarTodosCamposValidos();
}


function validaEmail(input) {
  const status = document.getElementById('statusEmail');
  const email = input.value.trim();
  
  if (email === '') {
    status.innerHTML = 'E-mail não pode estar vazio';
    status.style.color = 'red';
    input.dataset.valido = 'false';
  } else if ((email.match(/@/g) || []).length !== 1) {
    status.innerHTML = 'E-mail inválido!';
    status.style.color = 'red';
    input.dataset.valido = 'false';
  } else {
    if (gerenciador.emailJaCadastrado(email)) {
      status.innerHTML = 'Este e-mail já está cadastrado';
      status.style.color = 'red';
      input.dataset.valido = 'false';
    } else {
      status.innerHTML = 'E-mail válido';
      status.style.color = 'green';
      input.dataset.valido = 'true';
    }
  }
  
  verificarTodosCamposValidos();
}

function validaSenha() {
  const inputs = document.querySelectorAll('#nova-conta input[type="password"]');
  const senha = inputs[0].value;
  const status = document.getElementById('statusSenha');
  
  if (senha === '') {
    status.innerHTML = 'Senha não pode estar vazia';
    status.style.color = 'red';
    inputs[0].dataset.valido = 'false';
  } else {
    let forca = 0;

    if (senha.length >= 8) 
        forca++;
    if (/[a-z]/.test(senha)) 
        forca++;
    if (/[A-Z]/.test(senha)) 
        forca++;
    if (/[0-9]/.test(senha)) 
        forca++;
    if (/[^a-zA-Z0-9]/.test(senha)) 
        forca++;
    
    const niveis = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
    status.innerHTML = 'Senha válida - Força: ' + niveis[forca - 1];
    status.style.color = 'green';
    inputs[0].dataset.valido = 'true';
  }
    
  if (inputs[1].value !== '') {
    validaConfirmacaoSenha();
  }
  
  verificarTodosCamposValidos();
}

function validaConfirmacaoSenha() {
  const inputs = document.querySelectorAll('#nova-conta input[type="password"]');
  const senha1 = inputs[0].value;
  const senha2 = inputs[1].value;
  const status = document.getElementById('statusRepitaSenha');
  
  if (senha2 === '') {
    status.innerHTML = 'Confirmação de senha não pode estar vazia';
    status.style.color = 'red';
    inputs[1].dataset.valido = 'false';
  } else if (senha1 !== senha2) {
    status.innerHTML = 'As senhas não são iguais';
    status.style.color = 'red';
    inputs[1].dataset.valido = 'false';
  } else {
    status.innerHTML = 'Senhas iguais!';
    status.style.color = 'green';
    inputs[1].dataset.valido = 'true';
  }
  
  verificarTodosCamposValidos();
}


function verificarTodosCamposValidos() {
  const inputs = document.querySelectorAll('#nova-conta input[type="text"], #nova-conta input[type="password"]');
  const botaoCriar = document.querySelector('#nova-conta input[type="button"]');
  
  let todosValidos = true;
  inputs.forEach(input => {
    if (input.dataset.valido !== 'true') {
      todosValidos = false;
    }
  });
  
  botaoCriar.disabled = !todosValidos;
}


function criarNovaConta() {
  const inputs = document.querySelectorAll('#nova-conta input[type="text"], #nova-conta input[type="password"]');
  
  const nome = inputs[0].value.trim();
  const sobrenome = inputs[1].value.trim();
  const cpfObj = new CPF(inputs[2].value);
  const email = inputs[3].value.trim();
  const senha = inputs[4].value;
  
  const novaConta = new Conta(nome, sobrenome, cpfObj, email, senha);
  gerenciador.adicionarConta(novaConta);
  
  console.log("Nova conta criada:", novaConta);
  console.log("Total de contas:", gerenciador.getTotalContas());
  console.log("Todas as contas:", gerenciador.listarTodasContas());
  
  alert('Conta criada com sucesso! Agora você pode fazer login.');
  mostrarApenasLogin();
}