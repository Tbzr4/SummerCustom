// Função para atualizar o valor total
function updateTotal() {
  let total = 0;
  const items = document.querySelectorAll('.item');

  items.forEach(item => {
    const quantityInput = item.querySelector('input.quantity');
    const levelSelect = item.querySelector('select.level');
    const checkbox = item.querySelector('input[type="checkbox"]');
    let price = 0;
    let quantity = parseInt(quantityInput.value) || 1;

    if (levelSelect) {
      // Itens com níveis
      const selectedOption = levelSelect.options[levelSelect.selectedIndex];
      price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
    } else if (checkbox) {
      // Itens com checkbox
      if (checkbox.checked) {
        quantityInput.disabled = false;
        price = parseFloat(checkbox.getAttribute('data-price')) || 0;
      } else {
        quantityInput.disabled = true;
        quantityInput.value = 1;
        quantity = 0; // Não contabilizar se o checkbox não estiver marcado
      }
    }

    total += price * quantity;
  });

  // Atualiza o valor total no HTML
  const totalField = document.getElementById('total');
  totalField.innerText = 'Valor Total: R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Variáveis para o modal
const modal = document.getElementById('modal');
const closeModal = document.getElementById('close-modal');
const confirmBtn = document.getElementById('confirm-btn');
const generateListBtn = document.getElementById('generate-list-btn');
const pasteArea = document.getElementById('paste-area');

let pastedImageBase64 = null; // Variável para armazenar a imagem colada

// Event Listener para o botão "Gerar Nota Fiscal"
generateListBtn.addEventListener('click', () => {
  // Verifica se os campos obrigatórios estão preenchidos
  if (!validateClientAndVehicleInfo()) {
    return;
  }
  // Abre o modal
  modal.style.display = 'block';
});

// Event Listener para fechar o modal
closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
  // Limpa a imagem colada
  pastedImageBase64 = null;
  pasteArea.innerHTML = '<p>Clique aqui e pressione Ctrl+V para colar a imagem do veículo.</p>';
});

// Fecha o modal se o usuário clicar fora do conteúdo
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = 'none';
    // Limpa a imagem colada
    pastedImageBase64 = null;
    pasteArea.innerHTML = '<p>Clique aqui e pressione Ctrl+V para colar a imagem do veículo.</p>';
  }
};

// Event Listener para o botão "Confirmar e Enviar"
confirmBtn.addEventListener('click', () => {
  generateModificationList();
});

// Event Listener para a área de colagem
pasteArea.addEventListener('click', () => {
  pasteArea.focus();
});

pasteArea.addEventListener('paste', (event) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = function(event) {
        pastedImageBase64 = event.target.result;
        pasteArea.innerHTML = `<img src="${pastedImageBase64}" alt="Imagem do Veículo">`;
      };
      reader.readAsDataURL(file);
      break;
    }
  }
});

// Função para validar os dados do cliente e veículo
function validateClientAndVehicleInfo() {
  // Coleta os dados do cliente
  const clienteNome = document.getElementById('nome-cliente').value.trim();
  const clientePassaporte = document.getElementById('passaporte').value.trim();

  // Coleta os dados do veículo
  const carroNome = document.getElementById('modelo-carro').value.trim();

  if (!clienteNome || !clientePassaporte || !carroNome) {
    alert("Por favor, preencha todos os campos do cliente e do veículo.");
    return false;
  }
  return true;
}

