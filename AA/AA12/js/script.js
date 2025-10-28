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
  constructor(nome, sobrenome, cpf, email, senha, cep, logradouro, bairro, municipio, estado) {
    this.nome = nome;
    this.sobrenome = sobrenome;
    this.cpf = cpf;
    this.email = email;
    this.senha = senha;
    this.cep = cep;
    this.logradouro = logradouro;
    this.bairro = bairro;
    this.municipio = municipio;
    this.estado = estado;
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
      <p><strong>CEP:</strong> <span id="info-cep"></span></p>
      <p><strong>Endereço:</strong> <span id="info-endereco"></span></p>
      <p><strong>Data de Criação:</strong> <span id="info-data"></span></p>
      
      <h2 style="margin-top: 30px;">Consultar Localidades (IBGE)</h2>
      <div style="margin-top: 10px;">
        <label for="select-uf">Estado (UF):</label>
        <select id="select-uf" style="padding: 5px; min-width: 250px;">
          <option value="">Selecione um Estado</option>
        </select>
      </div>
      <div style="margin-top: 10px;">
        <label for="select-municipio">Município:</label>
        <select id="select-municipio" style="padding: 5px; min-width: 250px;" disabled>
          <option value="">Selecione um Município</option>
        </select>
      </div>
      <button id="botao-logout" style="margin-top: 30px; padding: 10px 20px; cursor: pointer;">
        <i class="menuIcon material-icons">logout</i> Sair
      </button>
    </div>
  `;
  
  main.appendChild(paginaConta);
  document.getElementById('botao-logout').addEventListener('click', logout);

  document.getElementById('select-uf').addEventListener('change', function() {
    const ufId = this.value;
    const selectMunicipio = document.getElementById('select-municipio');
    if (ufId) {
      carregarMunicipios(ufId);
    } else {
      selectMunicipio.innerHTML = '<option value="">Selecione um Município</option>';
      selectMunicipio.disabled = true;
    }
  });

  carregarUFs();
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
  document.getElementById('info-cep').textContent = conta.cep;
  document.getElementById('info-endereco').textContent = `${conta.logradouro}, ${conta.bairro} - ${conta.municipio}/${conta.estado}`;
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

  function validarLoginForm() {
    const email = emailInput.value.trim();
    const senha = senhaInput.value;
    
    const emailValido = email.length > 0 && (email.match(/@/g) || []).length === 1;
    const senhaValida = senha.length > 0;
    
    botaoLogin.disabled = !(emailValido && senhaValida);
  }

  emailInput.addEventListener('input', validarLoginForm);
  senhaInput.addEventListener('input', validarLoginForm);

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
    senhaVisivel = false;
    senhaInput.type = 'password';
    olho.src = 'https://cdn0.iconfinder.com/data/icons/ui-icons-pack/100/ui-icon-pack-14-512.png';
  } else {
    senhaVisivel = true;
    senhaInput.type = 'text';
    olho.src = 'https://cdn0.iconfinder.com/data/icons/ui-icons-pack/100/ui-icon-pack-15-512.png';
  }
}

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
  
  document.getElementById('statusCEPViacep').innerHTML = '';
  document.getElementById('statusLogradouro').innerHTML = '';
  document.getElementById('statusBairro').innerHTML = '';
  document.getElementById('statusMunicipio').innerHTML = '';
  document.getElementById('statusEstado').innerHTML = '';
    
  const inputs = document.querySelectorAll('#nova-conta input[type="text"], #nova-conta input[type="password"]');
  inputs.forEach(input => {
    input.dataset.valido = 'false';
    if (input.id === 'logradouro' || input.id === 'bairro' || input.id === 'municipio' || input.id === 'estado') {
        input.readOnly = true;
    }
  });
    
  document.querySelector('#nova-conta input[type="button"]').disabled = true;
}

function configurarNovaContaForm() {
  const botaoCriar = document.querySelector('#nova-conta input[type="button"]');
    
  document.getElementById('email').addEventListener('blur', function() { validaEmail(this); });
  document.getElementById('senha').addEventListener('blur', function() { validaSenha(); });
  document.getElementById('repitaSenha').addEventListener('blur', function() { validaConfirmacaoSenha(); });
    
  botaoCriar.addEventListener('click', function() {
    criarNovaConta();
  });
  
  const inputs = document.querySelectorAll('#nova-conta input[type="text"], #nova-conta input[type="password"]');
  inputs.forEach(input => {
    input.addEventListener('input', verificarTodosCamposValidos);
    input.addEventListener('blur', verificarTodosCamposValidos);
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
  const senhaInput = document.getElementById('senha');
  const senha = senhaInput.value;
  const status = document.getElementById('statusSenha');
  
  if (senha === '') {
    status.innerHTML = 'Senha não pode estar vazia';
    status.style.color = 'red';
    senhaInput.dataset.valido = 'false';
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
    
    if (forca < 1) forca = 1;
    if (forca > 5) forca = 5;

    const niveis = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
    status.innerHTML = 'Senha válida - Força: ' + niveis[forca - 1];
    status.style.color = 'green';
    senhaInput.dataset.valido = 'true';
  }
    
  if (document.getElementById('repitaSenha').value !== '') {
    validaConfirmacaoSenha();
  }
  
  verificarTodosCamposValidos();
}

function validaConfirmacaoSenha() {
  const senha1 = document.getElementById('senha').value;
  const senha2Input = document.getElementById('repitaSenha');
  const senha2 = senha2Input.value;
  const status = document.getElementById('statusRepitaSenha');
  
  if (senha2 === '') {
    status.innerHTML = 'Confirmação de senha não pode estar vazia';
    status.style.color = 'red';
    senha2Input.dataset.valido = 'false';
  } else if (senha1 !== senha2) {
    status.innerHTML = 'As senhas não são iguais';
    status.style.color = 'red';
    senha2Input.dataset.valido = 'false';
  } else {
    status.innerHTML = 'Senhas iguais!';
    status.style.color = 'green';
    senha2Input.dataset.valido = 'true';
  }
  
  verificarTodosCamposValidos();
}


function verificarTodosCamposValidos() {
  const inputs = document.querySelectorAll(
    '#nova-conta input[type="text"], #nova-conta input[type="password"]'
  );
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
  const nome = document.getElementById('nome').value.trim();
  const sobrenome = document.getElementById('sobrenome').value.trim();
  const cpfObj = new CPF(document.getElementById('cpf').value);
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const cep = document.getElementById('cep').value.trim();
  const logradouro = document.getElementById('logradouro').value.trim();
  const bairro = document.getElementById('bairro').value.trim();
  const municipio = document.getElementById('municipio').value.trim();
  const estado = document.getElementById('estado').value.trim();
  
  const novaConta = new Conta(nome, sobrenome, cpfObj, email, senha, cep, logradouro, bairro, municipio, estado);
  gerenciador.adicionarConta(novaConta);
  
  console.log("Nova conta criada:", novaConta);
  console.log("Total de contas:", gerenciador.getTotalContas());
  console.log("Todas as contas:", gerenciador.listarTodasContas());
  
  alert('Conta criada com sucesso! Agora você pode fazer login.');
  mostrarApenasLogin();
}

function buscarCEP(input) {
  const cep = input.value.replace(/\D/g, '');
  const status = document.getElementById('statusCEPViacep');
  
  const logradouroInput = document.getElementById('logradouro');
  const bairroInput = document.getElementById('bairro');
  const municipioInput = document.getElementById('municipio');
  const estadoInput = document.getElementById('estado');

  function resetarCamposEndereco() {
      logradouroInput.value = '';
      bairroInput.value = '';
      municipioInput.value = '';
      estadoInput.value = '';
      logradouroInput.dataset.valido = 'false';
      bairroInput.dataset.valido = 'false';
      municipioInput.dataset.valido = 'false';
      estadoInput.dataset.valido = 'false';
      input.dataset.valido = 'false';
  }

  if (cep.length !== 8) {
    status.innerHTML = 'CEP deve conter 8 dígitos';
    status.style.color = 'red';
    resetarCamposEndereco();
    verificarTodosCamposValidos();
    return;
  }

  status.innerHTML = 'Buscando...';
  status.style.color = 'blue';

  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => response.json())
    .then(data => {
      if (data.erro) {
        status.innerHTML = 'CEP não encontrado';
        status.style.color = 'red';
        resetarCamposEndereco();
      } else {
        status.innerHTML = 'CEP válido!';
        status.style.color = 'green';
        
        logradouroInput.value = data.logradouro;
        bairroInput.value = data.bairro;
        municipioInput.value = data.localidade;
        estadoInput.value = data.uf;

        input.dataset.valido = 'true';
        logradouroInput.dataset.valido = 'true';
        bairroInput.dataset.valido = 'true';
        municipioInput.dataset.valido = 'true';
        estadoInput.dataset.valido = 'true';
      }
      verificarTodosCamposValidos();
    })
    .catch(error => {
      console.error('Erro ao buscar CEP:', error);
      status.innerHTML = 'Erro ao buscar CEP (verifique a rede)';
      status.style.color = 'red';
      resetarCamposEndereco();
      verificarTodosCamposValidos();
    });
}

async function carregarUFs() {
  const selectUF = document.getElementById('select-uf');
  try {
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
    if (!response.ok) throw new Error('Erro ao buscar UFs');
    const ufs = await response.json();
    
    selectUF.innerHTML = '<option value="">Selecione um Estado</option>';
    
    ufs.forEach(uf => {
      const option = document.createElement('option');
      option.value = uf.id;
      option.textContent = uf.nome;
      selectUF.appendChild(option);
    });

  } catch (error) {
    console.error('Erro ao carregar UFs:', error);
    selectUF.innerHTML = '<option value="">Erro ao carregar UFs</option>';
  }
}

async function carregarMunicipios(ufId) {
  const selectMunicipio = document.getElementById('select-municipio');
  selectMunicipio.innerHTML = '<option value="">Carregando...</option>';
  selectMunicipio.disabled = true;

  try {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufId}/municipios?orderBy=nome`);
    if (!response.ok) throw new Error('Erro ao buscar municípios');
    const municipios = await response.json();

    selectMunicipio.innerHTML = '<option value="">Selecione um Município</option>';
    
    municipios.forEach(municipio => {
      const option = document.createElement('option');
      option.value = municipio.id;
      option.textContent = municipio.nome;
      selectMunicipio.appendChild(option);
    });
    
    selectMunicipio.disabled = false; // Habilita o seletor

  } catch (error) {
    console.error('Erro ao carregar Municípios:', error);
    selectMunicipio.innerHTML = '<option value="">Erro ao carregar municípios</option>';
  }
}