// Função para gerar a lista de modificações e enviar ao backend
function generateModificationList() {
  // Coleta os dados do cliente
  const clienteNome = document.getElementById('nome-cliente').value.trim();
  const clientePassaporte = document.getElementById('passaporte').value.trim();

  // Coleta os dados do veículo
  const carroNome = document.getElementById('modelo-carro').value.trim();

  // Coleta o código do mecânico
  const userCode = document.getElementById('user-code').value.trim();

  if (!userCode) {
    alert("Código de segurança é necessário.");
    return;
  }

  // Gera a lista de modificações
  const modificationsList = generateModificationsList();
  const valorTotal = calculateTotalValue();

  if (!modificationsList) {
    alert("Nenhuma modificação selecionada.");
    return;
  }

  // Verifica se a imagem foi colada
  if (!pastedImageBase64) {
    alert("Por favor, cole a imagem do veículo.");
    return;
  }

  // Prepara os dados para enviar ao backend
  const data = {
    clienteNome,
    clientePassaporte,
    carroNome,
    userCode,
    modificationsList,
    valorTotal,
    vehicleImage: pastedImageBase64
  };

  // Envia os dados ao backend
  sendDataToBackend(data);

  // Fecha o modal
  modal.style.display = 'none';
  // Limpa a imagem colada
  pastedImageBase64 = null;
  pasteArea.innerHTML = '<p>Clique aqui e pressione Ctrl+V para colar a imagem do veículo.</p>';
}

// Função para gerar a lista de modificações selecionadas
function generateModificationsList() {
  const items = document.querySelectorAll('.item');
  let modificationsList = '';
  let hasModifications = false;

  items.forEach(item => {
    const quantityInput = item.querySelector('input.quantity');
    const levelSelect = item.querySelector('select.level');
    const checkbox = item.querySelector('input[type="checkbox"]');
    let itemText = '';

    if (levelSelect) {
      // Itens com níveis
      const level = levelSelect.value;
      if (level !== '0') {
        const itemName = item.querySelector('label').innerText;
        const itemNameWithoutPrice = itemName.split(' - ')[0];
        itemText = `${itemNameWithoutPrice} - Nível ${level}`;
        modificationsList += `${itemText}\n`;
        hasModifications = true;
      }
    } else if (checkbox && checkbox.checked) {
      // Itens com checkbox
      const quantity = parseInt(quantityInput.value) || 1;
      const itemName = item.querySelector('label').innerText;
      const itemNameWithoutPrice = itemName.split(' - ')[0];
      itemText = `${itemNameWithoutPrice} ${quantity}x`;
      modificationsList += `${itemText}\n`;
      hasModifications = true;
    }
  });

  if (!hasModifications) {
    return null;
  }

  return modificationsList;
}

// Função para calcular o valor total
function calculateTotalValue() {
  const totalField = document.getElementById('total').innerText;
  const valorTotal = totalField.replace('Valor Total: ', '');
  return valorTotal;
}

// Função para enviar os dados ao backend
function sendDataToBackend(data) {
  // URL da sua função Netlify
  const netlifyFunctionURL = 'https://mecdopiska.netlify.app/.netlify/functions/sendDiscordWebhook';

  fetch(netlifyFunctionURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (response.ok) {
      alert("Nota fiscal enviada com sucesso!");
    } else {
      response.text().then(text => {
        alert("Erro ao enviar a nota fiscal: " + text);
        console.error('Erro ao enviar para o servidor:', text);
      });
    }
  })
  .catch(error => {
    console.error('Erro:', error);
    alert('Erro ao enviar a nota fiscal.');
  });
}

// Função para atualizar o total quando houver mudanças nos itens
function addEventListeners() {
  const items = document.querySelectorAll('.item');

  items.forEach(item => {
    const quantityInput = item.querySelector('input.quantity');
    const levelSelect = item.querySelector('select.level');
    const checkbox = item.querySelector('input[type="checkbox"]');

    if (levelSelect) {
      levelSelect.addEventListener('change', updateTotal);
      quantityInput.addEventListener('input', updateTotal);
    }

    if (checkbox) {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          quantityInput.disabled = false;
        } else {
          quantityInput.disabled = true;
          quantityInput.value = 1;
        }
        updateTotal();
      });
      quantityInput.addEventListener('input', updateTotal);
    }
  });
}

// Inicializa os event listeners ao carregar a página
window.onload = () => {
  addEventListeners();
  updateTotal(); // Atualiza o total ao carregar a página
};
